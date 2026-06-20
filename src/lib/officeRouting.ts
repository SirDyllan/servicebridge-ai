export type OfficeRegion = "usa" | "zimbabwe" | "unknown";

export type IdentityOfficeRouting = {
  region: OfficeRegion;
  officeType: string;
  mapQueryLabel: string;
};

const zimbabweSignals = [
  "zimbabwe",
  "mutare",
  "harare",
  "bulawayo",
  "gweru",
  "masvingo",
  "civil registry",
  "national registry",
  "national id",
];

const usaSignals = [
  "usa",
  "u.s.",
  "u.s.a",
  "united states",
  "america",
  "snap",
  "medicaid",
  "chip",
  "tanf",
  "liheap",
  "dmv",
  "real id",
  "state id",
  "texas",
  "texas city",
  "houston",
  "dallas",
  "austin",
  "california",
  "new york",
  "parents in usa",
  "parent in usa",
];

export function inferOfficeRegion(context: string): OfficeRegion {
  const normalized = context.toLowerCase();

  if (zimbabweSignals.some((signal) => normalized.includes(signal))) return "zimbabwe";
  if (usaSignals.some((signal) => normalized.includes(signal))) return "usa";

  return "unknown";
}

export function getIdentityOfficeRouting(context: string): IdentityOfficeRouting {
  const region = inferOfficeRegion(context);

  if (region === "usa") {
    return {
      region,
      officeType: "DMV, state ID office, or official state identity-document office",
      mapQueryLabel: "DMV state ID office",
    };
  }

  if (region === "zimbabwe") {
    return {
      region,
      officeType: "Civil Registry, National Registry, or official National ID office",
      mapQueryLabel: "Civil Registry National ID office",
    };
  }

  return {
    region,
    officeType: "official ID or civil registration office",
    mapQueryLabel: "official ID civil registration office",
  };
}

export function buildIdentityOfficeSearchQuery(location: string, context: string) {
  const routing = getIdentityOfficeRouting(context);
  const safeLocation = location.trim() || "near me";

  return `${safeLocation} ${routing.mapQueryLabel}`;
}
