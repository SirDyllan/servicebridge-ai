import { serviceCategories } from "@/data/service-directory";

export type GuardrailResult = {
  categoryId: string;
  urgency: "normal" | "sensitive" | "urgent";
  matchedKeywords: string[];
  safetyNote: string;
  blocksDecision: boolean;
};

const keywordRules = [
  {
    categoryId: "emergency-relief",
    urgency: "urgent" as const,
    keywords: [
      "danger",
      "emergency",
      "urgent",
      "today",
      "tonight",
      "homeless",
      "house fire",
      "caught fire",
      "on fire",
      "fire brigade",
      "gas leak",
      "disaster",
      "temporary shelter",
      "no food",
      "hungry",
      "abuse",
      "violence",
      "can't breathe",
      "cannot breathe",
      "bleeding",
      "unconscious",
      "self harm",
      "suicide",
    ],
  },
  {
    categoryId: "food-support",
    urgency: "sensitive" as const,
    keywords: ["food", "groceries", "meal", "hungry", "nutrition", "eat"],
  },
  {
    categoryId: "education-support",
    urgency: "normal" as const,
    keywords: ["school", "student", "university", "fees", "transport", "supplies", "bursary", "scholarship", "training"],
  },
  {
    categoryId: "student-welfare",
    urgency: "sensitive" as const,
    keywords: ["student affairs", "student welfare", "campus", "hardship", "advisor"],
  },
  {
    categoryId: "document-readiness",
    urgency: "normal" as const,
    keywords: [
      "id",
      "identity",
      "birth certificate",
      "proof of residence",
      "document",
      "student letter",
      "driver license",
      "drivers license",
      "driver's license",
      "licence",
      "license",
      "dmv",
    ],
  },
  {
    categoryId: "healthcare-access",
    urgency: "sensitive" as const,
    keywords: ["clinic", "doctor", "medicine", "health", "healthcare", "sick", "pain"],
  },
  {
    categoryId: "employment-youth",
    urgency: "normal" as const,
    keywords: ["job", "lost job", "part-time", "unemployed", "employment", "work", "cv", "income"],
  },
  {
    categoryId: "family-childcare",
    urgency: "sensitive" as const,
    keywords: ["child", "childcare", "dependent", "caregiver", "family", "household"],
  },
  {
    categoryId: "human-referral",
    urgency: "sensitive" as const,
    keywords: ["human", "social worker", "case worker", "official", "verify", "complicated", "legal", "court", "rights"],
  },
];

export function detectGuardrails(query: string): GuardrailResult {
  const normalized = query.toLowerCase();
  const matches = keywordRules
    .map((rule) => ({
      ...rule,
      matchedKeywords: rule.keywords.filter((keyword) => normalized.includes(keyword)),
      score: rule.keywords.filter((keyword) => normalized.includes(keyword)).length + selectedSupportBoost(rule.categoryId, normalized),
    }))
    .filter((rule) => rule.score > 0);

  const urgent = matches.find((match) => match.urgency === "urgent");
  const selected = urgent ?? [...matches].sort((a, b) => b.score - a.score)[0];
  const categoryId = selected?.categoryId ?? "human-referral";
  const category = serviceCategories.find((item) => item.id === categoryId);
  const urgency = urgent ? "urgent" : selected?.urgency ?? (category?.riskLevel === "sensitive" ? "sensitive" : "normal");

  return {
    categoryId,
    urgency,
    matchedKeywords: matches.flatMap((match) => match.matchedKeywords),
    safetyNote: buildSafetyNote(categoryId, urgency),
    blocksDecision: urgency !== "normal" || categoryId === "human-referral",
  };
}

function selectedSupportBoost(categoryId: string, query: string) {
  const selectedLine = extractSupportAreaLines(query).join(", ");
  if (!selectedLine) return 0;

  const selected = selectedLine.toLowerCase();
  const selectedTerms: Record<string, string[]> = {
    "food-support": ["food support", "food", "snap"],
    "education-support": ["education support", "education", "school fees", "beam"],
    "student-welfare": ["student welfare", "student affairs", "campus support"],
    "emergency-relief": ["emergency relief", "bills/utilities", "utilities", "utility", "liheap"],
    "document-readiness": ["id/documents", "id", "documents", "document readiness"],
    "healthcare-access": ["healthcare", "health"],
    "employment-youth": ["employment support", "employment", "job", "business/sme", "business", "sme"],
    "family-childcare": ["family/childcare", "family", "childcare"],
    "human-referral": ["human adviser", "human", "adviser", "advisor"],
  };

  const firstPosition = selectedTerms[categoryId]
    ?.map((term) => selected.indexOf(term))
    .filter((position) => position >= 0)
    .sort((left, right) => left - right)[0];

  if (firstPosition === undefined) return 0;
  return Math.max(6, 10 - Math.floor(firstPosition / 24));
}

function extractSupportAreaLines(query: string) {
  return Array.from(
    query.matchAll(/(?:user selected support areas|plain-language inferred support areas(?:\s*\([^)]+\))?):\s*(.+)/gi),
  ).map((match) => match[1] ?? "");
}

function buildSafetyNote(categoryId: string, urgency: GuardrailResult["urgency"]) {
  if (urgency === "urgent") {
    return "This may be urgent. ServiceBridge AI cannot handle emergencies or replace emergency services. Seek immediate local emergency or trusted human support, then use this checklist only for preparation.";
  }

  if (categoryId === "healthcare-access") {
    return "ServiceBridge AI can explain healthcare-access pathways, but it cannot diagnose, prescribe, or make medical decisions. A qualified health worker must verify health needs.";
  }

  if (categoryId === "human-referral") {
    return "ServiceBridge AI cannot make high-impact decisions or replace a qualified human adviser. Use this output to prepare questions and documents for official verification.";
  }

  return "ServiceBridge AI never approves eligibility. It shows possible matches and document readiness so an official office or qualified human can verify the final decision.";
}
