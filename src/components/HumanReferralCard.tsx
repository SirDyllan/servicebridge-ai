import { Handshake, ShieldCheck } from "lucide-react";
import type { HumanReferral } from "@/types/benefits";

export function HumanReferralCard({ referral, safetyNote }: { referral: HumanReferral; safetyNote: string }) {
  return (
    <section className="rounded-3xl border border-emerald-950/10 bg-[#0f3f31] p-5 text-white shadow-[0_18px_55px_rgba(15,23,42,0.1)] sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
          <Handshake className="size-5" />
        </span>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-100">Human in the loop</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">{referral.title}</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-50">{referral.reason}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="text-sm font-black">Who can verify</p>
          <ul className="mt-3 grid gap-2">
            {referral.options.map((option) => (
              <li key={option} className="flex gap-2 text-sm leading-6 text-emerald-50">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                {option}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="text-sm font-black">Verification step</p>
          <p className="mt-3 text-sm leading-6 text-emerald-50">{referral.verificationStep}</p>
          <p className="mt-4 text-xs font-semibold leading-5 text-emerald-100">{safetyNote}</p>
        </div>
      </div>
    </section>
  );
}
