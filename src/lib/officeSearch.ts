import type { BenefitMatch, ServiceRecord } from "@/types/benefits";

type SearchableProgram = Pick<BenefitMatch, "name" | "category" | "location"> | ServiceRecord;

export function buildProgramMapSearchUrl(program: SearchableProgram, userLocation = "") {
  const query = buildProgramMapSearchQuery(program, userLocation);
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
}

export function buildProgramMapSearchQuery(program: SearchableProgram, userLocation = "") {
  const officeType = getProgramOfficeSearchTerm(program);
  if (!officeType) return "";

  const area = userLocation.trim();
  const locationPart = area ? `near ${area}` : "near me";

  return `${officeType} ${locationPart}`.replace(/\s+/g, " ").trim();
}

export function getProgramOfficeSearchTerm(program: SearchableProgram) {
  const name = getProgramName(program).toLowerCase();
  const category = program.category.toLowerCase();
  const location = program.location?.trim();

  if (name.includes("beam")) return "BEAM Social Welfare office";
  if (name.includes("snap")) return "SNAP office";
  if (name.includes("medicaid") || name.includes("chip")) return "Medicaid CHIP office";
  if (name.includes("tanf")) return "TANF office";
  if (name.includes("liheap")) return "LIHEAP office";
  if (name.includes("real id") || name.includes("state id")) return "DMV state ID office";
  if (name.includes("national id") || name.includes("civil registry")) return "Civil Registry office";
  if (name.includes("public health")) return "public clinic hospital";
  if (name.includes("women affairs") || name.includes("sme")) return "Women Affairs SME office";
  if (category.includes("health")) return "healthcare access office";
  if (category.includes("education")) return "education support office";
  if (category.includes("food")) return "food support office";
  if (category.includes("document")) return "official ID civil registration office";
  if (category.includes("family")) return "social welfare office";
  if (category.includes("employment")) return "youth employment office";
  if (category.includes("emergency")) return "emergency relief office";
  if (location) return location.split(",")[0]?.replace(/\bor\b/gi, " ").trim();

  return `${program.category} office`;
}

function getProgramName(program: SearchableProgram) {
  return "serviceName" in program ? program.serviceName : program.name;
}
