import { serviceCategories, serviceRecords, type ServiceRecord } from "@/data/service-directory";
import { detectGuardrails } from "@/lib/guardrails";
import type { BenefitMatch, BenefitsGuidance, DocumentChecklistItem, GuidanceResponse, MatchLevel } from "@/types/benefits";

export type RetrievalResult = {
  categoryId: string;
  categoryName: string;
  urgency: "normal" | "sensitive" | "urgent";
  matchedKeywords: string[];
  records: ServiceRecord[];
  coverage: "strong" | "limited" | "sample_only";
  directoryNote: string;
  safetyNote: string;
  blocksDecision: boolean;
};

type ScoredRecord = {
  record: ServiceRecord;
  score: number;
};

export function retrieveServices(query: string, directoryRecords: ServiceRecord[] = serviceRecords): RetrievalResult {
  const guardrail = detectGuardrails(query);
  const category = serviceCategories.find((item) => item.id === guardrail.categoryId) ?? serviceCategories[0];
  const normalized = query.toLowerCase();
  const allowedCategoryIds = new Set(getRelatedCategoryIds(guardrail.categoryId));

  const scoredRecords = directoryRecords
    .filter((record) => allowedCategoryIds.has(record.categoryId) || regionalBoost(record, normalized) > 0)
    .filter((record) => recordMatchesRegionalContext(record, normalized))
    .map((record): ScoredRecord => {
      const searchable = [
        record.serviceName,
        record.category,
        record.targetUser,
        record.possibleEligibility,
        record.sourceLabel,
        record.location,
        record.keywords.join(" "),
        record.documentsNeeded.join(" "),
        record.steps.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const queryTerms = normalized.split(/\W+/).filter((term) => term.length > 2);
      const keywordScore = queryTerms.filter((term) => searchable.includes(term)).length;
      const explicitKeywordScore = record.keywords.filter((keyword) => normalized.includes(keyword)).length * 2;
      const categoryScore = record.categoryId === guardrail.categoryId ? 6 : 0;
      const verificationScore =
        record.verificationStatus === "verified" ? 2 : record.verificationStatus === "needs_review" ? -1 : 0;

      return {
        record,
        score: categoryScore + keywordScore + explicitKeywordScore + verificationScore + regionalBoost(record, normalized),
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const records = pickResultRecords(scoredRecords, directoryRecords, guardrail.categoryId);
  const coverage = getCoverage(records);

  return {
    categoryId: category.id,
    categoryName: category.name,
    urgency: guardrail.urgency,
    matchedKeywords: guardrail.matchedKeywords,
    records,
    coverage,
    directoryNote: buildDirectoryNote(coverage, records.length),
    safetyNote: guardrail.safetyNote,
    blocksDecision: guardrail.blocksDecision,
  };
}

function recordMatchesRegionalContext(record: ServiceRecord, query: string) {
  if (record.id.startsWith("usa-")) {
    return mentionsUsa(query) || /\b(snap|food stamps|medicaid|chip|tanf|liheap|real id|dmv)\b/i.test(query);
  }

  if (record.id.startsWith("zim-")) {
    if (mentionsUsa(query) && !mentionsZimbabwe(query)) return false;
    if (record.id === "zim-beam-education-assistance") return mentionsZimbabwe(query) && mentionsBeamLikeNeed(query);
    if (record.id === "zim-public-assistance-social-welfare") return mentionsZimbabwe(query) && mentionsSocialWelfareNeed(query);
    if (record.id === "zim-id-replacement-civil-registry") return mentionsZimbabwe(query) && mentionsIdentityNeed(query);
    if (record.id === "zim-public-health-facility-access") return mentionsZimbabwe(query) && mentionsHealthcareNeed(query);
    if (record.id === "zim-women-sme-support") return mentionsZimbabwe(query) && mentionsBusinessNeed(query);
    if (mentionsZimbabwe(query)) return true;
    return (
      (record.id === "zim-beam-education-assistance" && mentionsBeamLikeNeed(query)) ||
      (record.id === "zim-public-assistance-social-welfare" && mentionsSocialWelfareNeed(query))
    );
  }

  return true;
}

function regionalBoost(record: ServiceRecord, query: string) {
  if (record.id === "usa-snap-food-assistance") {
    if (mentionsUsa(query) && mentionsFoodNeed(query)) return 12;
    if (/\b(snap|food stamps)\b/i.test(query)) return 14;
    if (/\b(parents?|family|household)\b.*\b(usa|united states|america)\b/i.test(query)) return 10;
  }

  if (record.id === "zim-beam-education-assistance") {
    if (mentionsZimbabwe(query) && mentionsBeamLikeNeed(query)) return 12;
    if (/\bbeam\b/i.test(query)) return 14;
    if (mentionsBeamLikeNeed(query)) return 6;
  }

  if (record.id === "usa-medicaid-chip-healthcare") {
    if (mentionsUsa(query) && mentionsHealthcareNeed(query)) return 12;
    if (/\b(medicaid|chip)\b/i.test(query)) return 14;
  }

  if (record.id === "usa-tanf-family-assistance") {
    if (mentionsUsa(query) && mentionsFamilyCashNeed(query)) return 12;
    if (/\btanf\b/i.test(query)) return 14;
  }

  if (record.id === "usa-liheap-energy-assistance") {
    if (mentionsUsa(query) && mentionsUtilityNeed(query)) return 12;
    if (/\bliheap\b/i.test(query)) return 14;
  }

  if (record.id === "usa-real-id-document-readiness") {
    if (mentionsUsa(query) && mentionsUsDocumentNeed(query)) return 12;
    if (/\b(real id|state id|dmv)\b/i.test(query)) return 14;
  }

  if (record.id === "zim-public-assistance-social-welfare") {
    if (mentionsZimbabwe(query) && mentionsSocialWelfareNeed(query)) return 12;
    if (/\b(public assistance|social welfare|social development)\b/i.test(query)) return 14;
  }

  if (record.id === "zim-id-replacement-civil-registry") {
    if (mentionsZimbabwe(query) && mentionsIdentityNeed(query)) return 12;
    if (/\b(civil registry|national id|lost id|replace id)\b/i.test(query)) return 14;
  }

  if (record.id === "zim-public-health-facility-access") {
    if (mentionsZimbabwe(query) && mentionsHealthcareNeed(query)) return 12;
  }

  if (record.id === "zim-women-sme-support") {
    if (mentionsZimbabwe(query) && mentionsBusinessNeed(query)) return 12;
    if (/\b(women affairs|sme)\b/i.test(query)) return 14;
  }

  return 0;
}

function mentionsUsa(query: string) {
  return /\b(usa|u\.s\.a\.|us\b|u\.s\.|united states|america|american)\b/i.test(query);
}

function mentionsZimbabwe(query: string) {
  return /\b(zimbabwe|zim\b|mutare|harare|bulawayo|gweru|masvingo)\b/i.test(query);
}

function mentionsFoodNeed(query: string) {
  return /\b(food|groceries|meal|hungry|nutrition|eat)\b/i.test(query);
}

function mentionsBeamLikeNeed(query: string) {
  return /\b(beam|school fees|school fee|fees|orphan|vulnerable child|no guardian|no caretaker|no one takes care|child|learner)\b/i.test(
    query,
  );
}

function mentionsHealthcareNeed(query: string) {
  return /\b(health|healthcare|medical|clinic|hospital|doctor|medicine|prescription|pregnant|disability|coverage|insurance)\b/i.test(
    query,
  );
}

function mentionsFamilyCashNeed(query: string) {
  return /\b(tanf|cash assistance|family|children|child|parent|caregiver|household|dependent|needy families)\b/i.test(query);
}

function mentionsUtilityNeed(query: string) {
  return /\b(liheap|utility|utilities|electricity|energy|heating|cooling|shutoff|disconnect|power bill|water bill|bill)\b/i.test(
    query,
  );
}

function mentionsUsDocumentNeed(query: string) {
  return /\b(real id|state id|dmv|driver'?s? license|license|social security|state residency)\b/i.test(query);
}

function mentionsSocialWelfareNeed(query: string) {
  return /\b(public assistance|social welfare|social development|vulnerable|household|low income|disability|elderly|orphan|destitute)\b/i.test(
    query,
  );
}

function mentionsIdentityNeed(query: string) {
  return /\b(national id|lost id|replace id|id replacement|civil registry|birth certificate|identity document|do not have an id|no id)\b/i.test(
    query,
  );
}

function mentionsBusinessNeed(query: string) {
  return /\b(women affairs|sme|small business|business|entrepreneur|training|empowerment|project|group|startup|self employed)\b/i.test(
    query,
  );
}

export function buildFallbackGuidance(query: string, retrieval: RetrievalResult): BenefitsGuidance {
  const possibleMatches = retrieval.records.map((record, index) => recordToMatch(record, query, index));
  const documentReadiness = buildDocumentReadiness(query, retrieval.records);

  return {
    summary:
      "You may match one or more support pathways, but this is not a final eligibility decision. The safest next step is to prepare documents, review the possible matches, and verify with the official office or a human adviser.",
    followUpQuestions: [
      "What city, campus, or area should be used to narrow support options?",
      "Do you have an ID, proof of residence, proof of income or unemployment, and a student letter?",
      "Is the food or financial need urgent today, this week, or part of a normal application?",
    ],
    possibleMatches,
    documentReadiness,
    nextSteps: [
      "Review the possible support pathways and note what is uncertain.",
      "Prepare the missing documents in the checklist before applying or visiting an office.",
      "Contact a student affairs office, social worker, public support office, or verified organization for final eligibility verification.",
    ],
    safetyNote: `${retrieval.safetyNote} ${retrieval.directoryNote}`,
    humanReferral: {
      title: "Human verification required",
      reason:
        "Benefit eligibility, deadlines, document rules, and emergency support decisions can change by location and program.",
      options: [
        "Student affairs or student welfare office",
        "Social worker or community case worker",
        "Official public support or welfare office",
        "Verified food-relief or emergency-support organization",
      ],
      verificationStep:
        "Take the AI checklist and ask the human adviser to confirm eligibility, required documents, deadlines, and where to apply.",
    },
  };
}

export function normalizeGuidance(raw: Partial<BenefitsGuidance>, fallback: BenefitsGuidance): BenefitsGuidance {
  return {
    summary: asText(raw.summary, fallback.summary),
    followUpQuestions: asStringArray(raw.followUpQuestions, fallback.followUpQuestions),
    possibleMatches: rankMatchesLikeFallback(normalizeMatches(raw.possibleMatches, fallback.possibleMatches), fallback.possibleMatches),
    documentReadiness: {
      summary: asText(raw.documentReadiness?.summary, fallback.documentReadiness.summary),
      items: Array.isArray(raw.documentReadiness?.items) ? raw.documentReadiness.items : fallback.documentReadiness.items,
      missingDocuments: asStringArray(raw.documentReadiness?.missingDocuments, fallback.documentReadiness.missingDocuments),
      idPreparationSteps: asStringArray(raw.documentReadiness?.idPreparationSteps, fallback.documentReadiness.idPreparationSteps),
    },
    nextSteps: asStringArray(raw.nextSteps, fallback.nextSteps),
    safetyNote: fallback.safetyNote,
    humanReferral: {
      title: asText(raw.humanReferral?.title, fallback.humanReferral.title),
      reason: asText(raw.humanReferral?.reason, fallback.humanReferral.reason),
      options: asStringArray(raw.humanReferral?.options, fallback.humanReferral.options),
      verificationStep: asText(raw.humanReferral?.verificationStep, fallback.humanReferral.verificationStep),
    },
  };
}

export function guidanceToLegacyServiceOptions(guidance: BenefitsGuidance) {
  return guidance.possibleMatches.map((match) => ({
    name: match.name,
    type: match.category,
    location: match.location,
    contact: match.sourceLabel,
    openingHours: match.verificationStatus === "verified" ? "Check official source" : "Verify before visiting",
  }));
}

function pickResultRecords(scoredRecords: ScoredRecord[], directoryRecords: ServiceRecord[], categoryId: string) {
  const picked = scoredRecords.slice(0, 4).map((item) => item.record);

  for (const mustHave of ["document-readiness", "human-referral"]) {
    if (!picked.some((record) => record.categoryId === mustHave)) {
      const supportRecord = directoryRecords.find((record) => record.categoryId === mustHave);
      if (supportRecord) picked.push(supportRecord);
    }
  }

  if (!picked.length) {
    return directoryRecords.filter((record) => record.categoryId === categoryId).slice(0, 3);
  }

  return picked.slice(0, 5);
}

function getCoverage(records: ServiceRecord[]): RetrievalResult["coverage"] {
  if (records.some((record) => record.verificationStatus === "verified")) {
    return "strong";
  }

  if (records.some((record) => record.verificationStatus === "needs_review") || records.length < 2) {
    return "limited";
  }

  return "sample_only";
}

function buildDirectoryNote(coverage: RetrievalResult["coverage"], recordCount: number) {
  if (coverage === "strong") {
    return `${recordCount} support records were found, including verified records.`;
  }

  if (coverage === "limited") {
    return `${recordCount} support records were found, but at least one needs review or coverage is limited. Confirm details with a human or official source.`;
  }

  return `${recordCount} MVP sample records were found. This demo shows the reasoning pattern; real deployment would replace samples with verified local records.`;
}

function getRelatedCategoryIds(categoryId: string) {
  const related: Record<string, string[]> = {
    "food-support": [
      "food-support",
      "student-welfare",
      "document-readiness",
      "emergency-relief",
      "family-childcare",
      "human-referral",
    ],
    "education-support": [
      "education-support",
      "student-welfare",
      "document-readiness",
      "employment-youth",
      "family-childcare",
      "human-referral",
    ],
    "student-welfare": ["student-welfare", "food-support", "education-support", "document-readiness", "human-referral"],
    "emergency-relief": [
      "emergency-relief",
      "food-support",
      "document-readiness",
      "family-childcare",
      "human-referral",
    ],
    "document-readiness": [
      "document-readiness",
      "food-support",
      "education-support",
      "student-welfare",
      "employment-youth",
      "human-referral",
    ],
    "healthcare-access": ["healthcare-access", "family-childcare", "document-readiness", "human-referral"],
    "employment-youth": [
      "employment-youth",
      "food-support",
      "education-support",
      "document-readiness",
      "family-childcare",
      "human-referral",
    ],
    "family-childcare": [
      "family-childcare",
      "food-support",
      "education-support",
      "emergency-relief",
      "document-readiness",
      "human-referral",
    ],
    "human-referral": ["human-referral", "food-support", "document-readiness", "student-welfare"],
  };

  return related[categoryId] ?? [categoryId, "document-readiness", "human-referral"];
}

function recordToMatch(record: ServiceRecord, query: string, index: number): BenefitMatch {
  return {
    id: record.id,
    name: record.serviceName,
    category: record.category,
    whyThisMayFit: buildWhyThisMayFit(record, query),
    documentsNeeded: record.documentsNeeded,
    nextSteps: record.steps.slice(0, 3),
    sourceLabel: record.sourceLabel,
    sourceUrl: record.sourceUrl,
    verificationStatus: record.verificationStatus,
    matchLevel: getMatchLevel(index, record),
    uncertaintyNote:
      record.verificationStatus === "verified"
        ? "Program fit still depends on the official office reviewing your details."
        : "This MVP record is not final source-of-truth data; verify requirements with the listed office or a human adviser.",
    location: record.location,
    coordinates: record.coordinates,
    lastVerified: record.lastVerified,
  };
}

function buildWhyThisMayFit(record: ServiceRecord, query: string) {
  const lower = query.toLowerCase();
  const hits = record.keywords.filter((keyword) => lower.includes(keyword));
  if (hits.length) {
    return `This may fit because your situation mentions ${hits.slice(0, 3).join(", ")}, which connects to ${record.category.toLowerCase()} readiness.`;
  }

  return record.possibleEligibility;
}

function getMatchLevel(index: number, record: ServiceRecord): MatchLevel {
  if (index === 0 && record.verificationStatus !== "needs_review") return "High";
  if (index <= 2) return "Medium";
  return "Low";
}

function buildDocumentReadiness(query: string, records: ServiceRecord[]) {
  const normalized = query.toLowerCase();
  const items: DocumentChecklistItem[] = [
    {
      name: "ID or alternative identity proof",
      status: normalized.includes("do not have an id") || normalized.includes("don't have an id") ? "missing" : "unknown",
      guidance:
        "Most support pathways ask for identity proof. If ID is missing, prepare a birth certificate or other official identity evidence where available.",
    },
    {
      name: "Proof of residence",
      status: normalized.includes("proof of residence") ? "available" : "unknown",
      guidance: "Rules differ by location. Ask the official office what counts as acceptable proof of residence.",
    },
    {
      name: "Proof of income or unemployment",
      status: normalized.includes("lost") || normalized.includes("unemployed") ? "missing" : "unknown",
      guidance:
        "Prepare a short work-history note, termination message, income-change evidence, payslip, or unemployment proof if available.",
    },
    {
      name: "Student letter or proof of enrollment",
      status: normalized.includes("student") ? "unknown" : "unknown",
      guidance: "Student support pathways usually need a student card, student number, or enrollment letter.",
    },
    {
      name: "Birth certificate if ID is missing",
      status: normalized.includes("no id") || normalized.includes("do not have an id") ? "missing" : "unknown",
      guidance: "If an ID is missing, ask the identity-document office whether a birth certificate or guardian document is needed.",
    },
  ];

  const allDocuments = Array.from(new Set(records.flatMap((record) => record.documentsNeeded)));
  const missingDocuments = items.filter((item) => item.status === "missing").map((item) => item.name);

  return {
    summary:
      missingDocuments.length > 0
        ? `You have ${missingDocuments.length} important missing document area${missingDocuments.length === 1 ? "" : "s"} to prepare before applying.`
        : "Some document statuses are still unknown. Confirm the checklist before applying or visiting an office.",
    items,
    missingDocuments,
    idPreparationSteps: [
      "Confirm which official office handles ID or civil registration in your area.",
      "Prepare a birth certificate or existing identity proof if available.",
      "Ask whether guardian or parent documents are required for your age and context.",
      "Ask whether proof of residence, an application form, a report, or a fee is required before traveling.",
    ],
    allDocuments,
  };
}

function normalizeMatches(raw: unknown, fallback: BenefitMatch[]): BenefitMatch[] {
  if (!Array.isArray(raw)) return fallback;

  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return fallback[index] ?? fallback[0];
      const match = item as Partial<BenefitMatch>;
      return {
        id: asText(match.id, fallback[index]?.id ?? `match-${index}`),
        name: asText(match.name, fallback[index]?.name ?? "Possible support pathway"),
        category: asText(match.category, fallback[index]?.category ?? "Benefits"),
        whyThisMayFit: asText(match.whyThisMayFit, fallback[index]?.whyThisMayFit ?? "This may fit based on the information shared."),
        documentsNeeded: asStringArray(match.documentsNeeded, fallback[index]?.documentsNeeded ?? []),
        nextSteps: asStringArray(match.nextSteps, fallback[index]?.nextSteps ?? []),
        sourceLabel: asText(match.sourceLabel, fallback[index]?.sourceLabel ?? "MVP sample record"),
        sourceUrl: asText(match.sourceUrl, fallback[index]?.sourceUrl ?? ""),
        officialProgramUrl: asText(match.officialProgramUrl, fallback[index]?.officialProgramUrl ?? ""),
        officeSearchUrl: asText(match.officeSearchUrl, fallback[index]?.officeSearchUrl ?? ""),
        applicationUrl: asText(match.applicationUrl, fallback[index]?.applicationUrl ?? ""),
        verificationStatus: match.verificationStatus ?? fallback[index]?.verificationStatus ?? "sample",
        matchLevel: match.matchLevel ?? fallback[index]?.matchLevel ?? "Medium",
        uncertaintyNote: asText(match.uncertaintyNote, fallback[index]?.uncertaintyNote ?? "Please verify with an official office."),
        location: asText(match.location, fallback[index]?.location ?? "Official or human support office"),
        coordinates: match.coordinates ?? fallback[index]?.coordinates,
        lastVerified: asText(match.lastVerified, fallback[index]?.lastVerified ?? ""),
      } satisfies BenefitMatch;
    })
    .filter((match): match is BenefitMatch => Boolean(match));
}

function rankMatchesLikeFallback(matches: BenefitMatch[], fallback: BenefitMatch[]) {
  const fallbackOrder = new Map(fallback.map((match, index) => [match.id, index]));

  return [...matches].sort((left, right) => {
    return (fallbackOrder.get(left.id) ?? 999) - (fallbackOrder.get(right.id) ?? 999);
  });
}

function asText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : fallback;
}

export function responseDocuments(response: GuidanceResponse) {
  return response.guidance.documentReadiness.items.map((item) => item.name);
}
