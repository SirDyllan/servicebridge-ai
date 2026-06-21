"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

const faqs = [
  {
    question: "How does ServiceBridge AI work?",
    answer:
      "You describe your situation in plain language. The system classifies the support need, checks source-backed program records, prepares document guidance, and shows where to verify with a human or official office.",
  },
  {
    question: "Does the AI decide if I qualify?",
    answer:
      "No. ServiceBridge AI only provides guidance and possible matches. Final eligibility, approval, and official interpretation must remain with official agencies, schools, social workers, case workers, or verified support providers.",
  },
  {
    question: "What documents should I prepare?",
    answer:
      "The results page shows documents directly on each support match, such as ID, proof of residence, student letter, proof of income change, or other program-specific documents. Requirements can vary, so they must be verified before applying.",
  },
  {
    question: "Why are there official-source and Google Maps buttons?",
    answer:
      "The official-source button helps you verify program details. The Google Maps search helps you look for the relevant office type near your location. Both are starting points, not guarantees of eligibility, address accuracy, or office availability.",
  },
  {
    question: "Which countries are included in the demo?",
    answer:
      "The MVP includes sample, source-backed pathways for the USA and Zimbabwe, including food support, healthcare access, education support, ID/document readiness, family support, and employment support.",
  },
  {
    question: "What happens if the AI gets something wrong?",
    answer:
      "The system uses cautious language, shows source labels, displays uncertainty, asks for human verification, and allows feedback to flag wrong, missing, unclear, or unsafe guidance for review.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-[#FDFBF0] px-5 py-20 text-[#244B35] sm:px-8 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B8793A]">FAQ</p>
          <h2 className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-5xl">Questions & answers</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#244B35]/68">
            Clear answers for judges and users about safety, documents, and human verification.
          </p>
        </ScrollReveal>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <ScrollReveal key={faq.question} delay={index * 60}>
                <article className="overflow-hidden rounded-[1.5rem] border border-[#244B35]/10 bg-white shadow-[0_16px_45px_rgba(16,35,25,0.07)]">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-[#E7F4F1]/45 sm:px-6"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-black leading-6 text-[#244B35] sm:text-base">{faq.question}</span>
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full transition duration-300 ${
                        isOpen ? "rotate-45 bg-[#B8793A] text-white" : "bg-[#E7F4F1] text-[#244B35]"
                      }`}
                    >
                      <Plus className="size-4" />
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-6 text-sm font-semibold leading-7 text-[#244B35]/68 sm:px-6">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
