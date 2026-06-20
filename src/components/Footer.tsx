import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#244B35]/10 bg-[#ffffed] px-5 py-10 text-[#244B35] sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-lg font-black tracking-tight">ServiceBridge AI</p>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#244B35]/70">
            Benefits guidance, document readiness, and human verification routes. Final eligibility stays with official
            offices and qualified advisers.
          </p>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm font-black">
          <Link href="/" className="rounded-full bg-white px-4 py-2 ring-1 ring-[#244B35]/10 hover:bg-[#F6F1E7]">
            Home
          </Link>
          <Link href="/intake" className="rounded-full bg-white px-4 py-2 ring-1 ring-[#244B35]/10 hover:bg-[#F6F1E7]">
            Guided check
          </Link>
          <Link href="#programs" className="rounded-full bg-white px-4 py-2 ring-1 ring-[#244B35]/10 hover:bg-[#F6F1E7]">
            Programs
          </Link>
        </nav>
      </div>
    </footer>
  );
}
