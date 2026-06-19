import { ExternalLink } from "lucide-react";
import type { VerificationStatus } from "@/types/benefits";

const statusStyles: Record<VerificationStatus, string> = {
  verified: "bg-emerald-50 text-emerald-900 ring-emerald-900/15",
  sample: "bg-blue-50 text-blue-900 ring-blue-900/15",
  needs_review: "bg-amber-50 text-amber-900 ring-amber-900/20",
};

export function SourceBadge({
  label,
  url,
  verificationStatus,
}: {
  label: string;
  url?: string;
  verificationStatus: VerificationStatus;
}) {
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-2 sm:max-w-xl sm:items-end">
      <span
        className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${statusStyles[verificationStatus]}`}
      >
        {verificationStatus.replace("_", " ")}
      </span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-full items-start gap-1 text-xs font-black leading-5 text-emerald-800 hover:text-emerald-950 sm:text-right"
        >
          <span className="min-w-0">{label}</span>
          <ExternalLink className="mt-0.5 size-3 shrink-0" />
        </a>
      ) : (
        <span className="text-xs font-bold text-slate-500">{label}</span>
      )}
    </div>
  );
}
