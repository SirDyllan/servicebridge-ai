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

export const clarifyingActions = [
  "Food support",
  "Education support",
  "ID or documents",
  "Healthcare access",
  "Emergency relief",
  "Employment support",
];

export const chatDisclaimer =
  "Guidance only - not approval. Verify final eligibility and requirements with an official office or human advisor.";

export function buildGroundedFallbackResponse(
  message: string,
  retrieval: ChatRetrievalResult,
  safety: SafetyAssessment,
): ChatResponse {
  const documentChecklist = buildDocumentChecklist(message, retrieval);
  const urgentPrefix = safety.shouldLimitAdvice ? `${safety.safetyMessage} ` : "";
  const intakeStatus = retrieval.needsMoreInformation ? "needs_follow_up" : "ready_for_guidance";
  const needsClarification = retrieval.classification.primaryNeeds[0] === "Need not clear yet";
  const reply = buildReply(retrieval, urgentPrefix, safety);

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
    actions: needsClarification ? clarifyingActions : chatActions,
    disclaimer: chatDisclaimer,
  };
}

function buildReply(retrieval: ChatRetrievalResult, urgentPrefix: string, safety: SafetyAssessment) {
  const nextQuestion = retrieval.nextQuestion;

  if (safety.urgency === "emergency") {
    return buildImmediateEmergencyReply(retrieval, safety);
  }

  if (retrieval.classification.primaryNeeds[0] === "Need not clear yet") {
    return urgentPrefix + buildClarifyingReply(nextQuestion);
  }

  if (retrieval.needsMoreInformation) {
    return urgentPrefix + buildFollowUpReply(retrieval);
  }

  const starter =
    urgentPrefix +
    "Thanks for explaining your situation. Based on what you shared, this may connect to possible support pathways for " +
    retrieval.classification.primaryNeeds.join(", ") +
    buildSecondaryNeedText(retrieval) +
    ". I can help organize documents and next steps, but final eligibility must still be verified with a human adviser or official office.";

  if (nextQuestion) {
    return `${starter} ${buildBridgeToQuestion(retrieval)} ${nextQuestion}`;
  }

  return starter;
}

function buildImmediateEmergencyReply(retrieval: ChatRetrievalResult, safety: SafetyAssessment) {
  const base =
    safety.category === "emergency"
      ? "This sounds like an active emergency. If you are in danger, leave the area if you can do so safely and contact local emergency services or the fire brigade now. ServiceBridge AI cannot replace emergency responders. After you are safe, this may connect to emergency relief, temporary shelter, food, clothing, document replacement, and human/office support."
      : safety.safetyMessage;

  if (retrieval.nextQuestion) {
    return `${base} ${retrieval.nextQuestion}`;
  }

  return `${base} I can help organize recovery steps and documents after immediate safety is handled.`;
}

function buildSecondaryNeedText(retrieval: ChatRetrievalResult) {
  const needs = retrieval.classification.secondaryNeeds.filter((need) => {
    return !retrieval.classification.primaryNeeds.includes(need);
  });

  if (!needs.length) return "";
  return `, with related support areas like ${needs.slice(0, 3).join(", ")}`;
}

function buildBridgeToQuestion(retrieval: ChatRetrievalResult) {
  const hasMissingId = retrieval.classification.documentIssues.some((issue) => issue.toLowerCase().includes("id"));

  if (hasMissingId) {
    return "Since you mentioned an ID issue, document readiness may be an important first step.";
  }

  return "One useful detail will help narrow the safest next step:";
}

function buildClarifyingReply(nextQuestion: string) {
  if (!nextQuestion) {
    return "Hello. I can help with benefits navigation, document readiness, and official-office handoff. What support area should we start with?";
  }

  if (nextQuestion.toLowerCase().includes("new id")) {
    return `I can help with document readiness. ${nextQuestion}`;
  }

  if (nextQuestion.toLowerCase().includes("driver")) {
    return `I can help with driver's-license document readiness. ${nextQuestion}`;
  }

  if (nextQuestion.toLowerCase().includes("money")) {
    return `I can help you check possible support pathways, but I need one detail first. ${nextQuestion}`;
  }

  return `Hello. I can help with benefits navigation, document readiness, and safe next steps. ${nextQuestion}`;
}

