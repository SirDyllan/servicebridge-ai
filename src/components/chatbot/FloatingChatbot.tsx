"use client";

import Image from "next/image";
import { FormEvent, useMemo, useRef, useState } from "react";
import { Bot, FileText, Loader2, MapPin, MessageCircle, Send, ShieldCheck, X } from "lucide-react";
import type { ChatMessage, ChatResponse } from "@/types/chat";

type UiMessage = ChatMessage & {
  response?: ChatResponse;
  isError?: boolean;
};

const welcomeMessage: UiMessage = {
  role: "assistant",
  content:
    "Hi, I'm ServiceBridge AI. Tell me what support you need, and I'll help you prepare possible benefit pathways, documents, next steps, and a human verification route.",
};

const defaultActions = ["Create checklist", "Show required documents", "Find nearby office", "Speak to human"];

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState("");
  const [hasBotImage, setHasBotImage] = useState(true);
  const [hasAcknowledgedSafety, setHasAcknowledgedSafety] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const lastResponse = useMemo(() => {
    return [...messages].reverse().find((message) => message.response)?.response;
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input);
  }

  async function sendMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || isLoading || !hasAcknowledgedSafety) return;

    const history: ChatMessage[] = messages.map((item) => ({ role: item.role, content: item.content }));
    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = (await response.json()) as ChatResponse & { error?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "The assistant could not respond.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.reply,
          response: data,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "I could not generate guidance. Please try again or use the guided check.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      window.setTimeout(() => {
        panelRef.current?.scrollTo({ top: panelRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    }
  }

  async function handleAction(action: string) {
    if (action === "Find nearby office") {
      setActionStatus("Opening curated office handoff...");
      window.open(buildHandoffUrl("map", lastResponse, messages), "_blank", "noopener,noreferrer");
      window.setTimeout(() => setActionStatus(""), 1800);
      return;
    }

    if (action === "Speak to human") {
      setActionStatus("Opening human handoff guide...");
      window.open(buildHandoffUrl("human", lastResponse, messages), "_blank", "noopener,noreferrer");
      window.setTimeout(() => setActionStatus(""), 1800);
      return;
    }

    if (action === "Rate this guidance") {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Use the feedback section on the results page or tell your team which part was helpful, unclear, wrong, missing, or risky. The team can use that feedback to improve source records and handoff guidance.",
        },
      ]);
      return;
    }

    await sendMessage(action);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {isOpen ? (
        <div className="mb-4 flex h-[min(680px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
          <header className="flex items-center justify-between bg-emerald-900 px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <BotAvatar hasBotImage={hasBotImage} setHasBotImage={setHasBotImage} />
              <div>
                <p className="text-sm font-black">ServiceBridge AI Assistant</p>
                <p className="text-xs font-semibold text-emerald-100">Benefits guidance, not final approval.</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close chatbot"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </header>

          <div ref={panelRef} className="flex-1 space-y-4 overflow-y-auto bg-[#f7faf8] p-4">
            {!hasAcknowledgedSafety ? <ResponsibleAiNotice onAccept={() => setHasAcknowledgedSafety(true)} /> : null}
            {messages.map((message, index) => (
              <ChatBubble
                key={`${message.role}-${index}`}
                message={message}
                messages={messages}
                onQuickReply={sendMessage}
                quickRepliesDisabled={isLoading || !hasAcknowledgedSafety}
              />
            ))}
            {isLoading ? (
              <div className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm font-semibold text-slate-600">
                <Loader2 className="size-4 animate-spin text-emerald-800" />
                Checking support pathways...
              </div>
            ) : null}
          </div>

          <div className="border-t border-emerald-950/10 bg-white p-3">
            {actionStatus ? (
              <div className="mb-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900">
                <Loader2 className="size-3 animate-spin" />
                {actionStatus}
              </div>
            ) : null}
            {hasAcknowledgedSafety ? (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {(lastResponse?.actions ?? defaultActions).map((action) => (
                <button
                  type="button"
                  key={action}
                  onClick={() => handleAction(action)}
                  className="shrink-0 rounded-full border border-emerald-900/15 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-100"
                >
                  {action}
                </button>
              ))}
            </div>
            ) : null}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={!hasAcknowledgedSafety}
                placeholder={
                  hasAcknowledgedSafety
                    ? "Ask about food, school support, ID, documents..."
                    : "Accept guidance notice to start..."
                }
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !hasAcknowledgedSafety}
                aria-label="Send message"
                className="flex size-12 items-center justify-center rounded-2xl bg-emerald-800 text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </form>
            <p className="mt-2 text-[11px] font-semibold leading-4 text-slate-500">
              Guidance only. Please verify with an official office or human advisor.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <div className="sb-pulse-ring sb-float relative">
          {!isOpen ? (
            <span className="pointer-events-none absolute -top-10 right-0 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-900 shadow-lg ring-1 ring-emerald-950/10">
              Need help?
            </span>
          ) : null}
          <button
            type="button"
            aria-label={isOpen ? "Close ServiceBridge AI chatbot" : "Open ServiceBridge AI chatbot"}
            onClick={() => setIsOpen((current) => !current)}
            className="relative flex size-14 items-center justify-center overflow-hidden rounded-full bg-emerald-800 text-white shadow-[0_16px_45px_rgba(15,23,42,0.25)] ring-4 ring-white transition hover:scale-105 hover:bg-emerald-900 sm:size-16"
          >
            {hasBotImage ? (
              <Image
                src="/images/bot.jpg"
                alt=""
                fill
                sizes="64px"
                className="object-cover"
                onError={() => setHasBotImage(false)}
              />
            ) : (
              <MessageCircle className="size-7" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResponsibleAiNotice({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck className="size-4" />
        <p className="text-sm font-black">Before we start</p>
      </div>
      <p className="text-xs font-semibold leading-5">
        ServiceBridge AI gives preparation guidance only. It does not approve benefits, replace emergency help, or make
        legal, medical, or official decisions. Please verify final requirements with an official office or human advisor.
      </p>
      <button
        type="button"
        onClick={onAccept}
        className="mt-3 rounded-xl bg-emerald-800 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-900"
      >
        I understand
      </button>
    </div>
  );
}

function BotAvatar({
  hasBotImage,
  setHasBotImage,
}: {
  hasBotImage: boolean;
  setHasBotImage: (value: boolean) => void;
}) {
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
      {hasBotImage ? (
        <Image
          src="/images/bot.jpg"
          alt=""
          fill
          sizes="44px"
          className="object-cover"
          onError={() => setHasBotImage(false)}
        />
      ) : (
        <Bot className="size-5" />
      )}
    </span>
  );
}

function ChatBubble({
  message,
  messages,
  onQuickReply,
  quickRepliesDisabled,
}: {
  message: UiMessage;
  messages: UiMessage[];
  onQuickReply: (message: string) => Promise<void>;
  quickRepliesDisabled: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-2xl p-3 text-sm leading-6 ${
          isUser
            ? "bg-emerald-800 text-white"
            : message.isError
              ? "border border-red-200 bg-red-50 text-red-800"
              : "border border-emerald-950/10 bg-white text-slate-700"
        }`}
      >
        <p className="whitespace-pre-wrap font-semibold">{message.content}</p>
        {message.response ? (
          <StructuredResponse
            response={message.response}
            messages={messages}
            onQuickReply={onQuickReply}
            quickRepliesDisabled={quickRepliesDisabled}
          />
        ) : null}
      </div>
    </div>
  );
}

function StructuredResponse({
  response,
  messages,
  onQuickReply,
  quickRepliesDisabled,
}: {
  response: ChatResponse;
  messages: UiMessage[];
  onQuickReply: (message: string) => Promise<void>;
  quickRepliesDisabled: boolean;
}) {
  const needIsNotClear = response.classification.primaryNeeds[0] === "Need not clear yet";
  const hasPathwayDetails =
    response.matches.length > 0 ||
    response.documentChecklist.needed.length > 0 ||
    response.documentChecklist.missing.length > 0 ||
    !needIsNotClear;

  if (response.intakeStatus === "needs_follow_up") return null;
  if (needIsNotClear && response.matches.length === 0) return null;
  if (!hasPathwayDetails) return null;

  return (
    <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
      {response.matches.length ? (
        response.matches.slice(0, 2).map((match) => (
          <div key={`${match.serviceName}-${match.category}`} className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-black text-slate-950">{match.serviceName}</p>
            <p className="mt-1 text-xs font-semibold text-slate-600">{match.whyThisMayFit}</p>
            <p className="mt-2 text-[11px] font-black text-emerald-800">{match.matchLevel} possible match</p>
          </div>
        ))
      ) : null}

      <div className="rounded-xl bg-emerald-50 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-black text-emerald-950">
          <FileText className="size-3" />
          Documents
        </div>
        {response.documentChecklist.needed.length ? (
          <p className="text-xs font-semibold leading-5 text-emerald-950">
            Needed: {response.documentChecklist.needed.join(", ")}
          </p>
        ) : null}
        {response.documentChecklist.missing.length ? (
          <p className="mt-1 text-xs font-semibold leading-5 text-emerald-950">
            Missing or unknown: {response.documentChecklist.missing.join(", ")}
          </p>
        ) : null}
      </div>

      <DocumentQuickChecks
        response={response}
        disabled={quickRepliesDisabled}
        onQuickReply={onQuickReply}
      />

      <div className="rounded-xl bg-amber-50 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-black text-amber-950">
          <ShieldCheck className="size-3" />
          Human referral
        </div>
        <p className="text-xs font-semibold leading-5 text-amber-950">
          {response.humanReferral.suggestedContactType}
        </p>
      </div>

      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
        <MapPin className="size-3" />
        Office handoff uses curated office types, not invented addresses.
      </div>

      {response.matches.length ? (
        <a
          href={buildGoogleMapsUrl(response, messages)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-900"
        >
          <MapPin className="size-3" />
          View on Google Maps
        </a>
      ) : null}
    </div>
  );
}

function DocumentQuickChecks({
  response,
  disabled,
  onQuickReply,
}: {
  response: ChatResponse;
  disabled: boolean;
  onQuickReply: (message: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Record<string, "have" | "missing">>({});
  const documentName = getDocumentQuickCheckItems(response)[0];

  if (!documentName) return null;

  function handleSelect(documentName: string, value: "have" | "missing") {
    const key = normalizeDocumentKey(documentName);
    setSelected((current) => ({ ...current, [key]: value }));

    void onQuickReply(
      value === "have"
        ? `For the document readiness check: I have ${documentName}.`
        : `For the document readiness check: I do not have ${documentName}.`,
    );
  }

  const key = normalizeDocumentKey(documentName);
  const current = selected[key];

  return (
    <div className="rounded-xl border border-emerald-900/10 bg-white p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-800">
        Quick document check
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
        Do you have your <span className="font-black text-slate-950">{documentName}</span>?
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <DocumentQuickOption
          label="Yes"
          checked={current === "have"}
          disabled={disabled}
          onClick={() => handleSelect(documentName, "have")}
        />
        <DocumentQuickOption
          label="No"
          checked={current === "missing"}
          disabled={disabled}
          onClick={() => handleSelect(documentName, "missing")}
        />
      </div>
    </div>
  );
}

function DocumentQuickOption({
  label,
  checked,
  disabled,
  onClick,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-w-14 items-center justify-center rounded-full px-4 py-2 text-xs font-black transition ${
        checked
          ? "bg-emerald-800 text-white"
          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-900"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      {label}
    </button>
  );
}

function getDocumentQuickCheckItems(response: ChatResponse) {
  const knownMissingKeys = new Set(response.documentChecklist.missing.map((documentName) => {
    return normalizeDocumentKey(cleanDocumentName(documentName));
  }));
  const knownMissingIdentity = response.documentChecklist.missing.some((documentName) => {
    return /\b(id|identity|national id)\b/i.test(documentName);
  });
  const likelyDocuments = [
    ...response.classification.documentIssues,
    ...response.documentChecklist.needed,
    ...response.matches.flatMap((match) => match.documentsNeeded),
  ];

  const normalized = new Map<string, string>();

  likelyDocuments.forEach((documentName) => {
    const cleaned = cleanDocumentName(documentName);
    const key = normalizeDocumentKey(cleaned);
    const isIdentityCheck = /\b(id|identity)\b/i.test(cleaned);
    if (!key || normalized.has(key) || knownMissingKeys.has(key) || !isValidDocumentCheck(cleaned)) return;
    if (knownMissingIdentity && isIdentityCheck) return;
    normalized.set(key, cleaned);
  });

  return [...normalized.values()].slice(0, 5);
}

function isValidDocumentCheck(value: string) {
  const normalized = value.toLowerCase();
  return !["current location", "household size if relevant", "contact details", "short explanation of urgent need"].includes(
    normalized,
  );
}

function cleanDocumentName(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes("birth certificate")) return "birth certificate";
  if (normalized.includes("proof of residence") || normalized.includes("residence")) return "proof of residence";
  if (normalized.includes("student") || normalized.includes("enrollment")) return "student letter or proof of enrollment";
  if (normalized.includes("income") || normalized.includes("unemployment")) return "proof of income or unemployment";
  if (normalized.includes("guardian") || normalized.includes("parent")) return "parent or guardian ID copy";
  if (normalized.includes("id") || normalized.includes("identity")) return "ID or identity proof";

  return value
    .replace(/^missing\s+/i, "")
    .replace(/^unknown\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDocumentKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildHandoffUrl(mode: "map" | "human", response: ChatResponse | undefined, messages: UiMessage[]) {
  const params = new URLSearchParams();
  params.set("mode", mode);
  params.set("need", response?.classification.primaryNeeds[0] ?? "Human Referral");

  const location = extractLocationFromMessages(messages);
  if (location) params.set("location", location);

  return `/handoff?${params.toString()}`;
}

function buildGoogleMapsUrl(response: ChatResponse, messages: UiMessage[]) {
  const location = extractLocationFromMessages(messages);
  const match = response.matches[0];
  const queryParts = [
    match?.category || response.classification.primaryNeeds[0] || "support office",
    "office",
    location || "near me",
  ];
  const query = queryParts.filter(Boolean).join(" ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function extractLocationFromMessages(messages: UiMessage[]) {
  const text = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ")
    .toLowerCase();

  const knownLocations = [
    { terms: ["mutare"], label: "Mutare, Zimbabwe" },
    { terms: ["harare"], label: "Harare, Zimbabwe" },
    { terms: ["bulawayo"], label: "Bulawayo, Zimbabwe" },
    { terms: ["gweru"], label: "Gweru, Zimbabwe" },
    { terms: ["masvingo"], label: "Masvingo, Zimbabwe" },
    { terms: ["johannesburg"], label: "Johannesburg, South Africa" },
    { terms: ["pretoria"], label: "Pretoria, South Africa" },
    { terms: ["cape town"], label: "Cape Town, South Africa" },
    { terms: ["durban"], label: "Durban, South Africa" },
  ];

  const known = knownLocations.find((location) => location.terms.some((term) => text.includes(term)));
  if (known) return known.label;
  if (text.includes("zimbabwe")) return "Zimbabwe";

  const match = text.match(/\b(?:in|near|around)\s+([a-z][a-z\s-]{2,40})(?:[,.]|$)/i);
  if (!match?.[1]) return "";

  return match[1]
    .replace(/\bcity\b/gi, "")
    .replace(/\barea\b/gi, "")
    .trim()
    .replace(/\s+/g, " ");
}
