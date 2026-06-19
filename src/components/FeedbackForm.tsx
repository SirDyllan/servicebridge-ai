"use client";

import { FormEvent, useState } from "react";
import { Loader2, Send } from "lucide-react";

const feedbackOptions = [
  { value: "helpful", label: "Helpful" },
  { value: "unclear", label: "Unclear" },
  { value: "wrong-or-missing", label: "Wrong or missing info" },
  { value: "safety-risk", label: "Safety concern" },
];

export function FeedbackForm({
  query,
  category,
  urgency,
  provider,
}: {
  query: string;
  category: string;
  urgency: string;
  provider: string;
}) {
  const [feedbackType, setFeedbackType] = useState("helpful");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, category, urgency, provider, feedbackType, comment }),
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Feedback could not be submitted.");
      }

      setStatus(data.message ?? "Feedback captured for review.");
      setComment("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Feedback could not be submitted.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="scroll-mb-40 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-800">Feedback loop</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Help improve this guidance</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Users can flag wrong, unclear, risky, or missing guidance so the team can improve source records and handoff
          guidance.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        <div className="grid gap-2 sm:grid-cols-4">
          {feedbackOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => setFeedbackType(option.value)}
              className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                feedbackType === option.value
                  ? "border-emerald-800 bg-emerald-800 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Optional: tell us what was wrong, missing, or confusing."
          className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">{status}</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Submit feedback
          </button>
        </div>
      </form>
    </section>
  );
}
