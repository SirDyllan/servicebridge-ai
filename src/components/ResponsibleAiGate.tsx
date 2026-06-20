"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { ShieldCheck } from "lucide-react";

const storageKey = "servicebridge:responsible-ai-acknowledged:v2";
const changeEventName = "servicebridge:responsible-ai-changed";

export function ResponsibleAiGate() {
  const isAcknowledged = useSyncExternalStore(subscribeToAcknowledgement, getAcknowledgement, getServerAcknowledgement);

  function handleUnderstand() {
    window.localStorage.setItem(storageKey, "true");
    window.dispatchEvent(new Event(changeEventName));
  }

  if (isAcknowledged) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#12251b]/72 px-5 backdrop-blur-sm">
      <section className="w-full max-w-xl rounded-[1.75rem] bg-[#ffffed] p-6 text-[#244B35] shadow-[0_30px_90px_rgba(0,0,0,0.28)] ring-1 ring-white/30 sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="relative flex size-16 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#244B35]/10">
            <Image src="/images/logoo.png" alt="ServiceBridge AI logo" fill sizes="64px" className="object-contain p-2" />
          </span>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0B7777] shadow-sm ring-1 ring-[#244B35]/10">
            <ShieldCheck className="size-6" />
          </span>
        </div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0B7777]">Before you start</p>
        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
          ServiceBridge AI gives guidance, not final approval.
        </h2>
        <p className="mt-4 text-sm font-semibold leading-7 text-[#244B35]/76">
          The app can suggest possible support pathways, documents to prepare, and offices to contact. Requirements can
          differ by location, so final eligibility and official decisions must be verified with an official office,
          student affairs team, social worker, or qualified adviser.
        </p>
        <button
          type="button"
          onClick={handleUnderstand}
          className="mt-6 w-full rounded-2xl bg-emerald-800 px-5 py-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
        >
          I understand
        </button>
      </section>
    </div>
  );
}

function subscribeToAcknowledgement(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(changeEventName, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(changeEventName, onStoreChange);
  };
}

function getAcknowledgement() {
  return window.localStorage.getItem(storageKey) === "true";
}

function getServerAcknowledgement() {
  return true;
}
