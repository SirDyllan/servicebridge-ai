"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ChevronLeft, Loader2, Sparkles } from "lucide-react";
import type { GuidanceResponse, IntakeFormData } from "@/types/benefits";

const emptyIntake: IntakeFormData = {
  age: "",
  studentStatus: "unknown",
  employmentStatus: "unknown",
  incomeSituation: "",
  dependents: "unknown",
  location: "",
  supportNeeded: [],
  urgency: "unknown",
  hasId: "unknown",
  hasProofOfResidence: "unknown",
  hasStudentLetter: "unknown",
  hasProofOfIncome: "unknown",
  freeText: "",
};

const demoIntake: IntakeFormData = {
  age: "18",
  studentStatus: "student",
  employmentStatus: "lost_job",
  incomeSituation: "I lost my part-time job and need help with food and school expenses.",
  dependents: "no",
  location: "Near my school or current city",
  supportNeeded: ["food support", "education support", "document readiness"],
  urgency: "this_week",
  hasId: "no",
  hasProofOfResidence: "unknown",
  hasStudentLetter: "unknown",
  hasProofOfIncome: "no",
  freeText:
    "I am 18, I am a student, I lost my part-time job, and I need help with food and school expenses. I do not have an ID yet.",
};

const supportOptions = [
  "food support",
  "education support",
  "emergency relief",
  "document readiness",
  "healthcare access",
  "youth employment",
  "family or childcare support",
  "human referral",
];

type Question =
  | {
      kind: "textarea" | "text";
      key: keyof IntakeFormData;
      eyebrow: string;
      title: string;
      description: string;
      label: string;
      placeholder?: string;
    }
  | {
      kind: "select";
      key: keyof IntakeFormData;
      eyebrow: string;
      title: string;
      description: string;
      label: string;
      options: [string, string][];
    }
  | {
      kind: "multi";
      eyebrow: string;
      title: string;
      description: string;
    }
  | {
      kind: "review";
      eyebrow: string;
      title: string;
      description: string;
    };

const questions: Question[] = [
  {
    kind: "textarea",
    key: "freeText",
    eyebrow: "Question 1",
    title: "Tell us what is happening",
    description: "Start in your own words. Short and real is best.",
    label: "Plain-language situation",
    placeholder:
      "Example: I am 18, I am a student, I lost my part-time job, and I need help with food and school expenses. I do not have an ID yet.",
  },
  {
    kind: "text",
    key: "age",
    eyebrow: "Question 2",
    title: "How old are you?",
    description: "Age can affect document readiness and support pathways.",
    label: "Age",
    placeholder: "Example: 18",
  },
  {
    kind: "text",
    key: "location",
    eyebrow: "Question 3",
    title: "Where should we look for support?",
    description: "Use a city, campus, country, or area. This helps avoid showing the wrong country program.",
    label: "Location",
    placeholder: "Example: Mutare City, Zimbabwe or Ohio, USA",
  },
  {
    kind: "select",
    key: "studentStatus",
    eyebrow: "Question 4",
    title: "Are you currently a student?",
    description: "Student status can connect you to welfare, food, fees, and proof-of-enrollment routes.",
    label: "Student status",
    options: [
      ["unknown", "Not sure"],
      ["student", "Student"],
      ["not_student", "Not a student"],
    ],
  },
  {
    kind: "select",
    key: "employmentStatus",
    eyebrow: "Question 5",
    title: "What is your work or income status?",
    description: "This helps identify income-change proof and employment-support options.",
    label: "Employment status",
    options: [
      ["unknown", "Not sure"],
      ["lost_job", "Lost job"],
      ["part_time", "Part-time"],
      ["unemployed", "Unemployed"],
      ["employed", "Employed"],
    ],
  },
  {
    kind: "select",
    key: "dependents",
    eyebrow: "Question 6",
    title: "Do you have children or dependents?",
    description: "Family and child support pathways often depend on household details.",
    label: "Dependents",
    options: [
      ["unknown", "Not sure"],
      ["no", "No"],
      ["yes", "Yes"],
    ],
  },
  {
    kind: "select",
    key: "urgency",
    eyebrow: "Question 7",
    title: "How urgent is this?",
    description: "Urgency helps separate emergency relief from a normal application.",
    label: "Urgency",
    options: [
      ["unknown", "Not sure"],
      ["today", "Today"],
      ["this_week", "This week"],
      ["normal", "Normal application"],
    ],
  },
  {
    kind: "text",
    key: "incomeSituation",
    eyebrow: "Question 8",
    title: "What changed with your income?",
    description: "A short sentence is enough. This can help prepare a proof-of-income-change note.",
    label: "Income situation",
    placeholder: "Example: I lost my part-time job and have no income this month.",
  },
  {
    kind: "select",
    key: "hasId",
    eyebrow: "Question 9",
    title: "Do you have an ID?",
    description: "If not, we will treat document readiness as part of the next steps.",
    label: "ID status",
    options: [
      ["unknown", "Not sure"],
      ["yes", "Yes"],
      ["no", "No"],
    ],
  },
  {
    kind: "select",
    key: "hasProofOfResidence",
    eyebrow: "Question 10",
    title: "Do you have proof of residence?",
    description: "Some offices accept alternatives, so unknown is okay.",
    label: "Proof of residence",
    options: [
      ["unknown", "Not sure"],
      ["yes", "Yes"],
      ["no", "No"],
    ],
  },
  {
    kind: "select",
    key: "hasStudentLetter",
    eyebrow: "Question 11",
    title: "Can you get a student letter?",
    description: "A student letter, student card, or registration record can help with student-support routes.",
    label: "Student letter or proof of enrollment",
    options: [
      ["unknown", "Not sure"],
      ["yes", "Yes"],
      ["no", "No"],
    ],
  },
  {
    kind: "select",
    key: "hasProofOfIncome",
    eyebrow: "Question 12",
    title: "Do you have income or unemployment proof?",
    description: "If not, the app can suggest a short explanation to prepare for a human adviser.",
    label: "Income/unemployment proof",
    options: [
      ["unknown", "Not sure"],
      ["yes", "Yes"],
      ["no", "No"],
    ],
  },
  {
    kind: "multi",
    eyebrow: "Question 13",
    title: "What support do you need?",
    description: "Choose one or more areas. This keeps the result focused.",
  },
  {
    kind: "review",
    eyebrow: "Final step",
    title: "Review and generate",
    description: "Confirm the summary, then generate guidance.",
  },
];

