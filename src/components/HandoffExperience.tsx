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
        <div className="absolute inset-0 bg-gradient-to-r from-[#244B35]/92 via-[#244B35]/58 to-[#0B2D4D]/20" />
        <div className="relative z-10 flex min-h-[360px] flex-col justify-center px-6 py-12 text-white sm:px-10 lg:px-14">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-white/80">Service Bridge AI</p>
          <h1 className="mt-4 text-5xl font-black uppercase tracking-tight sm:text-7xl">Search Zone</h1>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge label={`Need: ${need}`} />
            <Badge label={`Location: ${location || "not provided yet"}`} />
            <Badge label={mode === "human" ? "Speak to human" : "Find nearby office"} />
          </div>
        </div>
      </section>

      <div className="mt-6">
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
