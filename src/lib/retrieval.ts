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
  const selectedCategoryIds = selectedSupportCategoryIds(normalized);
  const allowedCategoryIds = new Set([
    ...getRelatedCategoryIds(guardrail.categoryId),
    ...selectedCategoryIds,
    ...Array.from(selectedCategoryIds).flatMap((categoryId) => getRelatedCategoryIds(categoryId).slice(0, 2)),
  ]);

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

      const queryTerms = meaningfulQueryTerms(normalized);
      const keywordScore = queryTerms.filter((term) => searchable.includes(term)).length;
      const explicitKeywordScore = meaningfulRecordKeywords(record.keywords).filter((keyword) =>
        normalized.includes(keyword),
      ).length * 2;
      const categoryScore = record.categoryId === guardrail.categoryId ? 6 : 0;
      const selectedSupportScore = selectedCategoryIds.has(record.categoryId) ? 8 : 0;
      const verificationScore =
        record.verificationStatus === "verified" ? 2 : record.verificationStatus === "needs_review" ? -1 : 0;

      return {
        record,
        score:
          categoryScore +
          selectedSupportScore +
          keywordScore +
          explicitKeywordScore +
          verificationScore +
          regionalBoost(record, normalized),
      };
    })
    .filter((item) => {
      if (item.record.categoryId === guardrail.categoryId || selectedCategoryIds.has(item.record.categoryId)) {
        return item.score > 0;
      }

      return item.score >= 4;
    })
    .sort((a, b) => b.score - a.score);

  const records = pickResultRecords(scoredRecords, directoryRecords, guardrail.categoryId, normalized, selectedCategoryIds);
  const coverage = getCoverage(records);

  return {
    categoryId: category.id,
    categoryName: selectedCategoryIds.size ? selectedCategoryNames(selectedCategoryIds).join(", ") : category.name,
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
  return /\b(sick|ill|unwell|not feeling well|pain|fever|health|healthcare|medical|clinic|hospital|doctor|medicine|prescription|pregnant|disability|coverage|insurance)\b/i.test(
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

function mentionsLocation(query: string) {
  return (
    /\b(mutare|harare|bulawayo|gweru|masvingo|zimbabwe|texas|houston|dallas|austin|usa|united states|america)\b/i.test(
      query,
    ) || /\b(in|near|around|at)\s+[a-z][a-z\s-]{2,40}\b/i.test(query)
  );
}

function mentionsDriverLicenseNeed(query: string) {
  return /\b(driver'?s?\s+license|drivers\s+license|driving\s+license|licence|license|dmv|learner'?s?\s+permit|learner permit)\b/i.test(
    query,
  );
}

function isImmediateEmergencyQuery(query: string) {
  return /\b(house caught fire|house is on fire|home caught fire|home is on fire|building is on fire|fire in my house|caught fire|on fire|trapped|gas leak|serious accident)\b/i.test(
    query,
  );
}

function shouldAskIncomeQuestion(query: string, categoryId: string) {
  if (categoryId === "document-readiness" || categoryId === "healthcare-access") return false;
  if (/\b(income|lost job|lost income|unemployed|no income|proof of income|payslip)\b/i.test(query)) return false;
  return ["food-support", "emergency-relief", "employment-youth", "family-childcare"].includes(categoryId);
}

function shouldAskStudentQuestion(query: string, categoryId: string) {
  if (categoryId === "document-readiness") return false;
  if (/\b(student|school|college|university|enrolled|learner)\b/i.test(query)) return false;
  return ["education-support", "student-welfare"].includes(categoryId);
}

export function buildFallbackGuidance(query: string, retrieval: RetrievalResult): BenefitsGuidance {
  const possibleMatches = retrieval.records.map((record, index) => recordToMatch(record, query, index));
  const documentReadiness = buildDocumentReadiness(query, retrieval.records, retrieval.categoryId);
  const followUpQuestions = buildContextualFollowUpQuestions(query, retrieval);
  const nextSteps = buildContextualNextSteps(query, retrieval);
  const humanReferral = buildContextualHumanReferral(query, retrieval);

  return {
    summary:
      isImmediateEmergencyQuery(query)
        ? "This may be an active emergency first and a support-navigation issue second. Immediate safety and emergency responders come before benefit or document guidance."
        : "You may match one or more support pathways, but this is not a final eligibility decision. The safest next step is to prepare documents, review the possible matches, and verify with the official office or a human adviser.",
    followUpQuestions,
    possibleMatches,
    documentReadiness,
    nextSteps,
    safetyNote: `${retrieval.safetyNote} ${retrieval.directoryNote}`,
    humanReferral,
  };
}

function buildContextualFollowUpQuestions(query: string, retrieval: RetrievalResult) {
  const normalized = query.toLowerCase();
  const questions: string[] = [];

  if (isImmediateEmergencyQuery(normalized)) {
    if (!mentionsLocation(normalized)) {
      questions.push("What city or area are you in, after you are safe, so recovery/support office options can be narrowed?");
    }
    return questions;
  }

  if (!mentionsLocation(normalized)) {
    questions.push(
      retrieval.categoryId === "document-readiness"
        ? "What city, state, or country should be used to narrow the official document office?"
        : "What city, campus, or area should be used to narrow support options?",
    );
  }

  if (retrieval.categoryId === "document-readiness") {
    if (mentionsDriverLicenseNeed(normalized)) {
      questions.push("Are you applying for a new driver's license, replacing one, or checking the document list first?");
    } else if (!mentionsIdentityNeed(normalized)) {
      questions.push("Are you applying for a new ID, replacing a lost ID, or checking documents for another application?");
    }

    return questions.slice(0, 2);
  }

  if (retrieval.categoryId === "healthcare-access" && !/\b(urgent|emergency|today|right now)\b/i.test(normalized)) {
    questions.push("Is this urgent right now, or are you looking for help accessing affordable healthcare support?");
  }

  if (shouldAskIncomeQuestion(normalized, retrieval.categoryId)) {
    questions.push("Do you have any income right now, or did your income recently change?");
  }

  if (shouldAskStudentQuestion(normalized, retrieval.categoryId)) {
    questions.push("Are you currently enrolled at a school, college, or university?");
  }

  return questions.slice(0, 2);
}

function buildContextualNextSteps(query: string, retrieval: RetrievalResult) {
  if (isImmediateEmergencyQuery(query)) {
    return [
      "If there is active danger, leave the area if safe and contact local emergency services or the fire brigade now.",
      "After you are safe, ask a trusted human, social services office, or verified relief organization about temporary shelter, food, clothing, and urgent recovery help.",
      "When safe, prepare a short explanation of what happened and ask which documents can wait until later.",
    ];
  }

  if (retrieval.categoryId === "document-readiness") {
    return [
      "Confirm which official office handles the license, ID, or civil-registration process in your area.",
      "Prepare identity proof, proof of residence, and any previous license or ID record if available.",
      "Verify appointment, fee, form, and accepted-document rules before travelling.",
    ];
  }

  return [
    "Review the possible support pathways and note what is uncertain.",
    "Prepare only the documents that fit this pathway before applying or visiting an office.",
    "Contact a student affairs office, social worker, public support office, or verified organization for final eligibility verification.",
  ];
}

function buildContextualHumanReferral(query: string, retrieval: RetrievalResult) {
  if (isImmediateEmergencyQuery(query)) {
    return {
      title: "Immediate human help required",
      reason:
        "Active emergencies need emergency responders or trusted humans first. The AI can only help organize recovery information after immediate safety is handled.",
      options: [
        "Local emergency services or fire brigade",
        "Trusted nearby adult, neighbour, school official, or community leader",
        "Social services office or verified disaster relief organization",
        "Police, fire, ambulance, or emergency response provider where appropriate",
      ],
      verificationStep:
        "After you are safe, ask the responder or support provider what recovery documents, incident proof, temporary shelter, food, clothing, and replacement-document steps are needed.",
    };
  }

  if (retrieval.categoryId === "document-readiness") {
    return {
      title: "Official document office verification required",
      reason:
        "License, ID, birth-certificate, and residence-proof rules depend on the official office and location.",
      options: [
        "DMV, licensing office, or state ID office in the USA",
        "Civil Registry, National Registry, or National ID office in Zimbabwe",
        "Official document or civil-registration office in other locations",
      ],
      verificationStep:
        "Ask the official office to confirm accepted documents, fees, forms, appointments, and whether alternatives are allowed.",
    };
  }

  return {
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
  };
}

export function normalizeGuidance(raw: Partial<BenefitsGuidance>, fallback: BenefitsGuidance): BenefitsGuidance {
  return {
    summary: asText(raw.summary, fallback.summary),
    followUpQuestions: asStringArray(raw.followUpQuestions, fallback.followUpQuestions).slice(0, 2),
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

function pickResultRecords(
  scoredRecords: ScoredRecord[],
  directoryRecords: ServiceRecord[],
  categoryId: string,
  query: string,
  selectedCategoryIds: Set<string>,
) {
  const includeDocumentReadiness = categoryId === "document-readiness" || mentionsDocumentBarrier(query);
  const includeHumanReferral = categoryId === "human-referral" || mentionsHumanReferralNeed(query);
  const picked: ServiceRecord[] = [];

  for (const item of scoredRecords) {
    if (item.record.categoryId === "document-readiness" && !includeDocumentReadiness) continue;
    if (item.record.categoryId === "human-referral" && !includeHumanReferral) continue;
    if (!picked.some((record) => record.id === item.record.id)) picked.push(item.record);
    if (picked.length >= 5) break;
  }

  for (const mustHave of [
    includeDocumentReadiness ? "document-readiness" : "",
    includeHumanReferral ? "human-referral" : "",
  ].filter(Boolean)) {
    if (!picked.some((record) => record.categoryId === mustHave)) {
      const supportRecord = directoryRecords.find((record) => record.categoryId === mustHave);
      if (supportRecord) picked.push(supportRecord);
    }
  }

  if (!picked.length) {
    const fallbackCategoryIds = selectedCategoryIds.size ? selectedCategoryIds : new Set([categoryId]);
    return directoryRecords
      .filter((record) => fallbackCategoryIds.has(record.categoryId))
      .filter((record) => record.categoryId !== "human-referral")
      .slice(0, 4);
  }

  return picked.slice(0, 5);
}

function selectedSupportCategoryIds(query: string) {
  const selected = new Set<string>();
  const selectedSegments = extractSupportAreaLines(query)
    .flatMap((line) => line.split(","))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  for (const segment of selectedSegments) {
    const categoryId = selectedSupportCategoryIdForText(segment);
    if (categoryId) selected.add(categoryId);
  }

  if (selected.size) return selected;

  const selectedLine = selectedSegments.join(", ");
  if (!selectedLine) return selected;

  const fallbackCategoryId = selectedSupportCategoryIdForText(selectedLine);
  if (fallbackCategoryId) selected.add(fallbackCategoryId);

  return selected;
}

function selectedSupportCategoryIdForText(text: string) {
  if (/\bfood\b|snap/.test(text)) return "food-support";
  if (/education|school|beam/.test(text)) return "education-support";
  if (/student welfare|student affairs|campus/.test(text)) return "student-welfare";
  if (/emergency|bills|utilit|liheap/.test(text)) return "emergency-relief";
  if (/health/.test(text)) return "healthcare-access";
  if (/employment|job|business|sme/.test(text)) return "employment-youth";
  if (/family|childcare|child/.test(text)) return "family-childcare";
  if (/\bid\b|document/.test(text)) return "document-readiness";
  if (/human|adviser|advisor/.test(text)) return "human-referral";
  return "";
}

function extractSupportAreaLines(query: string) {
  return Array.from(
    query.matchAll(/(?:user selected support areas|plain-language inferred support areas(?:\s*\([^)]+\))?):\s*(.+)/gi),
  ).map((match) => match[1] ?? "");
}

function selectedCategoryNames(categoryIds: Set<string>) {
  return Array.from(categoryIds).map((categoryId) => {
    return serviceCategories.find((category) => category.id === categoryId)?.name ?? categoryId;
  });
}

function meaningfulQueryTerms(query: string) {
  const stopwords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "user",
    "selected",
    "support",
    "areas",
    "area",
    "situation",
    "need",
    "needs",
    "help",
    "location",
    "city",
    "country",
    "campus",
    "status",
    "proof",
    "has",
    "yes",
    "not",
    "available",
    "unknown",
    "normal",
    "week",
    "this_week",
    "zimbabwe",
    "usa",
    "united",
    "states",
  ]);

  return query
    .split(/\W+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2 && !stopwords.has(term));
}

function meaningfulRecordKeywords(keywords: string[]) {
  const genericKeywords = new Set([
    "support",
    "access",
    "usa",
    "united states",
    "america",
    "zimbabwe",
    "mutare",
    "harare",
    "bulawayo",
  ]);
  return keywords.filter((keyword) => keyword.length > 2 && !genericKeywords.has(keyword.toLowerCase()));
}

function mentionsDocumentBarrier(query: string) {
  return /\b(has id:\s*no|has proof of residence:\s*no|has student letter:\s*no|has proof of income\/unemployment:\s*no|do not have an id|don't have an id|no id|missing id|lost id|birth certificate|proof of residence|id\/documents)\b/i.test(
    query,
  );
}

function mentionsHumanReferralNeed(query: string) {
  return /\b(human adviser|human advisor|social worker|case worker|official verification|speak to human|human referral)\b/i.test(
    query,
  );
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

function buildDocumentReadiness(query: string, records: ServiceRecord[], categoryId: string) {
  const normalized = query.toLowerCase();
  const items: DocumentChecklistItem[] = [];
  const documentOnly = categoryId === "document-readiness";
  const immediateEmergency = isImmediateEmergencyQuery(normalized);
  const needsIncomeProof =
    !documentOnly &&
    !immediateEmergency &&
    (["food-support", "emergency-relief", "employment-youth", "family-childcare"].includes(categoryId) ||
      /\b(food|snap|liheap|utility|cash|income|lost job|unemployed|family|child|dependent)\b/i.test(normalized));
  const needsStudentProof =
    !documentOnly &&
    !immediateEmergency &&
    (["education-support", "student-welfare"].includes(categoryId) ||
      /\b(student|school|college|university|beam|fees|campus)\b/i.test(normalized));

  if (immediateEmergency) {
    items.push(
      {
        name: "Current safe location",
        status: mentionsLocation(normalized) ? "available" : "unknown",
        guidance:
          "Emergency responders or trusted humans need to know where the person is. Only share location when it is safe to do so.",
      },
      {
        name: "Short explanation of what happened",
        status: normalized.length > 20 ? "available" : "unknown",
        guidance:
          "After immediate safety is handled, write a short summary for social services, relief providers, school officials, or document-replacement offices.",
      },
      {
        name: "ID if available after safety is handled",
        status: normalized.includes("has id: yes") ? "available" : normalized.includes("has id: no") ? "missing" : "unknown",
        guidance:
          "Do not go back into danger to collect ID. If documents were lost, ask the relief provider which alternatives are accepted.",
      },
      {
        name: "Fire, police, or incident report if issued later",
        status: "unknown",
        guidance:
          "Only prepare this after responders or officials provide it. Do not delay emergency help while looking for paperwork.",
      },
    );
  } else {
    items.push({
      name: "ID or alternative identity proof",
      status:
        normalized.includes("has id: no") ||
        normalized.includes("do not have an id") ||
        normalized.includes("don't have an id") ||
        normalized.includes("no id")
          ? "missing"
          : normalized.includes("has id: yes")
            ? "available"
            : "unknown",
      guidance:
        "Most support pathways ask for identity proof. If ID is missing, prepare a birth certificate or other official identity evidence where available.",
    });

    items.push({
      name: "Proof of residence",
      status: normalized.includes("has proof of residence: yes")
        ? "available"
        : normalized.includes("has proof of residence: no")
          ? "missing"
          : "unknown",
      guidance: "Rules differ by location. Ask the official office what counts as acceptable proof of residence.",
    });

    if (documentOnly && mentionsDriverLicenseNeed(normalized)) {
      items.push({
        name: "Previous license, learner permit, or driver record if available",
        status: "unknown",
        guidance:
          "Driver's-license rules depend on the official licensing office. Ask which previous records or test documents are accepted.",
      });
    }

    if (needsIncomeProof) {
      items.push({
        name: "Proof of income or unemployment",
        status: normalized.includes("has proof of income/unemployment: yes")
          ? "available"
          : normalized.includes("has proof of income/unemployment: no")
            ? "missing"
            : normalized.includes("lost") || normalized.includes("unemployed")
              ? "unknown"
              : "unknown",
        guidance:
          "Prepare a short work-history note, termination message, income-change evidence, payslip, or unemployment proof if available.",
      });
    }

    if (needsStudentProof) {
      items.push({
        name: "Student letter or proof of enrollment",
        status: normalized.includes("has student letter: yes")
          ? "available"
          : normalized.includes("has student letter: no")
            ? "missing"
            : "unknown",
        guidance: "Student support pathways usually need a student card, student number, or enrollment letter.",
      });
    }

    items.push({
      name: "Birth certificate if ID is missing",
      status: normalized.includes("no id") || normalized.includes("do not have an id") ? "missing" : "unknown",
      guidance: "If an ID is missing, ask the identity-document office whether a birth certificate or guardian document is needed.",
    });
  }

  const allDocuments = Array.from(new Set(records.flatMap((record) => record.documentsNeeded)));
  const missingDocuments = items.filter((item) => item.status === "missing").map((item) => item.name);
  const summary = immediateEmergency
    ? "Immediate safety comes first. These items are for recovery support after the person is safe, not a condition for emergency response."
    : documentOnly
      ? "This checklist is focused on the document or license process. Income and student proof are only needed if the official office or a separate benefit program asks for them."
      : missingDocuments.length > 0
        ? `You have ${missingDocuments.length} important missing document area${missingDocuments.length === 1 ? "" : "s"} to prepare before applying.`
        : "Some document statuses are still unknown. Confirm the checklist before applying or visiting an office.";

  return {
    summary,
    items,
    missingDocuments,
    idPreparationSteps: immediateEmergency
      ? [
          "Do not return to danger for documents.",
          "After safety is handled, ask responders or a relief provider what proof can be created later.",
          "If documents were lost, ask which identity alternatives are accepted for relief, shelter, or replacement documents.",
        ]
      : [
          "Confirm which official office handles ID, licensing, or civil registration in your area.",
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
