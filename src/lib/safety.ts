import type { ChatUrgency } from "@/types/chat";

export type SafetyAssessment = {
  urgency: ChatUrgency;
  category: "standard" | "emergency" | "medical" | "legal" | "abuse" | "self-harm";
  matchedPhrases: string[];
  shouldLimitAdvice: boolean;
  safetyMessage: string;
};

const phraseGroups = [
  {
    category: "self-harm" as const,
    urgency: "emergency" as const,
    phrases: ["self harm", "self-harm", "suicide", "kill myself", "end my life", "hurt myself"],
  },
  {
    category: "abuse" as const,
    urgency: "emergency" as const,
    phrases: ["abuse", "violence", "being beaten", "unsafe at home", "immediate danger", "someone is hurting me"],
  },
  {
    category: "medical" as const,
    urgency: "emergency" as const,
    phrases: ["medical emergency", "can't breathe", "cannot breathe", "bleeding", "unconscious", "chest pain"],
  },
  {
    category: "emergency" as const,
    urgency: "high" as const,
    phrases: ["no safe place", "sleep tonight", "homeless tonight", "no food today", "urgent", "emergency"],
  },
  {
    category: "legal" as const,
    urgency: "high" as const,
    phrases: ["eviction", "court", "legal dispute", "legal advice", "lawyer", "lawsuit"],
  },
];

export function assessSafety(text: string): SafetyAssessment {
  const normalized = text.toLowerCase();
  const matched = phraseGroups
    .map((group) => ({
      ...group,
      matchedPhrases: group.phrases.filter((phrase) => normalized.includes(phrase)),
    }))
    .filter((group) => group.matchedPhrases.length > 0);

  const selected =
    matched.find((group) => group.urgency === "emergency") ??
    matched.find((group) => group.urgency === "high");

  if (!selected) {
    return {
      urgency: "low",
      category: "standard",
      matchedPhrases: [],
      shouldLimitAdvice: false,
      safetyMessage:
        "ServiceBridge AI provides preparation guidance only. Final eligibility and official requirements must be verified by a human or official office.",
    };
  }

  return {
    urgency: selected.urgency,
    category: selected.category,
    matchedPhrases: matched.flatMap((group) => group.matchedPhrases),
    shouldLimitAdvice: true,
    safetyMessage:
      selected.urgency === "emergency"
        ? "This may be urgent. Please contact a trusted human, local emergency service, student affairs office, social worker, or verified support organization now. ServiceBridge AI cannot handle emergencies or replace emergency help."
        : "This may need human verification before normal benefits guidance. Please speak with a student affairs office, social worker, official support office, or qualified adviser for the final decision.",
  };
}
