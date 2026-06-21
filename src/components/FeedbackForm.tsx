"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, Send, Sparkles, Star } from "lucide-react";

const ratingLabels: Record<number, { label: string; feedbackType: string; helper: string }> = {
  1: { label: "Poor", feedbackType: "wrong-or-missing", helper: "Something was wrong, unsafe, or not useful." },
  2: { label: "Okay", feedbackType: "unclear", helper: "It helped a little, but needs clearer guidance." },
  3: { label: "Good", feedbackType: "helpful", helper: "The guidance was useful, with room to improve." },
  4: { label: "Great", feedbackType: "helpful", helper: "The guidance was clear and helpful." },
  5: { label: "Amazing!", feedbackType: "helpful", helper: "The guidance felt polished, safe, and useful." },
};

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
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activeRating = hoverRating || rating;
  const ratingCopy = useMemo(() => (rating > 0 ? ratingLabels[rating] : null), [rating]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ratingCopy) {
      setStatus("Please choose a star rating first.");
      return;
    }

    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          category,
          urgency,
          provider,
          feedbackType: `${ratingCopy.feedbackType}: ${rating} star - ${ratingCopy.label}`,
          comment,
        }),
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Feedback could not be submitted.");
      }

      setStatus(data.message ?? "Feedback captured for review.");
      setComment("");
      setSubmitted(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Feedback could not be submitted.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="sb-scroll-reveal sb-scroll-reveal-visible relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#244B35] to-[#2f6448] p-8 text-center text-white shadow-[0_22px_70px_rgba(16,35,25,0.16)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_58%)]" />
        <div className="relative z-10">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-white/15">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Thank you for your feedback!</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-white/72">
            Your rating helps the Human Review layer identify unclear, missing, or risky guidance.
          </p>
          {status ? <p className="mt-4 text-xs font-bold text-white/55">{status}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="sb-card-lift relative scroll-mb-40 overflow-hidden rounded-[1.75rem] border border-[#244B35]/10 bg-white p-6 shadow-[0_18px_55px_rgba(16,35,25,0.07)] sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 size-48 rounded-full bg-[#B8793A]/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-48 rounded-full bg-[#12A6A6]/[0.06] blur-3xl" />

      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#E7F4F1] text-[#244B35]">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#12A6A6]">Improve guidance</p>
            <h2 className="text-xl font-black tracking-tight text-[#244B35]">Was this helpful?</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const label = ratingLabels[star].label;
                const isActive = star <= activeRating;
                return (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="group relative rounded-xl p-1 transition hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#B8793A]/15"
                    aria-label={`Rate ${star} stars: ${label}`}
                  >
                    <Star
                      className={`size-9 transition duration-200 ${
                        isActive ? "fill-amber-400 text-amber-400 drop-shadow" : "text-[#244B35]/16 group-hover:text-amber-300"
                      }`}
                    />
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#244B35] px-2 py-1 text-xs font-bold text-white opacity-0 shadow-sm transition group-hover:opacity-100">
                      {label}
                    </span>
                  </button>
                );
              })}
              {ratingCopy ? <span className="ml-1 text-sm font-black text-[#B8793A]">{ratingCopy.label}</span> : null}
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#244B35]/62">
              {ratingCopy ? ratingCopy.helper : "Choose a star rating. A comment box will appear after you rate."}
            </p>
          </div>

          <div
            className={`grid transition-all duration-300 ease-out ${
              rating > 0 ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 size-4 text-[#244B35]/30" />
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Optional: tell us what was wrong, missing, confusing, or useful."
                  className="min-h-28 w-full resize-none rounded-2xl border-2 border-[#E7F4F1] bg-white px-11 py-3 text-sm leading-6 text-[#244B35] outline-none transition focus:border-[#B8793A] focus:ring-4 focus:ring-[#B8793A]/10"
                />
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-[#244B35]/62">{status}</p>
                <button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="sb-button-motion inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[#B8793A] px-5 py-3 text-sm font-black text-white shadow-[0_12px_26px_rgba(184,121,58,0.22)] transition hover:bg-[#9f642f] disabled:cursor-not-allowed disabled:bg-[#244B35]/30"
                >
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Submit feedback
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
