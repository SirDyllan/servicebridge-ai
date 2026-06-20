"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, Loader2, ShieldCheck } from "lucide-react";
import { FeedbackForm } from "@/components/FeedbackForm";
import { HumanReferralCard } from "@/components/HumanReferralCard";
import { ResultCard } from "@/components/ResultCard";
import type { GuidanceResponse } from "@/types/benefits";

export default function ResultsPage() {
  const [response, setResponse] = useState<GuidanceResponse | null>(null);
  const [query, setQuery] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem("servicebridge:lastGuidance");
      const storedQuery = window.localStorage.getItem("servicebridge:lastQuery") ?? "";
      if (stored) {
        try {
          setResponse(JSON.parse(stored) as GuidanceResponse);
        } catch {
          setResponse(null);
        }
      }
      setQuery(storedQuery);
      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!response || !window.location.hash) return;

    const timer = window.setTimeout(() => {
      const target = document.querySelector(window.location.hash);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [response]);

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf8] text-slate-950">
        <Loader2 className="size-8 animate-spin text-emerald-800" />
      </main>
    );
  }

  if (!response) {
    return (
      <main className="min-h-screen bg-[#f7faf8] px-5 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-950/10 bg-white p-7 text-center shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <ClipboardList className="mx-auto size-10 text-emerald-800" />
          <h1 className="mt-4 text-3xl font-black tracking-tight">No guidance result yet</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Start a guided check first. The result page stores the latest guidance only in this browser for the MVP
            demo.
          </p>
          <Link
            href="/intake"
            className="mt-6 inline-flex rounded-xl bg-emerald-800 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-900"
          >
            Start guided check
          </Link>
        </div>
      </main>
    );
  }

  const guidance = response.guidance;

  return (
    <main className="min-h-screen bg-[#F6F1E7] px-5 pb-36 pt-6 text-[#244B35] sm:px-8 sm:pb-40 sm:pt-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            href="/intake"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#244B35]/10 bg-white px-4 py-3 text-sm font-black text-[#244B35] transition hover:bg-[#FFFDF8]"
          >
            <ArrowLeft className="size-4" />
            Back to intake
          </Link>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#244B35]/70 ring-1 ring-[#244B35]/10">
              Provider: {response.provider}
            </span>
            <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#244B35]/70 ring-1 ring-[#244B35]/10">
              Directory: {response.directorySource ?? "local"}
            </span>
            <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#244B35]/70 ring-1 ring-[#244B35]/10">
              Coverage: {response.retrieval.coverage.replace("_", " ")}
            </span>
          </div>
        </div>

        <section className="rounded-[2rem] border border-[#244B35]/10 bg-white p-5 shadow-[0_20px_70px_rgba(16,35,25,0.08)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#12A6A6]">Your Support Guidance</p>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#244B35] sm:text-5xl">
                Possible support matches
              </h1>
              <p className="mt-4 max-w-4xl text-base font-semibold leading-7 text-[#244B35]/75">{guidance.summary}</p>
            </div>
            <div className="rounded-2xl bg-[#F6F1E7] p-4 text-sm font-black leading-6 text-[#244B35]">
              AI guidance - source transparency - human verification
            </div>
          </div>
          {response.warning ? (
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
              {response.warning}
            </p>
          ) : null}
          <div className="mt-5 grid items-start gap-3 sm:grid-cols-3">
            <InfoBox label="Detected need" value={response.retrieval.categoryName} />
            <InfoBox label="Urgency" value={response.retrieval.urgency} />
            <InfoBox label="Matched keywords" value={response.retrieval.matchedKeywords.join(", ") || "None yet"} />
          </div>
          <p className="mt-5 rounded-2xl border border-[#12A6A6]/20 bg-[#E7F4F1] p-4 text-sm font-bold leading-6 text-[#244B35]">
            This is guidance only. Eligibility and requirements must be verified with the official office.
          </p>
        </section>

        <section className="mt-6 grid gap-6" aria-label="Possible support match results">
          {guidance.possibleMatches.map((match, index) => (
            <ResultCard
              key={`${match.id}-${index}`}
              match={match}
              index={index}
              missingDocuments={guidance.documentReadiness.missingDocuments}
            />
          ))}
        </section>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#244B35]/15" />
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#244B35] shadow-sm ring-1 ring-[#244B35]/10">
            <ShieldCheck className="size-4 text-[#12A6A6]" />
            Next: verify with a human
          </div>
          <div className="h-px flex-1 bg-[#244B35]/15" />
        </div>

        <section aria-label="Verify with a human" className="grid gap-6">
          <HumanReferralCard
            referral={guidance.humanReferral}
            safetyNote={guidance.safetyNote}
            primaryMatch={guidance.possibleMatches[0]}
          />
          <FeedbackForm
            query={query}
            category={response.retrieval.categoryName}
            urgency={response.retrieval.urgency}
            provider={response.provider}
          />
        </section>
      </div>
    </main>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="h-fit rounded-2xl bg-[#F6F1E7] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#12A6A6]">{label}</p>
      <p className="mt-2 text-sm font-black text-[#244B35]">{value}</p>
    </div>
  );
}
