import { AlertCircle, FileText, Lock, ShieldCheck } from "lucide-react";

const badges = [
  {
    label: "Source-backed guidance",
    description: "Uses curated service records and source labels.",
    icon: FileText,
  },
  {
    label: "Human referral guardrails",
    description: "Keeps final verification with people and official offices.",
    icon: ShieldCheck,
  },
  {
    label: "Privacy-conscious MVP",
    description: "Only asks for practical intake information for the demo.",
    icon: Lock,
  },
  {
    label: "Not final eligibility",
    description: "Uses may qualify language and shows uncertainty.",
    icon: AlertCircle,
  },
];

export function TrustBadges() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <div key={badge.label} className="rounded-2xl border border-emerald-950/10 bg-white p-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Icon className="size-5" />
            </div>
            <h3 className="text-sm font-black text-slate-950">{badge.label}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{badge.description}</p>
          </div>
        );
      })}
    </div>
  );
}