function buildFollowUpReply(retrieval: ChatRetrievalResult) {
  const nextQuestion = retrieval.nextQuestion;
  const primaryNeeds = retrieval.classification.primaryNeeds;
  if (!nextQuestion) return "Thanks, that helps. I need one more detail before giving guidance.";

  const isLicenseRequest = retrieval.classification.documentIssues.some((issue) => {
    return issue.toLowerCase().includes("license");
  });

  if (isLicenseRequest) {
    return `I can help you prepare for a driver's-license or identity-document process. Requirements depend on the official office in your area. ${nextQuestion}`;
  }

  if (nextQuestion.toLowerCase().includes("proof of enrollment")) {
    return `Missing ID can make applications harder, but you can still prepare the student-support route. ${nextQuestion}`;
  }

  if (nextQuestion.toLowerCase().includes("city")) {
    return `Thanks, that helps. ${nextQuestion}`;
  }

  if (nextQuestion.toLowerCase().includes("urgent")) {
    return `I have the main support need and location now. ${nextQuestion}`;
  }

  return `Your situation may connect to ${primaryNeeds.join(", ")}. ${nextQuestion}`;
}

function buildDocumentChecklist(message: string, retrieval: ChatRetrievalResult) {
  const normalized = message.toLowerCase();
  const needed = canonicalDocumentItems(retrieval.records.flatMap((record) => record.documentsNeeded), normalized);
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
    addUnique(needed, "Proof of enrollment or student letter");
  }

  if (
    normalized.includes("lost job") ||
    normalized.includes("lost my job") ||
    normalized.includes("lost income") ||
    normalized.includes("unemployed") ||
    normalized.includes("part-time")
  ) {
    addUnique(needed, "Short explanation or proof of income change");
  }

  if (!normalized.includes("proof of residence")) {
    missing.push("Proof of residence status unknown");
  }

  return {
    needed,
    missing: Array.from(new Set(missing)),
    notes,
  };
}

function canonicalDocumentItems(items: string[], message: string) {
  const needed: string[] = [];

  items.forEach((item) => {
    const normalized = item.toLowerCase();

    if (normalized.includes("police") && !message.includes("stolen")) return;
    if (normalized.includes("parent") || normalized.includes("guardian")) return;
    if (["current location", "contact details", "household size if relevant"].includes(normalized)) return;

    if (normalized.includes("student") || normalized.includes("enrollment")) {
      addUnique(needed, "Proof of enrollment or student letter");
      return;
    }

    if (normalized.includes("income") || normalized.includes("unemployment") || normalized.includes("job")) {
      addUnique(needed, "Short explanation or proof of income change");
      return;
    }

    if (normalized.includes("residence") || normalized.includes("address")) {
      addUnique(needed, "Proof of residence if available");
      return;
    }

    if (normalized.includes("birth certificate")) {
      addUnique(needed, "Birth certificate or accepted identity alternative");
      return;
    }

    if (normalized.includes("id") || normalized.includes("identity")) {
      addUnique(needed, "Any identity proof you still have, such as an old ID copy or school record");
      return;
    }

    if (normalized.includes("urgent") || normalized.includes("summary") || normalized.includes("problem")) {
      addUnique(needed, "Short written summary of your food and school-expense need");
    }
  });

  return needed.slice(0, 7);
}

function addUnique(items: string[], value: string) {
  if (!items.includes(value)) items.push(value);
}

function mentionsMissingId(message: string) {
  return (
    /\b(no|without|missing|lost)\s+(an?\s+)?id\b/i.test(message) ||
    /\b(do not|dont|don't)\s+have\s+(an?\s+)?id\b/i.test(message)
  );
}