export function GuidedIntake() {
  const router = useRouter();
  const [intake, setIntake] = useState<IntakeFormData>(emptyIntake);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const narrative = useMemo(() => {
    return [
      intake.freeText,
      intake.age ? `Age: ${intake.age}` : "",
      intake.studentStatus !== "unknown" ? `Student status: ${intake.studentStatus}` : "",
      intake.employmentStatus !== "unknown" ? `Employment: ${intake.employmentStatus}` : "",
      intake.incomeSituation ? `Income situation: ${intake.incomeSituation}` : "",
      intake.location ? `Location: ${intake.location}` : "",
      intake.supportNeeded.length ? `Support needed: ${intake.supportNeeded.join(", ")}` : "",
      intake.urgency !== "unknown" ? `Urgency: ${intake.urgency}` : "",
      intake.hasId !== "unknown" ? `Has ID: ${intake.hasId}` : "",
      intake.hasProofOfResidence !== "unknown" ? `Has proof of residence: ${intake.hasProofOfResidence}` : "",
      intake.hasStudentLetter !== "unknown" ? `Has student letter: ${intake.hasStudentLetter}` : "",
      intake.hasProofOfIncome !== "unknown" ? `Has proof of income/unemployment: ${intake.hasProofOfIncome}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [intake]);

  const currentQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;
  const canGenerate = Boolean(narrative.trim()) && !isSubmitting;
  const progress = ((questionIndex + 1) / questions.length) * 100;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isLastQuestion) {
      setQuestionIndex((current) => Math.min(current + 1, questions.length - 1));
      return;
    }

    if (!canGenerate) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: narrative, intake }),
      });
      const data = (await response.json()) as GuidanceResponse | { error?: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data && data.error ? data.error : "Guidance could not be generated.");
      }

      window.localStorage.setItem("servicebridge:lastGuidance", JSON.stringify(data));
      window.localStorage.setItem("servicebridge:lastIntake", JSON.stringify(intake));
      window.localStorage.setItem("servicebridge:lastQuery", narrative);
      router.push("/results");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong while generating guidance.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<Key extends keyof IntakeFormData>(key: Key, value: IntakeFormData[Key]) {
    setIntake((current) => ({ ...current, [key]: value }));
  }

  function toggleSupport(option: string) {
    setIntake((current) => ({
      ...current,
      supportNeeded: current.supportNeeded.includes(option)
        ? current.supportNeeded.filter((item) => item !== option)
        : [...current.supportNeeded, option],
    }));
  }

  function loadDemoScenario() {
    setIntake(demoIntake);
    setQuestionIndex(0);
    setError("");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-3xl gap-5">
      <section className="rounded-[1.5rem] border border-emerald-950/10 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-800">{currentQuestion.eyebrow}</p>
            <h1 className="mt-2 max-w-2xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {currentQuestion.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{currentQuestion.description}</p>
          </div>
          <button
            type="button"
            onClick={loadDemoScenario}
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-emerald-900/15 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100"
          >
            <Sparkles className="size-4" />
            Load demo
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.14em] text-emerald-900">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-emerald-900/10">
            <div
              className="h-full rounded-full bg-emerald-800 transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {questions.map((question, index) => {
            const complete = index < questionIndex;
            const active = index === questionIndex;

            return (
              <button
                key={`${question.eyebrow}-${index}`}
                type="button"
                aria-label={`Go to ${question.eyebrow}`}
                onClick={() => setQuestionIndex(index)}
                className={`flex size-8 items-center justify-center rounded-full border text-[11px] font-black transition ${
                  active
                    ? "border-emerald-800 bg-emerald-800 text-white"
                    : complete
                      ? "border-emerald-900/10 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:border-emerald-800/20"
                }`}
              >
                {complete ? <CheckCircle2 className="size-4" /> : index + 1}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-emerald-950/10 bg-white p-5 shadow-[0_14px_44px_rgba(15,23,42,0.05)] sm:p-6">
        <QuestionBody
          question={currentQuestion}
          intake={intake}
          updateField={updateField}
          toggleSupport={toggleSupport}
          narrative={narrative}
        />
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-3 rounded-[1.5rem] border border-emerald-950/10 bg-[#eaf7ef] p-4 sm:flex-row sm:items-center">
        <p className="text-sm font-semibold leading-6 text-emerald-950">
          {isLastQuestion
            ? "Generate guidance when the summary looks right."
            : "One question at a time. You can go back if you need to change an answer."}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={questionIndex === 0 || isSubmitting}
            onClick={() => setQuestionIndex((current) => Math.max(current - 1, 0))}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-900/15 bg-white px-5 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={isLastQuestion ? !canGenerate : isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            {isLastQuestion ? "Generate guidance" : "Continue"}
          </button>
        </div>
      </div>
    </form>
  );
}

function QuestionBody({
  question,
  intake,
  updateField,
  toggleSupport,
  narrative,
}: {
  question: Question;
  intake: IntakeFormData;
  updateField: <Key extends keyof IntakeFormData>(key: Key, value: IntakeFormData[Key]) => void;
  toggleSupport: (option: string) => void;
  narrative: string;
}) {
  if (question.kind === "textarea") {
    return (
      <label className="block">
        <span className="text-sm font-black text-slate-900">{question.label}</span>
        <textarea
          value={String(intake[question.key])}
          onChange={(event) => updateField(question.key, event.target.value as IntakeFormData[typeof question.key])}
          placeholder={question.placeholder}
          className="mt-3 min-h-40 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
        />
      </label>
    );
  }

  if (question.kind === "text") {
    return (
      <label className="block">
        <span className="text-sm font-black text-slate-900">{question.label}</span>
        <input
          value={String(intake[question.key])}
          onChange={(event) => updateField(question.key, event.target.value as IntakeFormData[typeof question.key])}
          placeholder={question.placeholder}
          className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
        />
      </label>
    );
  }

  if (question.kind === "select") {
    return (
      <label className="block">
        <span className="text-sm font-black text-slate-900">{question.label}</span>
        <select
          value={String(intake[question.key])}
          onChange={(event) => updateField(question.key, event.target.value as IntakeFormData[typeof question.key])}
          className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
        >
          {question.options.map(([optionValue, labelText]) => (
            <option key={optionValue} value={optionValue}>
              {labelText}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (question.kind === "multi") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {supportOptions.map((option) => {
          const selected = intake.supportNeeded.includes(option);
          return (
            <button
              type="button"
              key={option}
              onClick={() => toggleSupport(option)}
              className={`rounded-2xl border px-4 py-4 text-left text-sm font-black transition hover:-translate-y-0.5 ${
                selected
                  ? "border-emerald-800 bg-emerald-800 text-white shadow-lg shadow-emerald-950/10"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  return <ReviewStep intake={intake} narrative={narrative} />;
}

function ReviewStep({ intake, narrative }: { intake: IntakeFormData; narrative: string }) {
  const details = [
    ["Situation", intake.freeText || "Not provided"],
    ["Age", intake.age || "Not provided"],
    ["Location", intake.location || "Not provided"],
    ["Student status", intake.studentStatus],
    ["Employment status", intake.employmentStatus],
    ["Dependents", intake.dependents],
    ["Urgency", intake.urgency],
    ["Income situation", intake.incomeSituation || "Not provided"],
    [
      "Documents",
      `ID: ${intake.hasId}, residence: ${intake.hasProofOfResidence}, student letter: ${intake.hasStudentLetter}, income proof: ${intake.hasProofOfIncome}`,
    ],
    ["Support needed", intake.supportNeeded.length ? intake.supportNeeded.join(", ") : "Not selected"],
  ];

  return (
    <div className="grid gap-5">
      <div className="rounded-3xl border border-emerald-900/10 bg-emerald-50 p-5">
        <p className="text-sm font-black text-emerald-950">Ready to generate</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
          ServiceBridge AI will retrieve possible programs, documents, next steps, sources, and human verification
          guidance.
        </p>
      </div>

      <div className="grid gap-3">
        {details.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{label}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {!narrative.trim() ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">
          Add at least one detail before generating guidance.
        </div>
      ) : null}
    </div>
  );
}
