import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BenefitsMap } from "@/components/BenefitsMap";

type HandoffPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HandoffPage({ searchParams }: HandoffPageProps) {
  const params = await searchParams;
  const need = readParam(params.need) || "Human Referral";
  const location = readParam(params.location);
  const mode = readParam(params.mode) || "map";
  const returnTo = safeReturnPath(readParam(params.returnTo));
  const backLabel = returnTo === "/" ? "Back home" : "Back to results";

  return (
    <main className="min-h-screen bg-[#f7faf8] px-5 py-6 text-slate-950 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href={returnTo}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-950/10 bg-white px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>

        <section className="relative mt-6 min-h-[360px] overflow-hidden rounded-[2rem] bg-[#244B35] shadow-[0_24px_80px_rgba(16,35,25,0.16)]">
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
      </div>
    </main>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/90 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-950 shadow-sm backdrop-blur">
      {label}
    </span>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeReturnPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
