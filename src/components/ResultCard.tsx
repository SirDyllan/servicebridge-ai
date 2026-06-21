import { ShieldAlert } from "lucide-react";
import { DocumentsToPrepareList } from "@/components/results/DocumentsToPrepareList";
import { NextStepsList } from "@/components/results/NextStepsList";
import { ResultsActionButtons } from "@/components/results/ResultsActionButtons";
import { SourceVerificationInfo } from "@/components/results/SourceVerificationInfo";
import { VerificationStatusBadge } from "@/components/results/VerificationStatusBadge";
import type { BenefitMatch, MatchLevel } from "@/types/benefits";

const matchStyles: Record<MatchLevel, string> = {
  High: "bg-[#12A6A6] text-white",
  Medium: "bg-[#E7F4F1] text-[#0B7777] ring-1 ring-[#12A6A6]/25",
  Low: "bg-slate-100 text-slate-700 ring-1 ring-slate-300",
};

export function ResultCard({
  match,
  index,
  missingDocuments = [],
  userLocation = "",
}: {
  match: BenefitMatch;
  index: number;
  missingDocuments?: string[];
  userLocation?: string;
}) {
  const resultAnchor = `match-${index + 1}`;

  return (
    <article
      id={resultAnchor}
      className="scroll-mt-6 rounded-[1.5rem] border border-[#244B35]/10 bg-white p-5 shadow-[0_18px_55px_rgba(16,35,25,0.08)] sm:p-7"
    >
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#E7F4F1] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#0B7777]">
              Possible match {index + 1}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${matchStyles[match.matchLevel]}`}>
              {match.matchLevel} match
            </span>
            <VerificationStatusBadge status={match.verificationStatus} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#244B35]">{match.name}</h2>
          <p className="mt-1 text-sm font-bold text-[#244B35]/62">{match.category}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <section className="rounded-2xl bg-[#F6F1E7] p-4">
          <p className="text-sm font-black text-[#244B35]">Why this may fit</p>
          <p className="mt-2 text-sm leading-6 text-[#244B35]/78">{match.whyThisMayFit}</p>
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

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <DocumentsToPrepareList documents={match.documentsNeeded} missingDocuments={missingDocuments} />
        <NextStepsList steps={match.nextSteps} />
      </div>

      <div className="mt-5">
        <SourceVerificationInfo
          sourceLabel={match.sourceLabel}
          pathwayName={match.name}
          verificationStatus={match.verificationStatus}
          lastVerified={match.lastVerified}
        />
      </div>

      <div className="mt-5 border-t border-[#244B35]/10 pt-5">
        <ResultsActionButtons match={match} userLocation={userLocation} />
      </div>
    </article>
  );
}
