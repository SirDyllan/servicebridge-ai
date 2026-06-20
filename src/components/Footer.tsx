import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-[#244B35]/10 bg-[#ffffed] px-5 py-10 text-[#244B35] sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-start">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Link
            href="/"
            aria-label="ServiceBridge AI home"
            className="relative flex size-28 shrink-0 overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-[#244B35]/10 sm:size-32"
          >
            <Image src="/images/logoo.png" alt="ServiceBridge AI logo" fill sizes="128px" className="object-contain p-3" />
          </Link>
          <div>
            <p className="text-2xl font-black tracking-tight">ServiceBridge AI</p>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#244B35]/70">
              Benefits guidance, document readiness, and human verification routes. Final eligibility stays with official
              offices and qualified advisers.
            </p>
          </div>
        </div>

        <nav className="flex min-w-44 flex-col gap-3 text-sm font-black" aria-label="Footer quick links">
          <p className="text-xs uppercase tracking-[0.18em] text-[#244B35]/55">Quick links</p>
          <Link href="/" className="rounded-2xl bg-white px-4 py-3 ring-1 ring-[#244B35]/10 hover:bg-[#F6F1E7]">
            Home
          </Link>
          <Link href="/intake" className="rounded-2xl bg-white px-4 py-3 ring-1 ring-[#244B35]/10 hover:bg-[#F6F1E7]">
            Guided check
          </Link>
          <Link href="#programs" className="rounded-2xl bg-white px-4 py-3 ring-1 ring-[#244B35]/10 hover:bg-[#F6F1E7]">
            Programs
          </Link>
          <Link href="#chatbot" className="rounded-2xl bg-white px-4 py-3 ring-1 ring-[#244B35]/10 hover:bg-[#F6F1E7]">
            ChatBot
          </Link>
        </nav>
      </div>
    </footer>
  );
}
