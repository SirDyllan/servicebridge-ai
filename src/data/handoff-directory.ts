export type HandoffOption = {
  id: string;
  title: string;
  categoryIds: string[];
  officeType: string;
  whenHumanTakesOver: string;
  scenario: string;
  whatToAsk: string[];
  documentsToBring: string[];
  mapQueries: string[];
  caution: string;
};

const defaultLocation = "your area";

export const handoffOptions: HandoffOption[] = [
  {
    id: "identity-office",
    title: "Identity document office",
    categoryIds: ["document-readiness"],
    officeType: "Civil registry, national registry, home affairs, or identity-document office",
    whenHumanTakesOver:
      "A human official confirms whether the user can replace the ID, which documents are accepted, whether a report is needed, and whether fees or forms apply.",
    scenario:
      "User lost an ID and needs to know which documents to prepare before visiting an official identity-document office.",
    whatToAsk: [
      "Which office handles lost or replacement IDs for my location?",
      "Do you accept a birth certificate, old ID copy, or other identity proof?",
      "Is proof of residence required for my case?",
      "Do I need a police report if the ID was lost or stolen?",
      "Are there forms, fees, appointment rules, or collection dates I should confirm first?",
    ],
    documentsToBring: [
      "Birth certificate or existing identity proof if available",
      "Any copy, photo, or number from the lost ID if available",
      "Proof of residence or address information if available",
      "Police report only if stolen or requested by the official office",
      "A short written summary of what happened and when",
    ],
    mapQueries: [
      "civil registry office {location}",
      "national registration office {location}",
      "home affairs identity document office {location}",
    ],
    caution:
      "Search results may include unofficial agents. Verify the office is official before travelling, paying fees, or sharing personal documents.",
  },
  {
    id: "police-report",
    title: "Police report checkpoint",
    categoryIds: ["document-readiness", "emergency-relief"],
    officeType: "Police station or official reporting desk",
    whenHumanTakesOver:
      "A police or official reporting desk confirms whether a report is needed for a stolen ID or other missing document.",
    scenario:
      "User says an ID or document was stolen, or the identity office asks for an incident report before replacement.",
    whatToAsk: [
      "Do I need a report for a lost ID, or only if it was stolen?",
      "What information should the report include?",
      "Can I use the report while waiting for replacement documents?",
    ],
    documentsToBring: [
      "Any identity proof available",
      "Details of when and where the document was lost or stolen",
      "Contact details",
    ],
    mapQueries: ["police station {location}", "police report office {location}"],
    caution:
      "ServiceBridge AI cannot decide whether a report is legally required. Confirm with the identity-document office or police desk.",
  },
  {
    id: "student-affairs",
    title: "Student affairs or welfare office",
    categoryIds: ["student-welfare", "education-support", "food-support"],
    officeType: "Student affairs, student welfare, bursary, scholarship, or campus support office",
    whenHumanTakesOver:
      "A student adviser confirms campus support, deadlines, required documents, emergency help, and whether missing ID blocks the application.",
    scenario:
      "Student needs food, school-expense, bursary, hardship, or welfare support and may have missing documents.",
    whatToAsk: [
      "Which student support pathway fits my situation?",
      "Can I start the process while replacing a missing ID?",
      "Which proof of enrollment or student letter is accepted?",
      "Is there emergency food or fee support while formal review is pending?",
    ],
    documentsToBring: [
      "Student card, student number, or proof of enrollment",
      "ID or alternative identity proof if available",
      "Short explanation of income or hardship",
      "Any fee notice, deadline notice, or support letter",
    ],
    mapQueries: ["student affairs office {location}", "student welfare office {location}", "bursary office {location}"],
    caution:
      "Campus rules differ. Treat map results as navigation help only; official eligibility stays with the institution.",
  },
  {
    id: "social-services",
    title: "Social services or community support office",
    categoryIds: ["food-support", "emergency-relief", "family-childcare", "human-referral"],
    officeType: "Social services office, community support organization, food relief provider, or social worker",
    whenHumanTakesOver:
      "A social worker or verified organization checks urgent needs, household details, missing documents, and safe next steps.",
    scenario:
      "User needs food, family, childcare, emergency relief, or a support worker to verify a complex situation.",
    whatToAsk: [
      "What support can be considered while my documents are incomplete?",
      "Which documents are required immediately and which can follow later?",
      "Is there emergency help today or this week?",
      "Who can verify my case if the rules are unclear?",
    ],
    documentsToBring: [
      "Any ID or identity proof available",
      "Proof of residence if available",
      "Household/dependent information if relevant",
      "Short written summary of the urgent need",
    ],
    mapQueries: ["social services office {location}", "food relief organization {location}", "community support office {location}"],
    caution:
      "Use verified organizations. Do not share sensitive documents with unverified individuals or pages.",
  },
  {
    id: "health-office",
    title: "Clinic or healthcare access desk",
    categoryIds: ["healthcare-access"],
    officeType: "Clinic, public health office, campus health office, hospital help desk, or qualified health worker",
    whenHumanTakesOver:
      "A qualified health worker makes clinical decisions and confirms access, referral, documents, and urgency.",
    scenario:
      "User needs healthcare access support, but the AI must not diagnose, prescribe, or decide medical priority.",
    whatToAsk: [
      "Is this urgent enough for immediate medical attention?",
      "What documents are needed for low-cost access or referral?",
      "Can a social worker or health navigator help with access barriers?",
    ],
    documentsToBring: [
      "ID if available",
      "Clinic card or medical records if available",
      "Current location and contact details",
      "Short description of the access problem",
    ],
    mapQueries: ["public clinic {location}", "public hospital {location}", "health office {location}"],
    caution:
      "For urgent danger or medical emergencies, contact local emergency help or a qualified health worker immediately.",
  },
  {
    id: "employment-office",
    title: "Youth employment or career support office",
    categoryIds: ["employment-youth"],
    officeType: "Youth employment centre, career office, public employment service, or training provider",
    whenHumanTakesOver:
      "A human adviser confirms job-readiness support, training pathways, proof of unemployment, and application requirements.",
    scenario:
      "User lost work or needs income-recovery support while preparing benefit or support documents.",
    whatToAsk: [
      "What job-readiness or training support is available?",
      "Can I get proof of unemployment or income change?",
      "Which documents do I need before applying?",
    ],
    documentsToBring: [
      "ID if available",
      "CV or short work history",
      "Proof of job loss or income change if available",
      "Training or school documents if relevant",
    ],
    mapQueries: ["youth employment centre {location}", "career office {location}", "public employment service {location}"],
    caution:
      "Avoid job offers or agencies asking for unsafe upfront payments. Verify organizations before sharing documents.",
  },
];

