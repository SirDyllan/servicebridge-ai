import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardCheck,
  FileText,
  Handshake,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { ProgramCards } from "@/components/ProgramCards";

const introCards = [
  {
    title: "Check possible support",
    description: "Classify food, education, emergency, student welfare, and family-support needs.",
    image: "/images/support.jpg",
    icon: Sparkles,
  },
  {
    title: "Prepare documents",
    description: "Surface ID, birth certificate, proof of residence, enrollment, and income gaps.",
    image: "/images/documents.jpg",
    icon: FileText,
  },
  {
    title: "Verify with a human",
    description: "Route final eligibility, urgent cases, and official requirements to trusted people.",
    image: "/images/human.jpg",
    icon: Handshake,
  },
];

const floatingCards = [
  {
    title: "Source-backed guidance",
    description: "Every pathway is grounded in curated records and source labels.",
    icon: ShieldCheck,
  },
  {
    title: "Document readiness",
    description: "Users see what is missing before they travel, apply, or ask for help.",
    icon: ClipboardCheck,
  },
  {
    title: "Human referral guardrails",
    description: "The AI prepares the user, while people keep control of final decisions.",
    icon: HeartHandshake,
  },
];

const previewCards = [
  {
    title: "Food Support",
    description: "For users who need meal, grocery, or short-term food pathways while eligibility is verified.",
    icon: Utensils,
  },
  {
    title: "Education Support",
    description: "For students navigating school fees, transport, supplies, scholarships, or training support.",
    icon: BookOpenCheck,
  },
  {
    title: "Student Welfare",
    description: "For student affairs, campus welfare, hardship support, and adviser escalation.",
    icon: HeartHandshake,
  },
  {
    title: "Emergency Relief",
    description: "For urgent needs where the user should be routed toward immediate human or official support.",
    icon: ShieldCheck,
  },
  {
    title: "Document Readiness",
    description: "For users blocked by missing ID, birth certificate, proof of residence, or income evidence.",
    icon: FileText,
  },
  {
    title: "Healthcare Access",
    description: "For healthcare access barriers, with clinical decisions kept with qualified health workers.",
    icon: HeartHandshake,
  },
  {
    title: "Youth Employment",
    description: "For job-readiness, income recovery, unemployment proof, and skills-support pathways.",
    icon: ClipboardCheck,
  },
  {
    title: "Family / Childcare",
    description: "For caregivers preparing dependent documents, childcare support, or household-support applications.",
    icon: HeartHandshake,
  },
  {
    title: "Human Referral",
    description: "For final verification by student affairs, social workers, official offices, or trusted advisers.",
    icon: Handshake,
  },
];

const pathwayToneStyles = [
  "from-[#EAF7EF] via-[#FFFDF8] to-white text-[#244B35] shadow-emerald-950/10",
  "from-[#E7F4F1] via-[#FFFDF8] to-white text-[#244B35] shadow-teal-950/10",
  "from-[#F6F1E7] via-[#FFFDF8] to-white text-[#244B35] shadow-amber-950/10",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(18,166,166,0.10),transparent_34%),linear-gradient(180deg,#F6F1E7_0%,#FFFFFF_42%,#F6F1E7_100%)] text-[#17231C]">
      <Navbar />
      <Hero />

      <section id="benefits" className="relative bg-[#6F835F] px-5 pb-28 pt-16 text-white sm:px-8 lg:pb-36">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div className="sb-fade-up">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-white/75">Benefits navigation</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black uppercase leading-tight tracking-tight sm:text-5xl">
                We turn confusion into action
              </h2>
            </div>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-white/20 bg-white/12 p-5 text-white shadow-[0_18px_55px_rgba(16,35,25,0.12)] backdrop-blur-md">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-white/70">Purpose of this section</p>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-white/86">
              The Benefits section helps users explain what kind of help they need first, such as food, education,
              emergency relief, documents, or human referral. It is the starting point for understanding the problem
              before matching a user to a specific program.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {introCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className="sb-card-lift overflow-hidden rounded-[1.75rem] bg-white text-[#244B35] shadow-[0_24px_60px_rgba(16,35,25,0.18)]"
                >
                  <div className="relative h-56">
                    <Image src={card.image} alt="" fill sizes="(min-width: 1024px) 31vw, 92vw" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#244B35]/55 to-transparent" />
                    <span className="absolute bottom-4 left-4 flex size-12 items-center justify-center rounded-2xl bg-white text-[#12A6A6] shadow-sm">
                      <Icon className="size-6" />
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-black">{card.title}</h3>
                    <p className="mt-3 text-sm font-semibold leading-7 text-[#244B35]/72">{card.description}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/intake"
              className="sb-button-motion inline-flex items-center justify-center gap-2 rounded-full bg-[#B8793A] px-7 py-4 text-sm font-black text-white shadow-sm transition hover:bg-[#9f642f]"
            >
              Start Guided Check
              <ArrowRight className="size-4" />
            </Link>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/78">
              Answer a few simple questions and receive possible support pathways, document readiness, and safe next
              steps.
            </p>
          </div>
        </div>

        <div className="mt-12 px-0 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:translate-y-1/2 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-3">
            {floatingCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className="sb-card-lift rounded-[1.5rem] border border-[#244B35]/10 bg-[#FFFDF8] p-6 shadow-[0_24px_60px_rgba(16,35,25,0.14)]"
                >
                  <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#E7F4F1] text-[#0B7777]">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="text-lg font-black text-[#244B35]">{card.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#244B35]/68">{card.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-[linear-gradient(180deg,#ffffed_0%,#ffffed_78%,#F6F1E7_100%)] px-5 pb-20 pt-16 text-[#244B35] sm:px-8 lg:pt-36"
      >
        <div className="mx-auto max-w-7xl">
          <div className="sb-fade-up mx-auto max-w-4xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0B7777]">
              <span className="sb-type-reveal sb-type-reveal-short">How it works</span>
            </p>
            <h2 className="mx-auto mt-3 max-w-4xl text-3xl font-black uppercase leading-[1.08] tracking-tight text-[#244B35] sm:text-5xl lg:text-6xl">
              <span className="sb-type-reveal sb-type-reveal-delay">We help users move from stress to clarity</span>
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-[#244B35]/72">
              Public support systems can be confusing, especially when users do not know the right program name,
              required documents, or office to contact. ServiceBridge AI asks simple questions, checks support pathways,
              and explains the next steps in plain language.
            </p>
          </div>

          <div id="pathways" className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {previewCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className={`sb-pathway-tile group relative grid min-h-[230px] gap-5 overflow-hidden rounded-[1.75rem] border border-[#244B35]/10 bg-gradient-to-br p-6 shadow-[0_18px_48px_rgba(16,35,25,0.08)] ${pathwayToneStyles[index % pathwayToneStyles.length]}`}
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-[#244B35] shadow-[0_14px_35px_rgba(16,35,25,0.12)] ring-1 ring-[#244B35]/10 backdrop-blur">
                      <Icon className="size-6 transition duration-300 group-hover:scale-110" />
                    </span>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#B8793A]">Pathway {index + 1}</p>
                  </div>
                  <div className="relative z-10">
                    <h3 className="mt-1 text-xl font-black text-[#244B35]">{card.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-7 text-[#244B35]/70">{card.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <ProgramCards />
    </main>
  );
}
