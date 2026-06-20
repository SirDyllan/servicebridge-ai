"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, FileText, Loader2, MapPin, MessageCircle, Mic, Send, ShieldCheck, Volume2, VolumeX, X } from "lucide-react";
import { buildIdentityOfficeSearchQuery } from "@/lib/officeRouting";
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

type SpeechRecognitionEventLike = {
  results: {
    length: number;
    [index: number]: {
      isFinal?: boolean;
      length: number;
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState("");
  const [hasBotImage, setHasBotImage] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const lastResponse = useMemo(() => {
    return [...messages].reverse().find((message) => message.response)?.response;
  }, [messages]);

  useEffect(() => {
    function openFromHash() {
      if (window.location.hash === "#chatbot") {
        setIsOpen(true);
      }
    }

    openFromHash();
    window.addEventListener("hashchange", openFromHash);

    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input);
  }

  async function sendMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || isLoading) return;

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
      setActionStatus("Opening office guidance...");
      window.open(buildHandoffUrl("map", lastResponse, messages), "_blank", "noopener,noreferrer");
      window.setTimeout(() => setActionStatus(""), 1800);
      return;
    }

    if (action === "Speak to human") {
      setActionStatus("Opening human verification guide...");
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

  function getSpeechRecognition() {
    const speechWindow = window as SpeechRecognitionWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    return Recognition ? new Recognition() : null;
  }

  function startVoiceInput() {
    if (isLoading) return;

    const recognition = getSpeechRecognition();
    if (!recognition) {
      setVoiceStatus("Voice input is not supported in this browser.");
      return;
    }

    recognitionRef.current?.abort();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    setVoiceStatus("Listening...");
    setIsListening(true);

    recognition.onresult = (event) => {
      let transcript = "";
      let finalTranscript = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const phrase = result[0]?.transcript ?? "";
        transcript += phrase;
        if (result.isFinal) finalTranscript += phrase;
      }

      const captured = (finalTranscript || transcript).trim();
      if (captured) setInput(captured);
    };

    recognition.onerror = () => {
      setVoiceStatus("Voice input stopped. You can type instead.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceStatus((current) => (current === "Listening..." ? "Voice captured. Review before sending." : current));
    };

    try {
      recognition.start();
    } catch {
      setVoiceStatus("Voice input could not start. You can type instead.");
      setIsListening(false);
    }
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceStatus("Voice captured. Review before sending.");
  }

  function speakText(text: string) {
    const content = text.trim();
    if (!content) return;

    if (!window.speechSynthesis) {
      setVoiceStatus("Read aloud is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setVoiceStatus("Read aloud stopped.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => {
      setIsSpeaking(false);
      setVoiceStatus("");
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setVoiceStatus("Read aloud stopped.");
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setVoiceStatus("Reading aloud...");
  }

  return (
    <div id="chatbot" className="fixed bottom-5 right-5 z-40 scroll-mt-28">
      {isOpen ? (
        <div className="mb-4 flex h-[min(680px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
          <header className="flex items-center justify-between bg-emerald-900 px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <BotAvatar hasBotImage={hasBotImage} setHasBotImage={setHasBotImage} />
              <div>
                <p className="text-sm font-black">ServiceBridge AI Assistant</p>
                <p className="text-xs font-semibold text-emerald-100">Benefits and document guidance.</p>
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
            {messages.map((message, index) => (
              <ChatBubble
                key={`${message.role}-${index}`}
                message={message}
                messages={messages}
                isSpeaking={isSpeaking}
                onReadAloud={speakText}
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
            {voiceStatus ? (
              <p className="mb-3 rounded-xl bg-[#f7faf8] px-3 py-2 text-xs font-bold text-slate-600">{voiceStatus}</p>
            ) : null}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about food, school support, ID, documents..."
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10"
              />
              <button
                type="button"
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                disabled={isLoading}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
                className={`flex size-12 shrink-0 items-center justify-center rounded-2xl transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isListening
                    ? "bg-amber-100 text-amber-950"
                    : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                }`}
              >
                <Mic className="size-4" />
              </button>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="flex size-12 items-center justify-center rounded-2xl bg-emerald-800 text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </form>
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
  isSpeaking,
  onReadAloud,
}: {
  message: UiMessage;
  messages: UiMessage[];
  isSpeaking: boolean;
  onReadAloud: (text: string) => void;
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
        <MessageText text={message.content} />
        {!isUser ? (
          <button
            type="button"
            onClick={() => onReadAloud(message.content)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-900"
          >
            {isSpeaking ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
            {isSpeaking ? "Stop" : "Read aloud"}
          </button>
        ) : null}
        {message.response ? (
          <StructuredResponse
            response={message.response}
            messages={messages}
          />
        ) : null}
      </div>
    </div>
  );
}

function MessageText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);

  return (
    <p className="whitespace-pre-wrap font-semibold">
      {parts.map((part, index) => {
        if (!/^https?:\/\//i.test(part)) return <span key={`${part}-${index}`}>{part}</span>;

        return (
          <a
            key={`${part}-${index}`}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="font-black underline decoration-emerald-700 decoration-2 underline-offset-2"
          >
            Open link
          </a>
        );
      })}
    </p>
  );
}

function StructuredResponse({
  response,
  messages,
}: {
  response: ChatResponse;
  messages: UiMessage[];
}) {
  const needIsNotClear = response.classification.primaryNeeds[0] === "Need not clear yet";
  const hasPathwayDetails =
    response.matches.length > 0 ||
    response.documentChecklist.needed.length > 0 ||
    response.documentChecklist.missing.length > 0 ||
    !needIsNotClear;

  if (needIsNotClear && response.matches.length === 0) return null;
  if (!hasPathwayDetails) return null;

  return (
    <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
      {response.matches.length ? (
        response.matches.slice(0, 2).map((match) => (
          <div key={`${match.serviceName}-${match.category}`} className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-black text-slate-950">{match.serviceName}</p>
            <p className="mt-1 text-xs font-semibold text-slate-600">{match.whyThisMayFit}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <p className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-800">
                {match.matchLevel} possible match
              </p>
              <p className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-900">
                Verify first
              </p>
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{match.sourceLabel}</p>
          </div>
        ))
      ) : null}

      {response.documentChecklist.needed.length || response.documentChecklist.missing.length || response.documentChecklist.notes[0] ? (
      <div className="rounded-xl bg-emerald-50 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-black text-emerald-950">
          <FileText className="size-3" />
          What to prepare
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
        {response.documentChecklist.notes[0] ? (
          <p className="mt-2 text-[11px] font-semibold leading-5 text-emerald-900">
            {response.documentChecklist.notes[0]}
          </p>
        ) : null}
      </div>
      ) : null}

      <div className="rounded-xl bg-amber-50 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-black text-amber-950">
          <ShieldCheck className="size-3" />
          Verify with a human
        </div>
        <p className="text-xs font-semibold leading-5 text-amber-950">
          {response.humanReferral.suggestedContactType}
        </p>
      </div>

      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
        <MapPin className="size-3" />
        Uses office types and safe map searches, not invented addresses.
      </div>

      {response.matches.length ? (
        <a
          href={buildGoogleMapsUrl(response, messages)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-900"
        >
          <MapPin className="size-3" />
          Find nearby office
        </a>
      ) : null}
    </div>
  );
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
  const context = buildOfficeSearchContext(response, messages);

  if (isIdentityOfficeResponse(response)) {
    const query = buildIdentityOfficeSearchQuery(location || "near me", context);

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  const queryParts = [
    match?.category || response.classification.primaryNeeds[0] || "support office",
    "office",
    location || "near me",
  ];
  const query = queryParts.filter(Boolean).join(" ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function isIdentityOfficeResponse(response: ChatResponse) {
  const text = [
    ...response.classification.primaryNeeds,
    ...response.classification.documentIssues,
    ...response.matches.map((match) => `${match.serviceName} ${match.category} ${match.sourceLabel}`),
  ]
    .join(" ")
    .toLowerCase();

  return /\b(id|identity|document|driver|license|licence|dmv|civil registry|national registry)\b/.test(text);
}

function buildOfficeSearchContext(response: ChatResponse, messages: UiMessage[]) {
  const userText = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ");
  const matchText = response.matches
    .map((match) => `${match.serviceName} ${match.category} ${match.sourceLabel} ${match.documentsNeeded.join(" ")}`)
    .join(" ");

  return `${userText} ${matchText}`;
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
    { terms: ["texas city"], label: "Texas City, USA" },
    { terms: ["houston"], label: "Houston, USA" },
    { terms: ["dallas"], label: "Dallas, USA" },
    { terms: ["austin"], label: "Austin, USA" },
    { terms: ["johannesburg"], label: "Johannesburg, South Africa" },
    { terms: ["pretoria"], label: "Pretoria, South Africa" },
    { terms: ["cape town"], label: "Cape Town, South Africa" },
    { terms: ["durban"], label: "Durban, South Africa" },
  ];

  const known = knownLocations.find((location) => location.terms.some((term) => text.includes(term)));
  if (known) return known.label;
  if (text.includes("zimbabwe")) return "Zimbabwe";
  if (/\b(usa|u\.s\.a|united states|america)\b/.test(text)) return "USA";

  const match = text.match(/\b(?:in|near|around)\s+([a-z][a-z\s-]{2,40})(?:[,.]|$)/i);
  if (!match?.[1]) return "";

  return match[1]
    .replace(/\bcity\b/gi, "")
    .replace(/\barea\b/gi, "")
    .trim()
    .replace(/\s+/g, " ");
}
