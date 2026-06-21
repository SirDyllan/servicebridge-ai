import { ShieldCheck } from "lucide-react";
import { BenefitsMap } from "@/components/BenefitsMap";

export function HandoffExperience({
  need,
  location,
  mode = "map",
  className = "",
}: {
  need: string;
  location?: string;
  mode?: string;
  className?: string;
}) {
  return (
    <section className={className}>
      <section className="relative min-h-[360px] overflow-hidden rounded-[2rem] bg-[#244B35] shadow-[0_24px_80px_rgba(16,35,25,0.16)]">
        <div className="absolute inset-0 bg-[url('/images/search.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#244B35]/94 via-[#244B35]/66 to-[#0B2D4D]/24" />
        <div className="relative z-10 flex min-h-[360px] flex-col justify-center px-6 py-12 text-white sm:px-10 lg:px-14">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-white/80">Human verification step</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black uppercase tracking-tight sm:text-7xl">
            Verify With a Human
          </h1>
          <p className="mt-5 max-w-3xl text-sm font-semibold leading-7 text-white/76 sm:text-base">
            Use the recommended office type and map search as a starting point. Final eligibility, requirements, opening
            hours, and approval must be confirmed by official offices or trained support providers.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge label={`Need: ${need}`} />
            <Badge label={`Location: ${location || "not provided yet"}`} />
            <Badge label={mode === "human" ? "Speak to human" : "Office verification"} />
          </div>
        </div>
      </section>

      <div className="mt-6 rounded-[1.75rem] border border-[#244B35]/10 bg-white p-5 shadow-[0_18px_55px_rgba(16,35,25,0.06)] sm:p-6">
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-[#E7F4F1] p-4 text-[#244B35]">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#12A6A6]" />
          <div>
            <p className="text-sm font-black">Recommended office type</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#244B35]/68">
              Choose the office or support provider related to the matched program, such as student affairs, social
              welfare, civil registry, benefits office, healthcare access office, or verified community support provider.
            </p>
          </div>
        </div>
        <BenefitsMap location={location} initialNeed={need} />
      </div>
    </section>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/90 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-950 shadow-sm backdrop-blur">
      {label}
    </span>
  );
}
