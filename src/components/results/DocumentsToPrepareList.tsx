import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";

export function DocumentsToPrepareList({
  documents,
  missingDocuments = [],
}: {
  documents: string[];
  missingDocuments?: string[];
}) {
  const uniqueDocuments = Array.from(new Set(documents.filter(Boolean)));
  const uniqueMissing = Array.from(new Set(missingDocuments.filter(Boolean)));

  return (
    <section className="rounded-2xl border border-[#244B35]/10 bg-[#FFFDF8] p-4">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-[#12A6A6]" />
        <p className="text-sm font-black text-[#244B35]">Documents to prepare</p>
      </div>

      {uniqueDocuments.length ? (
        <ul className="mt-3 grid gap-2">
          {uniqueDocuments.map((document) => (
            <li key={document} className="flex gap-2 text-sm leading-6 text-[#244B35]/78">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#12A6A6]" />
              {document}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm font-semibold leading-6 text-[#244B35]/70">
          No document list is available yet. Confirm exact requirements with the official office.
        </p>
      )}

      {uniqueMissing.length ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-800" />
            <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-950">Missing or unknown</p>
          </div>
          <ul className="mt-2 grid gap-1">
            {uniqueMissing.map((document) => (
              <li key={document} className="text-sm font-semibold leading-6 text-amber-950">
                {document}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
