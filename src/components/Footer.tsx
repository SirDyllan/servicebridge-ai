import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

const footerGroups = [
  {
    title: "Product",
    links: [
      { href: "/", label: "Home" },
      { href: "/intake", label: "Guided check" },
      { href: "/#programs", label: "Programs" },
      { href: "/handoff", label: "Verify with a human" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/#responsible-ai", label: "Responsible AI" },
      { href: "/#faq", label: "FAQ" },
      { href: "/#how-it-works", label: "How it works" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#1A3A2C] px-5 py-14 text-white sm:px-8 lg:py-16">
      <div className="pointer-events-none absolute -left-32 top-0 size-72 rounded-full bg-[#12A6A6]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-80 rounded-full bg-[#B8793A]/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div>
            <Link href="/" className="group inline-flex items-center gap-4" aria-label="ServiceBridge AI home">
              <span className="relative flex size-14 overflow-hidden rounded-2xl bg-white shadow-[0_14px_38px_rgba(0,0,0,0.16)] ring-1 ring-white/20">
                <Image src="/images/logoo.png" alt="ServiceBridge AI logo" fill sizes="56px" className="object-contain p-2" />
              </span>
              <span className="text-2xl font-black tracking-tight">
                ServiceBridge<span className="text-[#B8793A]"> AI</span>
              </span>
            </Link>

            <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-white/62">
              AI-powered benefits guidance for the USA and Zimbabwe. We help people understand possible support,
              prepare documents, view sources, and verify with a human before applying.
            </p>

            <div className="mt-6 inline-flex max-w-xl items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold leading-5 text-white/58">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#B8793A]" />
              <span>
                Guidance only - not official decisions. The AI prepares next steps; official agencies and trained humans
                confirm eligibility.
              </span>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {footerGroups.map((group) => (
              <nav key={group.title} aria-label={`${group.title} footer links`}>
                <h2 className="text-xs font-black uppercase tracking-[0.18em] text-white/36">{group.title}</h2>
                <ul className="mt-5 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-2 text-sm font-bold text-white/56 transition hover:text-white"
                      >
                        {link.label}
                        <ArrowUpRight className="size-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col gap-4 text-xs font-semibold text-white/34 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {new Date().getFullYear()} ServiceBridge AI. Built for the USAII Global AI Hackathon 2026.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <span>Source-backed guidance</span>
              <span>Document readiness</span>
              <span>Human verification</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
