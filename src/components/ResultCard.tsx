import Link from "next/link";
import { CheckCircle2, MapPin, Navigation, ShieldAlert } from "lucide-react";
import { SourceBadge } from "@/components/SourceBadge";
import type { BenefitMatch, MatchLevel } from "@/types/benefits";

const matchStyles: Record<MatchLevel, string> = {
  High: "bg-emerald-800 text-white",
  Medium: "bg-blue-700 text-white",
  Low: "bg-slate-700 text-white",
};

export function ResultCard({ match, index }: { match: BenefitMatch; index: number }) {
  const resultAnchor = `match-${index + 1}`;
  const handoffUrl = `/handoff?need=${encodeURIComponent(match.category)}&mode=map&returnTo=${encodeURIComponent(
    `/results#${resultAnchor}`,
  )}`;

  return (
    <article
      id={resultAnchor}
      className="scroll-mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-7"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-900">
              Possible match {index + 1}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${matchStyles[match.matchLevel]}`}>
              {match.matchLevel} match
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">{match.name}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{match.category}</p>
        </div>
        <SourceBadge
          label={match.sourceLabel}
          url={match.sourceUrl}
          verificationStatus={match.verificationStatus}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.92fr]">
        <section className="rounded-2xl bg-[#f4f8f5] p-4">
          <p className="text-sm font-black text-slate-950">Why this may fit</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{match.whyThisMayFit}</p>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-800" />
            <div>
              <p className="text-sm font-black text-amber-950">What must be verified</p>
              <p className="mt-2 text-sm leading-6 text-amber-900">{match.uncertaintyNote}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section>
          <p className="text-sm font-black text-slate-950">Documents to prepare</p>
          <ul className="mt-3 grid gap-2">
            {match.documentsNeeded.map((document) => (
              <li key={document} className="flex gap-2 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-800" />
                {document}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <p className="text-sm font-black text-slate-950">Next 3 steps</p>
          <ol className="mt-3 grid gap-2">
            {match.nextSteps.slice(0, 3).map((step, stepIndex) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-slate-700">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-black text-white">
                  {stepIndex + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-950/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-800" />
          <p className="text-sm font-semibold leading-6 text-slate-700">
            Curated location type: <span className="font-black text-slate-950">{match.location}</span>
          </p>
        </div>
        <Link
          href={handoffUrl}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-900 sm:w-fit"
        >
          Open handoff guide
          <Navigation className="size-4" />
        </Link>
      </div>
    </article>
  );
}
