import type { IntakeFormData, MatchLevel, VerificationStatus } from "@/types/benefits";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatUrgency = "low" | "medium" | "high" | "emergency";

export type ChatClassification = {
  primaryNeeds: string[];
  secondaryNeeds: string[];
  urgency: ChatUrgency;
  documentIssues: string[];
};

export type ChatMatch = {
  serviceName: string;
  category: string;
  matchLevel: MatchLevel;
  whyThisMayFit: string;
  documentsNeeded: string[];
  nextSteps: string[];
  sourceLabel: string;
  verificationStatus: VerificationStatus;
};

export type ChatDocumentChecklist = {
  needed: string[];
  missing: string[];
  notes: string[];
};

export type ChatHumanReferral = {
  needed: boolean;
  reason: string;
  suggestedContactType: string;
};

export type ChatIntakeStatus = "needs_follow_up" | "ready_for_guidance";

export type ChatResponse = {
  mode: "openai" | "fallback";
  reply: string;
  intakeStatus: ChatIntakeStatus;
  nextQuestion: string;
  followUpQuestions: string[];
  classification: ChatClassification;
  matches: ChatMatch[];
  documentChecklist: ChatDocumentChecklist;
  humanReferral: ChatHumanReferral;
  actions: string[];
  disclaimer: string;
};

export type ChatRequest = {
  message?: string;
  history?: ChatMessage[];
  intake?: Partial<IntakeFormData>;
};
