import { retrieveServices } from "@/lib/retrieval";
import type { ServiceRecord } from "@/types/benefits";
import type { ChatClassification, ChatMatch, ChatUrgency } from "@/types/chat";
import type { SafetyAssessment } from "@/lib/safety";

export type ChatRetrievalResult = {
  classification: ChatClassification;
  records: ServiceRecord[];
  matches: ChatMatch[];
  directoryNote: string;
  safetyNote: string;
  needsMoreInformation: boolean;
  nextQuestion: string;
  followUpQuestions: string[];
};

export function retrieveChatServices(
  message: string,
  records: ServiceRecord[],
  safety: SafetyAssessment,
): ChatRetrievalResult {
  const normalizedMessage = normalizeBenefitText(message);
  const lowInformation = isLowInformationMessage(normalizedMessage);
  const retrieval = retrieveServices(normalizedMessage, records);
  const documentOnly = isDocumentOnlyRequest(normalizedMessage, retrieval.categoryName);
  const documentDominant = isDocumentDominantRequest(normalizedMessage, retrieval.categoryName);
  const documentIssues = detectDocumentIssues(normalizedMessage);
  const followUpQuestions = buildFollowUpQuestions(
    normalizedMessage,
    retrieval.categoryName,
    lowInformation,
    documentDominant,
  );
  const primaryNeeds = lowInformation ? ["Need not clear yet"] : [retrieval.categoryName];
  const selectedRecords = lowInformation
    ? []
    : filterRecordsForConversation(retrieval.records, documentOnly || documentDominant, normalizedMessage);
  const secondaryNeeds = lowInformation ? [] : Array.from(new Set(selectedRecords.map((record) => record.category))).filter(
    (category) => category !== retrieval.categoryName,
  );
  const nextQuestion = followUpQuestions[0] ?? "";

  return {
    classification: {
      primaryNeeds,
      secondaryNeeds,
      urgency: safety.urgency === "low" ? mapRetrievalUrgency(retrieval.urgency) : safety.urgency,
      documentIssues,
    },
    records: selectedRecords,
    matches: selectedRecords.slice(0, 4).map((record, index) => ({
      serviceName: record.serviceName,
      category: record.category,
      matchLevel: index === 0 && record.verificationStatus !== "needs_review" ? "High" : index < 3 ? "Medium" : "Low",
      whyThisMayFit: buildWhy(record, normalizedMessage),
      documentsNeeded: record.documentsNeeded,
      nextSteps: record.steps.slice(0, 3),
      sourceLabel: record.sourceLabel,
      verificationStatus: record.verificationStatus,
    })),
    directoryNote: lowInformation
      ? "The user message is too short or vague to safely narrow benefit pathways."
      : retrieval.directoryNote,
    safetyNote: retrieval.safetyNote,
    needsMoreInformation: lowInformation || followUpQuestions.length > 0,
    nextQuestion,
    followUpQuestions,
  };
}

function normalizeBenefitText(message: string) {
  return message
    .toLowerCase()
    .replace(/\bfoad\b/g, "food")
    .replace(/\bfod\b/g, "food")
    .replace(/\bfoood\b/g, "food")
    .replace(/\bgrocerie\b/g, "grocery")
    .replace(/\bhelth\b/g, "health")
    .replace(/\bheath\b/g, "health")
    .replace(/\bhelthcare\b/g, "healthcare")
    .replace(/\bmedcine\b/g, "medicine")
    .replace(/\bdocumnts?\b/g, "documents")
    .replace(/\bdocuemnts?\b/g, "documents")
    .replace(/\bidenty\b/g, "identity")
    .replace(/\bunemployeed\b/g, "unemployed")
    .replace(/\bscholl\b/g, "school")
    .replace(/\bskool\b/g, "school");
}

function isLowInformationMessage(message: string) {
  const normalized = message.trim().toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const supportSignals = [
    "food",
    "school",
    "fees",
    "student",
    "job",
    "income",
    "id",
    "document",
    "support",
    "help",
    "health",
    "child",
    "childcare",
    "emergency",
    "rent",
    "benefit",
    "clinic",
    "doctor",
    "medicine",
    "sick",
    "grandma",
    "grandmother",
    "grandparent",
  ];

  if (words.length <= 2 && ["hi", "hello", "hey", "help", "start"].includes(normalized)) return true;

  return !supportSignals.some((signal) => normalized.includes(signal));
}

