import type { VerificationStatus } from "@/types/benefits";
import { formatVerificationStatus, VerificationStatusBadge } from "@/components/results/VerificationStatusBadge";

export function SourceVerificationInfo({
  sourceLabel,
  pathwayName,
  verificationStatus,
  lastVerified,
}: {
  sourceLabel: string;
  pathwayName: string;
  verificationStatus: VerificationStatus;
  lastVerified?: string;
}) {
  return (
    <section className="rounded-2xl border border-[#244B35]/10 bg-[#F6F1E7] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#12A6A6]">Source and verification</p>
          <dl className="mt-3 grid gap-2 text-sm leading-6 text-[#244B35]/78">
            <div>
              <dt className="font-black text-[#244B35]">Source</dt>
              <dd>{sourceLabel || "Source link needs review"}</dd>
            </div>
            <div>
              <dt className="font-black text-[#244B35]">Pathway</dt>
              <dd>{pathwayName}</dd>
            </div>
            <div>
              <dt className="font-black text-[#244B35]">Status</dt>
              <dd>{formatVerificationStatus(verificationStatus)}</dd>
            </div>
            {lastVerified ? (
              <div>
                <dt className="font-black text-[#244B35]">Last verified</dt>
                <dd>{lastVerified}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        <VerificationStatusBadge status={verificationStatus} />
      </div>
    </section>
  );
}
