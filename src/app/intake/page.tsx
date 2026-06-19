import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GuidedIntake } from "@/components/GuidedIntake";

export default function IntakePage() {
  return (
    <main className="min-h-screen bg-[#f7faf8] px-5 py-6 text-slate-950 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-emerald-950/10 bg-white px-4 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
        >
          <ArrowLeft className="size-4" />
          Back home
        </Link>
        <GuidedIntake />
      </div>
    </main>
  );
}
