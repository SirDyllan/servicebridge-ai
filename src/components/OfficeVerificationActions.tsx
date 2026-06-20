import { ExternalLink } from "lucide-react";
import { isValidExternalUrl } from "@/lib/urlSafety";
import type { VerificationStatus } from "@/types/benefits";

export function OfficeVerificationActions({
  sourceUrl,
  officialProgramUrl,
  applicationUrl,
  verificationStatus,
}: {
  sourceUrl?: string;
  officialProgramUrl?: string;
  applicationUrl?: string;
  verificationStatus?: VerificationStatus;
}) {
  const officialHref = isValidExternalUrl(officialProgramUrl) ? officialProgramUrl : "";
  const sourceHref = isValidExternalUrl(sourceUrl) ? sourceUrl : "";
  const applicationHref =
    verificationStatus === "verified" && isValidExternalUrl(applicationUrl) ? applicationUrl : "";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {officialHref ? <OfficeActionLink href={officialHref} label="Open official program" /> : null}
      {!officialHref && sourceHref ? <OfficeActionLink href={sourceHref} label="View official source" /> : null}
      {applicationHref ? <OfficeActionLink href={applicationHref} label="Start application" /> : null}
      {!officialHref && !sourceHref && !applicationHref ? (
        <p className="rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-950">
          Source link needs review.
        </p>
      ) : null}
    </div>
  );
}

function OfficeActionLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B8793A] px-5 py-3 text-sm font-black text-white transition hover:bg-[#9f642f]"
    >
      {label}
      <ExternalLink className="size-4" />
    </a>
  );
}
