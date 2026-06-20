import { AlertTriangle, ShieldCheck, UserCheck } from "lucide-react";

const principles = [
  {
    title: "Risk",
    icon: AlertTriangle,
    text:
      "The AI may misunderstand a user's situation or incorrectly interpret benefit requirements. That could lead someone to prepare the wrong documents, visit the wrong office, or over-trust an AI response.",
  },
  {
    title: "Mitigation",
    icon: ShieldCheck,
    text:
      "ServiceBridge AI uses possible-match language, source labels, uncertainty notes, document checklists, grounded service records, and human referral prompts. It does not make final eligibility decisions.",
  },
  {
    title: "Human in the loop",
    icon: UserCheck,
    text:
      "The AI helps users understand possible pathways and prepare next steps. Final eligibility, approval, and official interpretation remain with humans and official agencies.",
  },
];

export function ResponsibleAiStatement() {
  return (
    <section className="bg-[#ffffed] px-5 py-16 text-[#244B35] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0B7777]">Responsible AI</p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-tight tracking-tight sm:text-5xl">
              What happens if the AI gets it wrong?
            </h2>
          </div>
          <p className="max-w-3xl text-base font-semibold leading-8 text-[#244B35]/72">
            ServiceBridge AI is designed as a preparation and navigation tool, not an approval system. It keeps
            uncertainty visible, avoids guaranteed claims, and routes final decisions back to official offices or human
            advisers.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <article
                key={principle.title}
                className="rounded-[1.5rem] border border-[#244B35]/10 bg-white p-6 shadow-[0_18px_48px_rgba(16,35,25,0.08)]"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#E7F4F1] text-[#0B7777]">
                  <Icon className="size-6" />
                </div>
                <h3 className="text-xl font-black">{principle.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#244B35]/72">{principle.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
