"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, FileCheck2, ShieldCheck } from "lucide-react";
import { useRef } from "react";
import { programCards } from "@/data/program-directory";

const regionStyles = {
  USA: "bg-blue-50 text-blue-900 ring-blue-900/10",
  Zimbabwe: "bg-emerald-50 text-emerald-900 ring-emerald-900/10",
};

export function ProgramCards() {
  const rowRef = useRef<HTMLDivElement>(null);

  function scrollPrograms(direction: "left" | "right") {
    const row = rowRef.current;
    if (!row) return;

    row.scrollBy({
      left: direction === "right" ? row.clientWidth * 0.82 : -row.clientWidth * 0.82,
      behavior: "smooth",
    });
  }

  return (
    <section
      id="programs"
      className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(18,166,166,0.10),transparent_34%),linear-gradient(180deg,#F6F1E7_0%,#FFFFFF_48%,#F6F1E7_100%)] px-5 py-16 sm:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div className="sb-fade-up">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#12A6A6]">Learn more</p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-tight tracking-tight text-[#244B35] sm:text-5xl">
              Program pathways users may need
            </h2>
          </div>
          <div className="sb-fade-up-delay-1">
            <p className="max-w-3xl text-base font-semibold leading-8 text-[#244B35]/72">
              Swipe through official or source-backed starting points. Each card shows possible fit, documents to
              prepare, and the human/official verification reminder before a user applies.
            </p>
            <div className="mt-5 hidden gap-2 lg:flex">
              <button
                type="button"
                aria-label="Scroll programs left"
                onClick={() => scrollPrograms("left")}
                className="sb-button-motion inline-flex size-12 items-center justify-center rounded-full border border-[#244B35]/15 bg-white text-[#244B35] shadow-sm hover:bg-[#F6F1E7]"
              >
                <ArrowLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Scroll programs right"
                onClick={() => scrollPrograms("right")}
                className="sb-button-motion inline-flex size-12 items-center justify-center rounded-full bg-[#244B35] text-white shadow-sm hover:bg-[#183324]"
              >
                <ArrowRight className="size-5" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={rowRef}
          className="sb-snap-row -mx-5 mt-10 flex gap-5 overflow-x-auto px-5 pb-5 sm:-mx-8 sm:px-8"
          aria-label="Swipeable support program cards"
        >
          {programCards.map((program, index) => (
            <article
              key={program.id}
              className="sb-snap-card sb-card-lift flex min-h-[670px] w-[86vw] max-w-[390px] shrink-0 flex-col overflow-hidden rounded-[1.5rem] border border-[#244B35]/10 bg-white shadow-[0_18px_55px_rgba(16,35,25,0.08)] md:w-[420px]"
              style={{ animationDelay: `${Math.min(index, 5) * 70}ms` }}
            >
              <div className="relative h-52 overflow-hidden bg-[#F6F1E7]">
                <Image
                  src={program.image}
                  alt={`${program.name} program image`}
                  fill
                  sizes="(min-width: 768px) 420px, 86vw"
                  className="object-cover transition duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#244B35]/72 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${regionStyles[program.region]}`}>
                    {program.region}
                  </span>
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#244B35] backdrop-blur">
                    {program.category}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start gap-2 rounded-2xl bg-[#E7F4F1] p-3 text-[#244B35]">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0B7777]" />
                  <p className="text-xs font-black leading-5">
                    You may be a possible match. This is guidance only, not final eligibility.
                  </p>
                </div>

                <h3 className="mt-4 text-xl font-black tracking-tight text-[#244B35]">{program.name}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#244B35]/72">{program.summary}</p>
                <p className="mt-3 rounded-2xl bg-[#F6F1E7] p-3 text-xs font-bold leading-5 text-[#244B35]">
                  {program.possibleEligibility}
                </p>

                <div className="mt-5">
                  <div className="flex items-center gap-2 text-sm font-black text-[#244B35]">
                    <FileCheck2 className="size-4 text-[#0B7777]" />
                    Documents needed
                  </div>
                  <ul className="mt-3 grid gap-2">
                    {program.documents.slice(0, 4).map((document) => (
                      <li key={document} className="flex gap-2 text-sm font-semibold leading-6 text-[#244B35]/72">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#0B7777]" />
                        {document}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-900">Verification note</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-amber-950">{program.verificationNote}</p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                  <Link
                    href="/intake"
                    className="sb-button-motion inline-flex items-center gap-2 rounded-full bg-[#B8793A] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#9f642f]"
                  >
                    Check next steps
                    <ArrowRight className="size-4" />
                  </Link>
                  <a
                    href={program.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="sb-button-motion inline-flex items-center gap-2 rounded-full border border-[#244B35]/15 bg-white px-4 py-3 text-sm font-black text-[#244B35] hover:bg-[#F6F1E7]"
                  >
                    Source
                    <ExternalLink className="size-4" />
                  </a>
                </div>
                <p className="mt-3 text-xs font-bold text-[#244B35]/55">{program.sourceLabel}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
