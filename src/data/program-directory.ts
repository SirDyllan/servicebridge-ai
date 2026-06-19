export type ProgramCard = {
  id: string;
  name: string;
  region: "USA" | "Zimbabwe";
  category: string;
  image: string;
  summary: string;
  possibleEligibility: string;
  documents: string[];
  nextSteps: string[];
  officialUrl: string;
  sourceLabel: string;
  verificationNote: string;
};

export const programCards: ProgramCard[] = [
  {
    id: "usa-snap",
    name: "SNAP - Supplemental Nutrition Assistance Program",
    region: "USA",
    category: "Food support",
    image: "/images/snap.png",
    summary:
      "May help low-income households buy food. Users apply through their state SNAP agency or local SNAP office.",
    possibleEligibility: "You may be a possible match if your household has limited income and needs food support.",
    documents: ["Identity", "Income proof", "Household details", "Rent or utility costs where relevant"],
    nextSteps: ["Find your state SNAP agency", "Prepare income and household documents", "Verify interview and document rules"],
    officialUrl: "https://www.fns.usda.gov/snap",
    sourceLabel: "USDA Food and Nutrition Service",
    verificationNote: "National program; eligibility and application details are state-specific.",
  },
  {
    id: "usa-medicaid-chip",
    name: "Medicaid / CHIP",
    region: "USA",
    category: "Healthcare access",
    image: "/images/medicchip.jpg",
    summary:
      "May help eligible adults, children, pregnant people, families, older adults, and people with disabilities access health coverage.",
    possibleEligibility: "You may be a possible match depending on state, income, age, pregnancy, disability, or household size.",
    documents: ["Social Security number", "Income proof", "Citizenship or immigration documents", "Household details"],
    nextSteps: ["Apply through HealthCare.gov or your state agency", "Prepare income and household details", "Verify coverage decision with the agency"],
    officialUrl: "https://www.healthcare.gov/medicaid-chip/",
    sourceLabel: "HealthCare.gov",
    verificationNote: "State rules vary, and final eligibility is decided by the Marketplace or state Medicaid agency.",
  },
  {
    id: "usa-tanf",
    name: "TANF - Temporary Assistance for Needy Families",
    region: "USA",
    category: "Family support",
    image: "/images/TANF.jpg",
    summary:
      "May help low-income families with children through cash assistance, work support, and related state-run services.",
    possibleEligibility: "You may be a possible match if your family has children and is facing financial hardship.",
    documents: ["IDs", "Social Security numbers", "Proof of income", "Children's birth certificates", "Proof of residence"],
    nextSteps: ["Find your state TANF agency", "Prepare household and child documents", "Verify work or interview requirements"],
    officialUrl: "https://acf.gov/ofa/programs/temporary-assistance-needy-families-tanf",
    sourceLabel: "U.S. Administration for Children and Families",
    verificationNote: "State-specific name, rules, and work requirements must be checked locally.",
  },
  {
    id: "usa-liheap",
    name: "LIHEAP - Low Income Home Energy Assistance Program",
    region: "USA",
    category: "Utility and emergency relief",
    image: "/images/LIHEAP-logo-Fb-post.jpg",
    summary:
      "May help low-income households with heating, cooling, energy bills, or utility disconnection risk.",
    possibleEligibility: "You may be a possible match if your household has low income and needs help with energy costs.",
    documents: ["Applicant ID", "Household details", "Income proof", "Current utility bill", "Shutoff notice if any"],
    nextSteps: ["Find the state or local LIHEAP office", "Prepare bills and income proof", "Confirm application season and crisis rules"],
    officialUrl: "https://acf.gov/ocs/programs/liheap",
    sourceLabel: "U.S. Administration for Children and Families",
    verificationNote: "Application windows and crisis rules vary by state or local agency.",
  },
  {
    id: "usa-real-id",
    name: "State ID / REAL ID",
    region: "USA",
    category: "Document readiness",
    image: "/images/usaid.png",
    summary:
      "May help users prepare identity, Social Security, and residency documents before visiting a state DMV or licensing office.",
    possibleEligibility: "You may be a possible match if you need a state identity document or REAL ID readiness checklist.",
    documents: ["Proof of identity", "Social Security number proof", "Proof of state residency", "State DMV checklist"],
    nextSteps: ["Identify your state DMV", "Use the state document checklist", "Verify appointment and fee rules"],
    officialUrl: "https://www.usa.gov/real-id",
    sourceLabel: "USA.gov",
    verificationNote: "State DMV rules decide exact documents, appointments, and fees.",
  },
  {
    id: "zim-id-replacement",
    name: "Zimbabwe National ID Replacement",
    region: "Zimbabwe",
    category: "Document readiness",
    image: "/images/zimid.jpg",
    summary:
      "May help users who lost, damaged, or no longer have a Zimbabwe national ID prepare documents before visiting Civil Registry.",
    possibleEligibility: "You may be a possible match if you previously had an ID and need replacement readiness.",
    documents: ["Birth certificate", "Copy of lost ID or passport if available", "Proof of residence if requested", "Police report only if required"],
    nextSteps: ["Prepare birth certificate and available identity proof", "Confirm whether a report or fee is required", "Visit or contact Civil Registry"],
    officialUrl: "https://www.facebook.com/CivilRegZim/",
    sourceLabel: "Civil Registry Department Zimbabwe public channel",
    verificationNote: "Office, fee, and police-report requirements must be confirmed locally before travel.",
  },
  {
    id: "zim-public-assistance",
    name: "Public Assistance / Social Welfare Support",
    region: "Zimbabwe",
    category: "Social welfare",
    image: "/images/civilreg.png",
    summary:
      "May support vulnerable households through assessment by Social Development or Social Welfare officers.",
    possibleEligibility: "You may be a possible match if your household is vulnerable and needs social welfare assessment.",
    documents: ["National ID or birth certificate", "Proof of residence", "Medical or referral letter if relevant", "Household details"],
    nextSteps: ["Contact district Social Welfare", "Prepare identity and household documents", "Verify assessment requirements"],
    officialUrl: "https://www.mpslsw.gov.zw/",
    sourceLabel: "Ministry of Public Service, Labour and Social Welfare",
    verificationNote: "Local district assessment and current office requirements must be verified.",
  },
  {
    id: "zim-beam",
    name: "BEAM - Basic Education Assistance Module",
    region: "Zimbabwe",
    category: "Education support",
    image: "/images/Beam-Logo.png",
    summary:
      "May support school fees for orphans and vulnerable children through school and social-development assessment processes.",
    possibleEligibility: "You may be a possible match if a learner is vulnerable and needs school-fee support.",
    documents: ["Learner birth certificate or ID", "Guardian or parent ID", "School details", "Proof of vulnerability or low income"],
    nextSteps: ["Ask the school about BEAM", "Prepare learner and guardian documents", "Verify current application window"],
    officialUrl: "https://www.mpslsw.gov.zw/",
    sourceLabel: "Social Development / education-support pathway",
    verificationNote: "Coverage, windows, and school-level process must be confirmed with the school or district office.",
  },
  {
    id: "zim-primary-health",
    name: "Public Health Facility Access",
    region: "Zimbabwe",
    category: "Healthcare access",
    image: "/images/medicchip.jpg",
    summary:
      "May guide users toward public clinic or hospital access while keeping clinical decisions with qualified health workers.",
    possibleEligibility: "You may be a possible match if you need help understanding public healthcare access steps.",
    documents: ["National ID or birth certificate", "Clinic card if available", "Medical records or prescriptions", "Referral letter if any"],
    nextSteps: ["Identify the nearest clinic or hospital", "Bring available medical and identity documents", "Let qualified health workers make clinical decisions"],
    officialUrl: "https://www.mohcc.gov.zw/",
    sourceLabel: "Ministry of Health and Child Care",
    verificationNote: "Facility hours, services, and fees must be checked with the nearest clinic or hospital.",
  },
  {
    id: "zim-women-sme",
    name: "Women Affairs / SME Support",
    region: "Zimbabwe",
    category: "Employment and business support",
    image: "/images/womenaffairs.jpg",
    summary:
      "May help women, entrepreneurs, and small-business groups prepare for empowerment, training, or business-support programs.",
    possibleEligibility: "You may be a possible match if you need business, training, or empowerment support readiness.",
    documents: ["National ID", "Proof of residence", "Business or group details", "Project proposal or business plan"],
    nextSteps: ["Contact a district or provincial office", "Ask which programs are open", "Prepare ID and business or group records"],
    officialUrl: "https://www.mwacsmed.gov.zw/",
    sourceLabel: "Ministry of Women Affairs, Community, Small and Medium Enterprises Development",
    verificationNote: "Program availability and application windows must be checked with the district or provincial office.",
  },
];
