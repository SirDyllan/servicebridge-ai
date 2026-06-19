"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";
import { DocumentChecklist } from "@/components/DocumentChecklist";
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
    <main className="min-h-screen bg-[#f7faf8] px-5 pb-36 pt-6 text-slate-950 sm:px-8 sm:pb-40 sm:pt-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            href="/intake"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-950/10 bg-white px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
          >
            <ArrowLeft className="size-4" />
            Back to intake
          </Link>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-emerald-950/10">
              Provider: {response.provider}
            </span>
            <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-emerald-950/10">
              Directory: {response.directorySource ?? "local"}
            </span>
            <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-emerald-950/10">
              Coverage: {response.retrieval.coverage.replace("_", " ")}
            </span>
          </div>
        </div>

        <section className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-7">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-800">Guidance summary</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Possible support pathways
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-slate-700">{guidance.summary}</p>
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
        </section>

        <div className="mt-6 grid gap-6">
          {guidance.possibleMatches.map((match, index) => (
            <ResultCard key={`${match.id}-${index}`} match={match} index={index} />
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <DocumentChecklist readiness={guidance.documentReadiness} />
          <section className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-800">Next steps</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">What to do next</h2>
            <ol className="mt-5 grid gap-3">
              {guidance.nextSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-2xl bg-[#eef7f2] p-4">
              <p className="text-sm font-black text-emerald-950">Useful follow-up questions</p>
              <ul className="mt-3 grid gap-2">
                {guidance.followUpQuestions.map((question) => (
                  <li key={question} className="text-sm leading-6 text-emerald-950">
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6">
          <HumanReferralCard referral={guidance.humanReferral} safetyNote={guidance.safetyNote} />
          <FeedbackForm
            query={query}
            category={response.retrieval.categoryName}
            urgency={response.retrieval.urgency}
            provider={response.provider}
          />
        </div>
      </div>
    </main>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="h-fit rounded-2xl bg-[#f4f8f5] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">{label}</p>
      <p className="mt-2 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
