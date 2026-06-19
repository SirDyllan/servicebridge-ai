import type { ChatResponse } from "@/types/chat";
import type { ChatRetrievalResult } from "@/lib/serviceRetrieval";
import type { SafetyAssessment } from "@/lib/safety";

export const chatActions = [
  "Create checklist",
  "Show required documents",
  "Find nearby office",
  "Speak to human",
  "Rate this guidance",
];

export const chatDisclaimer = "This is guidance only and not a final eligibility decision.";

export function buildGroundedFallbackResponse(
  message: string,
  retrieval: ChatRetrievalResult,
  safety: SafetyAssessment,
): ChatResponse {
  const documentChecklist = buildDocumentChecklist(message, retrieval);
  const urgentPrefix = safety.shouldLimitAdvice ? `${safety.safetyMessage} ` : "";
  const intakeStatus = retrieval.needsMoreInformation ? "needs_follow_up" : "ready_for_guidance";
  const reply = buildReply(retrieval, urgentPrefix);

  return {
    mode: "fallback",
    reply,
    intakeStatus,
    nextQuestion: retrieval.nextQuestion,
    followUpQuestions: retrieval.followUpQuestions,
    classification: retrieval.classification,
    matches: retrieval.matches,
    documentChecklist,
    humanReferral: {
      needed: true,
      reason: safety.shouldLimitAdvice
        ? "The message includes urgent or high-impact wording, so a human should guide the next decision."
        : "Benefit rules, documents, deadlines, and eligibility decisions depend on official review.",
      suggestedContactType: safety.shouldLimitAdvice
        ? "Trusted human, emergency service, student affairs office, social worker, or verified support organization"
        : "Student affairs office, social worker, public support office, or verified community support organization",
    },
    actions: chatActions,
    disclaimer: chatDisclaimer,
  };
}

function buildReply(retrieval: ChatRetrievalResult, urgentPrefix: string) {
  const nextQuestion = retrieval.nextQuestion;

  if (retrieval.classification.primaryNeeds[0] === "Need not clear yet") {
    return (
      urgentPrefix +
      `Hi, I can help with that. To point you toward the right benefits pathway, tell me this first: ${nextQuestion}`
    );
  }

  if (retrieval.needsMoreInformation) {
    const questionLine = nextQuestion ? ` My next question is: ${nextQuestion}` : "";
    return (
      urgentPrefix +
      "I can help. From what you shared, your request may connect to " +
      retrieval.classification.primaryNeeds.join(", ") +
      `. I will ask one question at a time so the guidance stays accurate.${questionLine}`
    );
  }

  return (
    urgentPrefix +
    "Based on the information you shared, you may match benefit-support pathways connected to " +
    retrieval.classification.primaryNeeds.join(", ") +
    ". This is not approval. Use the checklist to prepare, then verify requirements with a human adviser or official office."
  );
}

function buildDocumentChecklist(message: string, retrieval: ChatRetrievalResult) {
  const normalized = message.toLowerCase();
  const needed = Array.from(new Set(retrieval.records.flatMap((record) => record.documentsNeeded))).slice(0, 9);
  const missing: string[] = [];
  const notes: string[] = [
    "Requirements differ by location and program. Confirm the exact list with the official office before travelling or paying any fees.",
  ];

  if (mentionsMissingId(normalized)) {
    missing.push("National ID");
    missing.push("Birth certificate or accepted identity alternative");
    notes.push(
      "You said you do not have an ID. Many support applications may require identity documents. Getting an ID or confirming accepted alternatives may be an important first step. Requirements differ by location and office, so confirm with the official registry or support office before travelling or paying any fees.",
    );
  }

  if (normalized.includes("student")) {
    needed.push("Student letter or proof of enrollment");
  }

  if (
    normalized.includes("lost job") ||
    normalized.includes("lost my job") ||
    normalized.includes("lost income") ||
    normalized.includes("unemployed") ||
    normalized.includes("part-time")
  ) {
    needed.push("Proof of income change or unemployment");
  }

  if (!normalized.includes("proof of residence")) {
    missing.push("Proof of residence status unknown");
  }

  needed.push("Contact details");

  return {
    needed: Array.from(new Set(needed)),
    missing: Array.from(new Set(missing)),
    notes,
  };
}

function mentionsMissingId(message: string) {
  return (
    /\b(no|without|missing|lost)\s+(an?\s+)?id\b/i.test(message) ||
    /\b(do not|dont|don't)\s+have\s+(an?\s+)?id\b/i.test(message)
  );
}
