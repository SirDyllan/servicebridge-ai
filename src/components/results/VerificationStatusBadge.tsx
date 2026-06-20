import type { VerificationStatus } from "@/types/benefits";

const statusStyles: Record<VerificationStatus, string> = {
  verified: "bg-[#E7F4F1] text-[#0B7777] ring-[#12A6A6]/25",
  needs_review: "bg-amber-50 text-amber-900 ring-amber-900/20",
  sample: "bg-slate-100 text-slate-700 ring-slate-300",
};

export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ring-1 ${statusStyles[status]}`}>
      {formatVerificationStatus(status)}
    </span>
  );
}

export function formatVerificationStatus(status: VerificationStatus) {
  if (status === "needs_review") return "Needs review";
  return status.charAt(0).toUpperCase() + status.slice(1);
}
