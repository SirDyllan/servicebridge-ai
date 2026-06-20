"use client";

import { ExternalLink, Filter, MapPin, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { serviceRecords } from "@/data/service-directory";
import type { ServiceRecord } from "@/types/benefits";

type MapCategory = "Benefits" | "Documents" | "Food Support" | "Education" | "Healthcare" | "Human Referral";

const filters: MapCategory[] = ["Benefits", "Documents", "Food Support", "Education", "Healthcare", "Human Referral"];

const categoryMap: Record<MapCategory, string[]> = {
  Benefits: ["family-childcare", "employment-youth", "student-welfare"],
  Documents: ["document-readiness"],
  "Food Support": ["food-support", "emergency-relief"],
  Education: ["education-support", "student-welfare"],
  Healthcare: ["healthcare-access"],
  "Human Referral": ["human-referral"],
};

const statusStyles = {
  verified: "bg-emerald-50 text-emerald-900 ring-emerald-900/15",
  needs_review: "bg-amber-50 text-amber-900 ring-amber-900/20",
  sample: "bg-blue-50 text-blue-900 ring-blue-900/15",
};

export function BenefitsMap({ location, initialNeed }: { location?: string; initialNeed?: string }) {
  const [activeFilter, setActiveFilter] = useState<MapCategory>(() => getInitialFilter(initialNeed));
  const items = useMemo(() => buildLocations(activeFilter), [activeFilter]);

  return (
    <section className="rounded-[2rem] border border-[#244B35]/10 bg-white p-5 shadow-[0_18px_55px_rgba(16,35,25,0.08)] sm:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#12A6A6]">Verification map</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#244B35] sm:text-4xl">
            Find the right office type before travelling
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-[#244B35]/72">
            This module uses curated service records and safe Google Maps search links. It does not guarantee office
            availability, exact addresses, or eligibility. Verify before visiting.
          </p>
        </div>
        <div className="rounded-2xl bg-[#F6F1E7] px-4 py-3 text-sm font-black text-[#244B35]">
          Search area: {location || "ask user for location"}
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`sb-button-motion inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-black ring-1 ${
              activeFilter === filter
                ? "bg-[#244B35] text-white ring-[#244B35]"
                : "bg-[#F6F1E7] text-[#244B35] ring-[#244B35]/10 hover:bg-white"
            }`}
          >
            <Filter className="size-4" />
            {filter}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="relative min-h-[360px] overflow-hidden rounded-[1.5rem] bg-[#244B35] p-5 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(18,166,166,0.32),transparent_28%),radial-gradient(circle_at_74%_70%,rgba(184,121,58,0.30),transparent_28%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white backdrop-blur">
                <MapPin className="size-4" />
                Simple map mode
              </div>
              <h3 className="mt-5 text-3xl font-black tracking-tight">Curated office search</h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-white/78">
                For the hackathon MVP, this is intentionally safer than an embedded map: users see official office
                types, source labels, verification status, and then choose a Google Maps search.
              </p>
            </div>
            <div className="mt-8 grid gap-3">
              {items.slice(0, 3).map((item, index) => (
                <div
                  key={`${item.id}-pin`}
                  className="flex items-center gap-3 rounded-2xl bg-white/12 p-3 text-sm font-black backdrop-blur"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#244B35]">
                    {index + 1}
                  </span>
                  {item.serviceName}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {items.map((item) => {
            const query = buildSearchQuery(item, location);
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

            return (
              <article key={item.id} className="sb-card-lift rounded-2xl border border-[#244B35]/10 bg-[#FFFDF8] p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#E7F4F1] px-3 py-1 text-xs font-black text-[#0B7777]">
                        {item.category}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusStyles[item.verificationStatus]}`}
                      >
                        {item.verificationStatus.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-[#244B35]">{item.serviceName}</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#244B35]/70">{item.location}</p>
                  </div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="sb-button-motion inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-[#B8793A] px-4 py-3 text-sm font-black text-white hover:bg-[#9f642f]"
                  >
                    Open in Google Maps
                    <ExternalLink className="size-4" />
                  </a>
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-2xl bg-white p-3 text-xs font-semibold leading-5 text-[#244B35]/70">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0B7777]" />
                  <span>
                    {item.verificationStatus === "verified"
                      ? "Source-backed record. Still verify office hours and requirements before visiting."
                      : "Location needs verification. Use this as a search starting point, not an exact official address."}
                  </span>
                </div>
                <p className="mt-3 text-xs font-bold text-[#244B35]/55">{item.sourceLabel}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function getInitialFilter(need?: string): MapCategory {
  const normalized = (need ?? "").toLowerCase();

  if (normalized.includes("document") || normalized.includes("id")) return "Documents";
  if (normalized.includes("food") || normalized.includes("emergency")) return "Food Support";
  if (normalized.includes("education") || normalized.includes("student")) return "Education";
  if (normalized.includes("health")) return "Healthcare";
  if (normalized.includes("human")) return "Human Referral";

  return "Benefits";
}

function buildLocations(filter: MapCategory) {
  const categoryIds = new Set(categoryMap[filter]);
  const records = serviceRecords.filter((record) => categoryIds.has(record.categoryId));

  if (records.length) return records;

  return serviceRecords.slice(0, 5);
}

function buildSearchQuery(record: ServiceRecord, location?: string) {
  const area = location?.trim();
  const base = record.location.replace(/\bor\b/gi, " ").split(",")[0]?.trim() || record.category;

  return area ? `${base} ${area}` : `${base} near me`;
}
