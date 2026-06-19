import { AlertTriangle, CheckCircle2, CircleHelp, FileText } from "lucide-react";
import type { DocumentReadiness, DocumentStatus } from "@/types/benefits";

const statusCopy: Record<DocumentStatus, string> = {
  available: "Available",
  missing: "Missing",
  unknown: "Check",
};

const statusStyles: Record<DocumentStatus, string> = {
  available: "bg-emerald-50 text-emerald-900 ring-emerald-900/15",
  missing: "bg-red-50 text-red-900 ring-red-900/15",
  unknown: "bg-slate-100 text-slate-700 ring-slate-300",
};

const statusIcons = {
  available: CheckCircle2,
  missing: AlertTriangle,
  unknown: CircleHelp,
};

export function DocumentChecklist({ readiness }: { readiness: DocumentReadiness }) {
  return (
    <section className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
          <FileText className="size-5" />
        </span>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-800">Document readiness</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">What to prepare before applying</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{readiness.summary}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {readiness.items.map((item) => {
          const Icon = statusIcons[item.status];
          return (
            <article key={item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-emerald-800" />
                  <h3 className="text-sm font-black text-slate-950">{item.name}</h3>
                </div>
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ring-1 ${statusStyles[item.status]}`}
                >
                  {statusCopy[item.status]}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.guidance}</p>
            </article>
          );
        })}
      </div>

      {readiness.idPreparationSteps.length ? (
        <div className="mt-5 rounded-2xl bg-[#eaf7ef] p-4">
          <p className="text-sm font-black text-emerald-950">If ID is missing</p>
          <ol className="mt-3 grid gap-2">
            {readiness.idPreparationSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-emerald-950">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-black text-white">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
