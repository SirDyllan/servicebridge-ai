export function NextStepsList({ steps }: { steps: string[] }) {
  const nextSteps = steps.filter(Boolean).slice(0, 3);

  return (
    <section className="rounded-2xl border border-[#244B35]/10 bg-white p-4">
      <p className="text-sm font-black text-[#244B35]">Next 3 steps</p>
      {nextSteps.length ? (
        <ol className="mt-3 grid gap-2">
          {nextSteps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-6 text-[#244B35]/78">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#244B35] text-xs font-black text-white">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm font-semibold leading-6 text-[#244B35]/70">
          Next steps need review. Ask the official office what to do before applying.
        </p>
      )}
    </section>
  );
}