export function getHandoffOptions(need?: string) {
  const categoryId = needToCategoryId(need);
  const specific = handoffOptions.filter((option) => option.categoryIds.includes(categoryId));
  const human = handoffOptions.find((option) => option.id === "social-services");

  if (specific.length) {
    return human && !specific.some((option) => option.id === human.id) ? [...specific, human] : specific;
  }

  return handoffOptions.filter((option) => ["social-services", "identity-office", "student-affairs"].includes(option.id));
}

export function buildMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildOfficeQuery(template: string, location?: string) {
  const safeLocation = location?.trim() || defaultLocation;
  return template.replace("{location}", safeLocation);
}

export function needToCategoryId(need?: string) {
  const normalized = (need ?? "").toLowerCase();

  if (normalized.includes("document") || normalized.includes("id") || normalized.includes("identity")) return "document-readiness";
  if (normalized.includes("food")) return "food-support";
  if (normalized.includes("education") || normalized.includes("school") || normalized.includes("student")) return "education-support";
  if (normalized.includes("health")) return "healthcare-access";
  if (normalized.includes("child") || normalized.includes("family")) return "family-childcare";
  if (normalized.includes("employment") || normalized.includes("job") || normalized.includes("income")) return "employment-youth";
  if (normalized.includes("emergency") || normalized.includes("urgent")) return "emergency-relief";

  return "human-referral";
}
