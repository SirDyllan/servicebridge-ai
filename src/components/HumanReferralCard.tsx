import { Handshake, ShieldCheck } from "lucide-react";
import { OfficeVerificationActions } from "@/components/OfficeVerificationActions";
import { VerificationStatusBadge } from "@/components/results/VerificationStatusBadge";
import type { BenefitMatch, HumanReferral } from "@/types/benefits";

export function HumanReferralCard({
  referral,
  safetyNote,
  primaryMatch,
}: {
  referral: HumanReferral;
  safetyNote: string;
  primaryMatch?: BenefitMatch;
}) {
  const recommendedOffice = primaryMatch?.location || referral.options[0] || "Official office or verified support provider";

  return (
    <section className="rounded-[2rem] border border-[#244B35]/10 bg-white p-5 shadow-[0_18px_55px_rgba(16,35,25,0.08)] sm:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7F4F1] text-[#0B7777]">
            <Handshake className="size-5" />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#12A6A6]">Verify With a Human</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#244B35]">Where to verify</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#244B35]/75">
              Use the official source or office type below to confirm requirements before applying.
            </p>
          </div>
        </div>
        {primaryMatch ? <VerificationStatusBadge status={primaryMatch.verificationStatus} /> : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <section className="rounded-2xl bg-[#F6F1E7] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#12A6A6]">Recommended office type</p>
          <p className="mt-2 text-lg font-black leading-7 text-[#244B35]">{recommendedOffice}</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#244B35]/72">
            {referral.reason}
          </p>
        </section>

        <section className="rounded-2xl border border-[#244B35]/10 bg-[#FFFDF8] p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#12A6A6]">Which office should verify?</p>
          <ul className="mt-3 grid gap-2">
            {referral.options.map((option) => (
              <li key={option} className="flex gap-2 text-sm font-semibold leading-6 text-[#244B35]/78">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#12A6A6]" />
                {option}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <section className="rounded-2xl border border-[#244B35]/10 bg-white p-4">
          <p className="text-sm font-black text-[#244B35]">Source transparency</p>
          <dl className="mt-3 grid gap-2 text-sm leading-6 text-[#244B35]/76">
            <div>
              <dt className="font-black text-[#244B35]">Source organization</dt>
              <dd>{primaryMatch?.sourceLabel || "Source link needs review"}</dd>
            </div>
            <div>
              <dt className="font-black text-[#244B35]">Pathway</dt>
              <dd>{primaryMatch?.name || referral.title}</dd>
            </div>
            <div>
              <dt className="font-black text-[#244B35]">Safe office guidance</dt>
              <dd>{referral.verificationStep}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-950">Final eligibility warning</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
            Final eligibility and approval remain with official agencies, schools, social workers, case workers, or
            verified support providers.
          </p>
          <p className="mt-3 text-xs font-bold leading-5 text-amber-900">{safetyNote}</p>
        </section>
      </div>

      <div className="mt-5 border-t border-[#244B35]/10 pt-5">
        <OfficeVerificationActions
          sourceUrl={primaryMatch?.sourceUrl}
          officialProgramUrl={primaryMatch?.officialProgramUrl}
          applicationUrl={primaryMatch?.applicationUrl}
          verificationStatus={primaryMatch?.verificationStatus}
        />
      </div>
    </section>
  );
}
