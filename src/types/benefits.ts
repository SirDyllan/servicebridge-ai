export type RiskLevel = "standard" | "sensitive" | "urgent";
export type VerificationStatus = "sample" | "needs_review" | "verified";
export type SourceType = "sample" | "public" | "synthetic";
export type MatchLevel = "High" | "Medium" | "Low";
export type DocumentStatus = "available" | "missing" | "unknown";

export type SupportCategory = {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  icon: string;
  sampleQuestions: string[];
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type ServiceRecord = {
  id: string;
  serviceName: string;
  categoryId: string;
  category: string;
  targetUser: string;
  possibleEligibility: string;
  documentsNeeded: string[];
  steps: string[];
  sourceType: SourceType;
  sourceLabel: string;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  location: string;
  coordinates: Coordinates;
  keywords: string[];
  lastVerified: string;
  type: string;
  contact: string;
  openingHours: string;
  dataOwner: string;
  updateCadence: "weekly" | "monthly" | "quarterly";
};

export type IntakeFormData = {
  age: string;
  studentStatus: "student" | "not_student" | "unknown";
  employmentStatus: "employed" | "unemployed" | "lost_job" | "part_time" | "unknown";
  incomeSituation: string;
  dependents: "yes" | "no" | "unknown";
  location: string;
  supportNeeded: string[];
  urgency: "today" | "this_week" | "normal" | "unknown";
  hasId: "yes" | "no" | "unknown";
  hasProofOfResidence: "yes" | "no" | "unknown";
  hasStudentLetter: "yes" | "no" | "unknown";
  hasProofOfIncome: "yes" | "no" | "unknown";
  freeText: string;
};

export type BenefitMatch = {
  id: string;
  name: string;
  category: string;
  whyThisMayFit: string;
  documentsNeeded: string[];
  nextSteps: string[];
  sourceLabel: string;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  matchLevel: MatchLevel;
  uncertaintyNote: string;
  location: string;
  coordinates?: Coordinates;
  officialProgramUrl?: string;
  officeSearchUrl?: string;
  applicationUrl?: string;
  lastVerified?: string;
};

export type DocumentChecklistItem = {
  name: string;
  status: DocumentStatus;
  guidance: string;
};

export type DocumentReadiness = {
  summary: string;
  items: DocumentChecklistItem[];
  missingDocuments: string[];
  idPreparationSteps: string[];
};

export type HumanReferral = {
  title: string;
  reason: string;
  options: string[];
  verificationStep: string;
};

export type BenefitsGuidance = {
  summary: string;
  followUpQuestions: string[];
  possibleMatches: BenefitMatch[];
  documentReadiness: DocumentReadiness;
  nextSteps: string[];
  safetyNote: string;
  humanReferral: HumanReferral;
};

export type GuidanceResponse = {
  provider: string;
  directorySource?: "firestore" | "local-fallback";
  retrieval: {
    categoryName: string;
    urgency: "normal" | "sensitive" | "urgent";
    matchedKeywords: string[];
    coverage: "strong" | "limited" | "sample_only";
    directoryNote: string;
  };
  guidance: BenefitsGuidance;
  warning?: string;
};
