import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowRight, ShieldCheck } from "lucide-react";
import { HeroSlideshow } from "@/components/HeroSlideshow";

const logoBubbles = [
  { classes: "left-[7%] top-[13%] size-16 opacity-80", delay: "0ms" },
  { classes: "right-[11%] top-[16%] size-20 opacity-75", delay: "600ms" },
  { classes: "right-[24%] bottom-[18%] size-14 opacity-70", delay: "1100ms" },
  { classes: "left-[42%] bottom-[12%] size-12 opacity-65", delay: "1500ms" },
  { classes: "right-[6%] bottom-[34%] size-10 opacity-60", delay: "1900ms" },
];

export function Hero() {
  return (
    <section className="bg-[#F6F1E7] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative min-h-[650px] overflow-hidden rounded-[2rem] bg-[#244B35] shadow-[0_30px_90px_rgba(36,75,53,0.24)]">
          <HeroSlideshow />
          <div className="absolute inset-0 bg-gradient-to-r from-[#244B35]/95 via-[#244B35]/72 to-[#0B2D4D]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
            {logoBubbles.map((bubble, index) => (
              <span
                key={bubble.classes}
                className={`sb-logo-bubble absolute hidden items-center justify-center rounded-full border border-white/25 bg-white/14 shadow-[0_18px_60px_rgba(255,255,255,0.12)] backdrop-blur-md sm:flex ${bubble.classes}`}
                style={{ animationDelay: bubble.delay }}
              >
                <Image
                  src="/images/logoo.png"
                  alt=""
                  fill
                  sizes="80px"
                  className="object-contain p-3 opacity-90"
                  priority={index === 0}
                />
              </span>
            ))}
          </div>

          <div className="relative z-10 flex min-h-[650px] max-w-4xl flex-col justify-center px-6 py-14 sm:px-10 lg:px-14">
            <div className="sb-hero-reveal mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white backdrop-blur">
              <ShieldCheck className="size-4" />
              Welcome to ServiceBridge AI
            </div>
            <h1 className="max-w-3xl text-5xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              <span className="sb-type-reveal">Find public support you may be eligible for.</span>
            </h1>
            <p className="sb-fade-up-delay-2 mt-6 max-w-2xl text-base font-semibold leading-8 text-white/88 sm:text-lg">
              ServiceBridge AI turns confusing benefit rules into simple questions, document checklists, and safe next
              steps.
            </p>
            <div className="sb-fade-up-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/intake"
                className="sb-button-motion inline-flex items-center justify-center gap-2 rounded-full bg-[#B8793A] px-6 py-4 text-sm font-black text-white shadow-sm hover:bg-[#9f642f]"
              >
                Start Guided Check
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="sb-button-motion inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-white/12 px-6 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
              >
                See how it works
                <ArrowDown className="size-4" />
              </Link>
            </div>
            <p className="sb-fade-up-delay-3 mt-7 max-w-2xl rounded-2xl border border-white/15 bg-white/10 p-4 text-sm font-semibold leading-6 text-white/85 backdrop-blur">
              Guidance only - final eligibility is confirmed by official offices or human advisors.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
