"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Benefits", href: "#benefits" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Programs", href: "#programs" },
  { label: "Responsible AI", href: "#responsible-ai" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#244B35]/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative flex size-12 overflow-hidden rounded-2xl bg-[#F6F1E7] ring-1 ring-[#244B35]/10">
            <Image src="/images/logoo.png" alt="ServiceBridge AI logo" fill sizes="48px" className="object-contain p-1" />
          </span>
          <span className="text-xl font-black tracking-tight text-[#244B35] sm:text-2xl">ServiceBridge AI</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-black text-[#244B35]/80 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} className="transition hover:text-[#12A6A6]" href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/intake"
            className="rounded-full bg-[#B8793A] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#9f642f]"
          >
            Start Guided Check
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setIsOpen((current) => !current)}
          className="rounded-full border border-[#244B35]/15 p-3 text-[#244B35] lg:hidden"
        >
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {isOpen ? (
        <div className="border-t border-[#244B35]/10 bg-white px-5 py-4 shadow-lg lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                className="rounded-2xl px-4 py-3 text-sm font-black text-[#244B35] transition hover:bg-[#F6F1E7]"
                href={link.href}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/intake"
              onClick={() => setIsOpen(false)}
              className="mt-2 rounded-2xl bg-[#B8793A] px-4 py-3 text-center text-sm font-black text-white"
            >
              Start Guided Check
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
