import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HandoffExperience } from "@/components/HandoffExperience";

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

        <HandoffExperience need={need} location={location} mode={mode} className="mt-6" />
      </div>
    </main>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeReturnPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
