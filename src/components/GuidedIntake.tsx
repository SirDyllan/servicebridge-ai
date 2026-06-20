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
  location: "Mutare City, Zimbabwe",
  supportNeeded: ["Food support", "Education support", "ID/documents"],
  urgency: "this_week",
  hasId: "no",
  hasProofOfResidence: "unknown",
  hasStudentLetter: "unknown",
  hasProofOfIncome: "no",
  freeText:
    "I am 18, I am a student, I lost my part-time job, and I need help with food and school expenses. I do not have an ID yet.",
};

const supportOptions = [
  "Food support",
  "Education support",
  "ID/documents",
  "Healthcare",
  "Emergency relief",
  "Employment support",
];

const steps = [
  {
    eyebrow: "Step 1",
    title: "Tell us your situation",
    description: "Use your own words or choose the support areas that sound closest.",
  },
  {
    eyebrow: "Step 2",
    title: "Basic details",
    description: "Add only what you know. You can skip anything uncertain.",
  },
  {
    eyebrow: "Step 3",
    title: "Documents",
    description: "This helps prepare a checklist before you speak with an office or adviser.",
  },
  {
    eyebrow: "Step 4",
    title: "Review",
    description: "Check the summary, then generate possible pathways and safe next steps.",
  },
];

export function GuidedIntake() {
  const router = useRouter();
  const [intake, setIntake] = useState<IntakeFormData>(emptyIntake);
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const narrative = useMemo(() => {
    return [
      intake.freeText,
      intake.supportNeeded.length ? `Support needed: ${intake.supportNeeded.join(", ")}` : "",
      intake.age ? `Age: ${intake.age}` : "",
      intake.studentStatus !== "unknown" ? `Student status: ${intake.studentStatus}` : "",
      intake.employmentStatus !== "unknown" ? `Employment: ${intake.employmentStatus}` : "",
      intake.incomeSituation ? `Income situation: ${intake.incomeSituation}` : "",
      intake.location ? `Location: ${intake.location}` : "",
      intake.dependents !== "unknown" ? `Dependents: ${intake.dependents}` : "",
      intake.urgency !== "unknown" ? `Urgency: ${intake.urgency}` : "",
      intake.hasId !== "unknown" ? `Has ID: ${intake.hasId}` : "",
      intake.hasProofOfResidence !== "unknown" ? `Has proof of residence: ${intake.hasProofOfResidence}` : "",
      intake.hasStudentLetter !== "unknown" ? `Has student letter: ${intake.hasStudentLetter}` : "",
      intake.hasProofOfIncome !== "unknown" ? `Has proof of income/unemployment: ${intake.hasProofOfIncome}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [intake]);

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const hasEnoughToGenerate = Boolean(narrative.trim()) && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isLastStep) {
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
      return;
    }

    if (!hasEnoughToGenerate) return;

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
    setStepIndex(0);
    setError("");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-5xl gap-5">
      <section className="rounded-[1.5rem] border border-emerald-950/10 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-800">{currentStep.eyebrow}</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {currentStep.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{currentStep.description}</p>
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

        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {steps.map((step, index) => {
            const complete = index < stepIndex;
            const active = index === stepIndex;

            return (
              <button
                key={step.eyebrow}
                type="button"
                onClick={() => setStepIndex(index)}
                className={`flex min-h-12 items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs font-black transition ${
                  active
                    ? "border-emerald-800 bg-emerald-800 text-white shadow-lg shadow-emerald-950/10"
                    : complete
                      ? "border-emerald-900/10 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:border-emerald-800/20"
                }`}
              >
                {complete ? <CheckCircle2 className="size-4 shrink-0" /> : <span className="size-2 rounded-full bg-current" />}
                <span>{step.title}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-emerald-950/10 bg-white p-5 shadow-[0_14px_44px_rgba(15,23,42,0.05)] sm:p-6">
        {stepIndex === 0 ? <SituationStep intake={intake} updateField={updateField} toggleSupport={toggleSupport} /> : null}
        {stepIndex === 1 ? <BasicDetailsStep intake={intake} updateField={updateField} /> : null}
        {stepIndex === 2 ? <DocumentsStep intake={intake} updateField={updateField} /> : null}
        {stepIndex === 3 ? <ReviewStep intake={intake} narrative={narrative} /> : null}
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-3 rounded-[1.5rem] border border-emerald-950/10 bg-[#eaf7ef] p-4 sm:flex-row sm:items-center">
        <p className="text-sm font-semibold leading-6 text-emerald-950">
          {isLastStep
            ? "Generate possible pathways, documents, next steps, and human verification guidance."
            : "Only the first box is required. Skip anything you are not sure about."}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={stepIndex === 0 || isSubmitting}
            onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-900/15 bg-white px-5 py-3 text-sm font-black text-emerald-900 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={isLastStep ? !hasEnoughToGenerate : isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            {isLastStep ? "Generate guidance" : stepIndex === 0 ? "Continue" : "Continue or skip"}
          </button>
        </div>
      </div>
    </form>
  );
}

function SituationStep({
  intake,
  updateField,
  toggleSupport,
}: {
  intake: IntakeFormData;
  updateField: <Key extends keyof IntakeFormData>(key: Key, value: IntakeFormData[Key]) => void;
  toggleSupport: (option: string) => void;
}) {
  return (
    <div className="grid gap-5">
      <label className="block">
        <span className="text-sm font-black text-slate-900">Tell us what you need help with</span>
        <textarea
          value={intake.freeText}
          onChange={(event) => updateField("freeText", event.target.value)}
          placeholder="Example: I am a student and I need help with food, school expenses, and ID documents."
          className="mt-3 min-h-40 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
        />
      </label>

      <div>
        <p className="text-sm font-black text-slate-900">Quick support areas</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </div>
  );
}

function BasicDetailsStep({
  intake,
  updateField,
}: {
  intake: IntakeFormData;
  updateField: <Key extends keyof IntakeFormData>(key: Key, value: IntakeFormData[Key]) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="Age" value={intake.age} onChange={(value) => updateField("age", value)} placeholder="Example: 18" />
      <TextField
        label="Location"
        value={intake.location}
        onChange={(value) => updateField("location", value)}
        placeholder="City, campus, or country"
      />
      <SelectField
        label="Student status"
        value={intake.studentStatus}
        onChange={(value) => updateField("studentStatus", value as IntakeFormData["studentStatus"])}
        options={[
          ["unknown", "Not sure"],
          ["student", "Student"],
          ["not_student", "Not a student"],
        ]}
      />
      <SelectField
        label="Employment or income status"
        value={intake.employmentStatus}
        onChange={(value) => updateField("employmentStatus", value as IntakeFormData["employmentStatus"])}
        options={[
          ["unknown", "Not sure"],
          ["lost_job", "Lost job"],
          ["part_time", "Part-time"],
          ["unemployed", "Unemployed"],
          ["employed", "Employed"],
        ]}
      />
      <SelectField
        label="Urgency"
        value={intake.urgency}
        onChange={(value) => updateField("urgency", value as IntakeFormData["urgency"])}
        options={[
          ["unknown", "Not sure"],
          ["today", "Today"],
          ["this_week", "This week"],
          ["normal", "Normal application"],
        ]}
      />
      <SelectField
        label="Dependents"
        value={intake.dependents}
        onChange={(value) => updateField("dependents", value as IntakeFormData["dependents"])}
        options={[
          ["unknown", "Not sure"],
          ["no", "No"],
          ["yes", "Yes"],
        ]}
      />
      <label className="block sm:col-span-2">
        <span className="text-sm font-black text-slate-900">Income situation</span>
        <input
          value={intake.incomeSituation}
          onChange={(event) => updateField("incomeSituation", event.target.value)}
          placeholder="Example: lost part-time job, no income this month"
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
        />
      </label>
    </div>
  );
}

function DocumentsStep({
  intake,
  updateField,
}: {
  intake: IntakeFormData;
  updateField: <Key extends keyof IntakeFormData>(key: Key, value: IntakeFormData[Key]) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label="Do you have an ID?"
        value={intake.hasId}
        onChange={(value) => updateField("hasId", value as IntakeFormData["hasId"])}
        options={[
          ["unknown", "Not sure"],
          ["yes", "Yes"],
          ["no", "No"],
        ]}
      />
      <SelectField
        label="Proof of residence"
        value={intake.hasProofOfResidence}
        onChange={(value) => updateField("hasProofOfResidence", value as IntakeFormData["hasProofOfResidence"])}
        options={[
          ["unknown", "Not sure"],
          ["yes", "Yes"],
          ["no", "No"],
        ]}
      />
      <SelectField
        label="Student letter or proof of enrollment"
        value={intake.hasStudentLetter}
        onChange={(value) => updateField("hasStudentLetter", value as IntakeFormData["hasStudentLetter"])}
        options={[
          ["unknown", "Not sure"],
          ["yes", "Yes"],
          ["no", "No"],
        ]}
      />
      <SelectField
        label="Proof of income or unemployment"
        value={intake.hasProofOfIncome}
        onChange={(value) => updateField("hasProofOfIncome", value as IntakeFormData["hasProofOfIncome"])}
        options={[
          ["unknown", "Not sure"],
          ["yes", "Yes"],
          ["no", "No"],
        ]}
      />
      <div className="rounded-3xl bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-950 sm:col-span-2">
        Not having a document does not mean the app rejects you. It means the checklist should include what to ask a
        student affairs office, social worker, official office, or verified adviser before applying.
      </div>
    </div>
  );
}

function ReviewStep({ intake, narrative }: { intake: IntakeFormData; narrative: string }) {
  const details = [
    ["Situation", intake.freeText || "Not provided"],
    ["Support needed", intake.supportNeeded.length ? intake.supportNeeded.join(", ") : "Not selected"],
    ["Location", intake.location || "Not provided"],
    ["Basic details", [intake.age ? `${intake.age} years old` : "", intake.studentStatus, intake.employmentStatus, intake.urgency].filter(Boolean).join(", ")],
    [
      "Documents",
      `ID: ${intake.hasId}, residence: ${intake.hasProofOfResidence}, student letter: ${intake.hasStudentLetter}, income proof: ${intake.hasProofOfIncome}`,
    ],
  ];

  return (
    <div className="grid gap-5">
      <div className="rounded-3xl border border-emerald-900/10 bg-emerald-50 p-5">
        <p className="text-sm font-black text-emerald-950">Ready to generate</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
          ServiceBridge AI will show possible support pathways, why they may fit, document readiness, next steps, and a
          human verification note. This is guidance only, not approval.
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
          Add a short situation or choose at least one support area before generating guidance.
        </div>
      ) : null}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-900">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-900">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
      >
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}