function mapRetrievalUrgency(urgency: "normal" | "sensitive" | "urgent"): ChatUrgency {
  if (urgency === "urgent") return "high";
  if (urgency === "sensitive") return "medium";
  return "low";
}

function detectDocumentIssues(message: string) {
  const normalized = message.toLowerCase();
  const issues: string[] = [];

  if (mentionsMissingId(normalized)) {
    issues.push("National ID missing");
    issues.push("Birth certificate or alternative identity proof may be needed");
  }

  if (normalized.includes("student")) {
    issues.push("Student letter or proof of enrollment should be checked");
  }

  if (
    normalized.includes("lost job") ||
    normalized.includes("lost my job") ||
    normalized.includes("lost income") ||
    normalized.includes("unemployed") ||
    normalized.includes("no income")
  ) {
    issues.push("Proof of income change or unemployment may be needed");
  }

  if (!normalized.includes("proof of residence")) {
    issues.push("Proof of residence status is unknown");
  }

  return Array.from(new Set(issues));
}

function buildFollowUpQuestions(
  message: string,
  primaryNeed: string,
  lowInformation: boolean,
  documentDominant: boolean,
) {
  const normalized = message.toLowerCase();

  if (lowInformation) {
    return [
      "What kind of support do you need right now: food, school expenses, documents, healthcare access, childcare, or emergency relief?",
      "What city, campus, or area are you in?",
      "Is this urgent today, this week, or a normal application?",
      "Do you have a national ID or any alternative identity document?",
    ];
  }

  const questions: string[] = [];

  if (primaryNeed === "Document Readiness" && documentDominant) {
    if (!mentionsLocation(normalized)) {
      questions.push("What city, campus, or area should I use to narrow the official office search?");
    }

    if (normalized.includes("lost") && !mentionsLostWithoutTheft(normalized) && !normalized.includes("stolen") && !normalized.includes("police")) {
      questions.push("Was the ID stolen, or was it lost or misplaced without theft?");
    }

    if (!mentionsBirthCertificate(normalized)) {
      questions.push("Do you have a birth certificate, old ID copy, or any other identity proof?");
    }

    if (!mentionsProofOfResidence(normalized)) {
      questions.push("Do you have proof of residence, or should I include alternatives to ask the office about?");
    }

    if (!mentionsBenefitPurpose(normalized)) {
      questions.push("Do you need the ID for a benefits application, school, work, or general replacement?");
    }

    return questions.slice(0, 5);
  }

  if (primaryNeed === "Healthcare Access" && !mentionsUrgency(normalized)) {
    questions.push(
      "Is this an urgent medical situation right now, or are you looking for help accessing affordable healthcare support?",
    );
  }

  if (normalized.includes("student") && !mentionsEnrollmentStatus(normalized)) {
    questions.push("Are you currently enrolled at a school, college, or university?");
  }

  if (normalized.includes("student") && mentionsEnrollmentStatus(normalized) && !mentionsProofOfEnrollment(normalized)) {
    questions.push("Can you get proof of enrollment, such as a student letter, registration record, or school email?");
  }

  if (!mentionsLocation(normalized)) {
    questions.push("What city, campus, or area should I use to narrow the support options?");
  }

  if (!normalized.includes("income") && !normalized.includes("lost") && !normalized.includes("job") && !normalized.includes("unemployed")) {
    questions.push("Do you have any income right now, or did your income recently change?");
  }

  if (!mentionsIdentityDocument(normalized)) {
    questions.push("Do you have a national ID, birth certificate, or another identity document?");
  }

  if (!normalized.includes("urgent") && !normalized.includes("today") && !normalized.includes("tonight") && !normalized.includes("this week")) {
    questions.push("Is this urgent today, this week, or part of a normal application?");
  }

  return questions.slice(0, 5);
}

function mentionsUrgency(message: string) {
  return ["urgent", "emergency", "today", "tonight", "this week", "right now", "can't breathe", "cannot breathe"].some(
    (term) => message.includes(term),
  );
}

