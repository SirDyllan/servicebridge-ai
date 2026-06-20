"use client";

import { ClipboardCheck, MapPin, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { getHandoffOptions } from "@/data/handoff-directory";
import { serviceRecords } from "@/data/service-directory";
import { OfficeVerificationActions } from "@/components/OfficeVerificationActions";
import { VerificationStatusBadge } from "@/components/results/VerificationStatusBadge";
import type { ServiceRecord } from "@/types/benefits";

export function BenefitsMap({ location, initialNeed }: { location?: string; initialNeed?: string }) {
  const handoffOption = useMemo(() => getHandoffOptions(initialNeed)[0], [initialNeed]);
  const items = useMemo(() => buildVerificationSources(initialNeed), [initialNeed]);
  const searchPhrase = buildSuggestedSearchPhrase(handoffOption?.mapQueries[0], location);

  return (
    <section className="rounded-[2rem] border border-[#244B35]/10 bg-white p-5 shadow-[0_18px_55px_rgba(16,35,25,0.08)] sm:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#12A6A6]">Where to verify</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#244B35] sm:text-4xl">
            Verify With a Human
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-[#244B35]/72">
            Use the official source or office type below to confirm requirements before applying.
          </p>
        </div>
        <div className="rounded-2xl bg-[#F6F1E7] px-4 py-3 text-sm font-black text-[#244B35]">
          Search area: {location || "not provided"}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[1.5rem] bg-[#244B35] p-5 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
            <ShieldCheck className="size-4" />
            Human verification step
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight">Recommended office type</h3>
          <p className="mt-3 text-lg font-black leading-7 text-white">{handoffOption?.officeType}</p>
          <p className="mt-4 text-sm font-semibold leading-7 text-white/78">{handoffOption?.whenHumanTakesOver}</p>

          <div className="mt-5 rounded-2xl bg-white/10 p-4">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#12A6A6]" />
              <div>
                <p className="text-sm font-black">Safe office/location guidance</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/78">
                  Search for official office types, not exact addresses from AI. Suggested phrase:
                  <span className="font-black text-white"> {searchPhrase}</span>
                </p>
              </div>
            </div>
          </div>

          <p className="mt-5 text-xs font-bold leading-5 text-white/70">
            Final eligibility and approval remain with official agencies, schools, social workers, case workers, or
            verified support providers.
          </p>
        </section>

        <section className="grid gap-3">
          {items.map((item) => (
            <OfficeSourceCard key={item.id} item={item} />
          ))}
        </section>
      </div>

      {handoffOption ? (
        <section className="mt-5 rounded-2xl border border-[#244B35]/10 bg-[#F6F1E7] p-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-[#12A6A6]" />
            <p className="text-sm font-black text-[#244B35]">Questions to ask before applying</p>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {handoffOption.whatToAsk.slice(0, 4).map((question) => (
              <li key={question} className="text-sm font-semibold leading-6 text-[#244B35]/78">
                {question}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function OfficeSourceCard({ item }: { item: ServiceRecord }) {
  return (
    <article className="rounded-2xl border border-[#244B35]/10 bg-[#FFFDF8] p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#E7F4F1] px-3 py-1 text-xs font-black text-[#0B7777]">
              {item.category}
            </span>
            <VerificationStatusBadge status={item.verificationStatus} />
          </div>
          <h3 className="text-lg font-black text-[#244B35]">{item.serviceName}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#244B35]/70">{item.location}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 rounded-2xl bg-white p-3 text-xs font-semibold leading-5 text-[#244B35]/70 sm:grid-cols-2">
        <div>
          <p className="font-black text-[#244B35]">Source organization</p>
          <p className="mt-1">{item.sourceLabel}</p>
        </div>
        <div>
          <p className="font-black text-[#244B35]">Safe verification note</p>
          <p className="mt-1">
            {item.verificationStatus === "verified"
              ? "Source-backed record. Still confirm office hours, documents, and local rules."
              : "Needs review before relying on details. Use this as preparation guidance only."}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <OfficeVerificationActions sourceUrl={item.sourceUrl} verificationStatus={item.verificationStatus} />
      </div>
    </article>
  );
}

function buildVerificationSources(need?: string) {
  const categoryId = needToCategoryId(need);
  const directMatches = serviceRecords.filter((record) => record.categoryId === categoryId);
  const humanRecord = serviceRecords.find((record) => record.categoryId === "human-referral");
  const documentRecord = serviceRecords.find((record) => record.categoryId === "document-readiness");
  const records = [...directMatches.slice(0, 2), humanRecord, documentRecord].filter(
    (record): record is ServiceRecord => Boolean(record),
  );

  return Array.from(new Map(records.map((record) => [record.id, record])).values()).slice(0, 4);
}

function needToCategoryId(need?: string) {
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

function buildSuggestedSearchPhrase(template?: string, location?: string) {
  if (!template) return location ? `official support office ${location}` : "official support office near me";
  const safeLocation = location?.trim() || "your area";

  return template.replace("{location}", safeLocation);
}