function mentionsIdentityDocument(message: string) {
  return /\b(id|identity|document|documents|birth certificate)\b/i.test(message);
}

function mentionsEnrollmentStatus(message: string) {
  return /\b(enrolled|registered|not enrolled|no longer enrolled|student at|study at|attend|attending|i am a student|i'm a student|im a student)\b/i.test(
    message,
  );
}

function mentionsProofOfEnrollment(message: string) {
  return /\b(proof of enrollment|proof of enrolment|student letter|registration record|school email|enrollment letter|enrolment letter)\b/i.test(
    message,
  );
}

function mentionsBirthCertificate(message: string) {
  return /\b(birth certificate|birth cert|certificate)\b/i.test(message);
}

function mentionsProofOfResidence(message: string) {
  return /\b(proof\s+(of|or)\s+residence|residence proof|proof of address|utility bill|lease|address)\b/i.test(message);
}

function mentionsLostWithoutTheft(message: string) {
  return /\b(without theft|not stolen|misplaced|lost or misplaced)\b/i.test(message);
}

function mentionsMissingId(message: string) {
  return (
    /\b(no|without|missing|lost)\s+(an?\s+)?id\b/i.test(message) ||
    /\b(do not|dont|don't)\s+have\s+(an?\s+)?id\b/i.test(message)
  );
}

function mentionsLocation(message: string) {
  const knownDemoLocations = [
    "harare",
    "bulawayo",
    "gweru",
    "mutare",
    "masvingo",
    "johannesburg",
    "pretoria",
    "cape town",
    "durban",
    "campus",
  ];

  return (
    ["city", "area", "near", "location", "campus"].some((term) => message.includes(term)) ||
    knownDemoLocations.some((location) => message.includes(location)) ||
    /\b(in|near|around)\s+[a-z][a-z-]{2,}\b/i.test(message)
  );
}

function buildWhy(record: ServiceRecord, message: string) {
  const normalized = message.toLowerCase();
  const hits = record.keywords.filter((keyword) => normalized.includes(keyword)).slice(0, 3);

  if (hits.length) {
    return `This is a possible match because your message mentions ${hits.join(", ")}, which connects to ${record.category.toLowerCase()}.`;
  }

  return record.possibleEligibility;
}

function filterRecordsForConversation(records: ServiceRecord[], documentDominant: boolean, message: string) {
  if (!documentDominant) return records;

  const allowedCategoryIds = new Set(["document-readiness", "human-referral"]);
  if (mentionsEmploymentPurpose(message)) allowedCategoryIds.add("employment-youth");

  return records.filter((record) => allowedCategoryIds.has(record.categoryId));
}

function isDocumentOnlyRequest(message: string, primaryNeed: string) {
  if (primaryNeed !== "Document Readiness") return false;

  const nonDocumentSignals = [
    "food",
    "meal",
    "groceries",
    "hungry",
    "school fees",
    "scholarship",
    "bursary",
    "tuition",
    "healthcare",
    "clinic",
    "doctor",
    "medicine",
    "childcare",
    "caregiver",
    "dependent",
    "emergency food",
    "part-time job",
  ];

  return !nonDocumentSignals.some((signal) => message.includes(signal));
}

function mentionsBenefitPurpose(message: string) {
  return ["benefit", "support application", "school", "work", "job", "food", "health", "general replacement"].some(
    (term) => message.includes(term),
  );
}

function isDocumentDominantRequest(message: string, primaryNeed: string) {
  if (primaryNeed !== "Document Readiness") return false;
  if (!mentionsIdentityDocument(message) && !mentionsBirthCertificate(message)) return false;

  const directBenefitRequests = [
    "i need food",
    "need food",
    "school fees",
    "need school",
    "need healthcare",
    "need health care",
    "need childcare",
    "need cash",
    "need money",
    "need emergency relief",
  ];

  return !directBenefitRequests.some((signal) => message.includes(signal));
}

function mentionsEmploymentPurpose(message: string) {
  return /\b(job|jobs|work|employment|unemployed|finding jobs|look for work)\b/i.test(message);
}
