import OpenAI from "openai";
import type { ChatMessage, ChatResponse } from "@/types/chat";
import type { ChatRetrievalResult } from "@/lib/serviceRetrieval";
import type { SafetyAssessment } from "@/lib/safety";
import { chatActions, chatDisclaimer } from "@/lib/groundedFallback";

export async function generateOpenAiChatResponse({
  message,
  history,
  retrieval,
  fallback,
  safety,
}: {
  message: string;
  history: ChatMessage[];
  retrieval: ChatRetrievalResult;
  fallback: ChatResponse;
  safety: SafetyAssessment;
}): Promise<ChatResponse | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const completion = await withTimeout(
    client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: buildPrompt(message, history, retrieval, safety),
        },
      ],
    }),
    18000,
  );

  const text = completion.choices[0]?.message.content;
  if (!text) return null;

  return normalizeChatResponse(parseJsonObject(text), fallback, "openai");
}

const systemPrompt =
  "You are ServiceBridge AI, a public benefits navigation assistant. Your job is to help users understand possible public/social support pathways, document readiness, safe next steps, and when to verify with a human or official office. Speak naturally: warm, concise, specific, and calm. Understand spelling mistakes from context, such as 'foad' meaning food, 'lisence' meaning license, and 'Texa city' meaning Texas City. Use only the retrieved service records and user-provided facts. Do not invent programs, phone numbers, addresses, deadlines, official requirements, or eligibility results. Never say the user qualifies, is approved, or will receive support. Use phrases like 'may qualify', 'possible match', 'may be relevant', and 'please verify with the official office'. If the user is replacing a lost or misplaced ID, stay focused on ID replacement, identity proof, proof of residence, local DMV/ID office search, and human verification. Do not ask about income, benefits, food, school, or employment unless the user asks for those. If the user already gave location, theft status, identity proof, or proof of residence, do not ask again. If the message is vague, ask exactly one follow-up question and put the same question in nextQuestion. The reply should be short: acknowledge what matters, then ask the one next question or give practical next steps. Do not repeat the user's full message back. For driver's license, license, ID, or document requests, treat the need as document readiness and ask for location before listing requirements. If the user asks where to go, map, location link, or nearby office, provide a Google Maps search URL using the user's location and the office type, for example https://www.google.com/maps/search/?api=1&query=Texas%20City%20ID%20office%20DMV. Make clear it is a search link, not a verified appointment. For urgent or sensitive wording, give calm safety guidance and human handoff while still organizing practical next steps. Show uncertainty clearly. Do not give legal, medical, or final public-service decisions. Do not use markdown formatting, asterisks, bold markers, or long essays. Return structured JSON matching the requested schema.";

function buildPrompt(
  message: string,
  history: ChatMessage[],
  retrieval: ChatRetrievalResult,
  safety: SafetyAssessment,
) {
  return `
User message:
${message}

Recent conversation:
${JSON.stringify(history.slice(-6), null, 2)}

Safety assessment:
${JSON.stringify(safety, null, 2)}

Classification and service-record retrieval:
${JSON.stringify(retrieval, null, 2)}

Return valid JSON only:
{
  "mode": "openai",
  "reply": "plain language response",
  "intakeStatus": "needs_follow_up | ready_for_guidance",
  "nextQuestion": "The single next question the assistant should ask now, or an empty string when guidance is ready",
  "followUpQuestions": ["Keep any additional internal follow-up questions here, but the user interface will only show nextQuestion"],
  "classification": {
    "primaryNeeds": [],
    "secondaryNeeds": [],
    "urgency": "low | medium | high | emergency",
    "documentIssues": []
  },
  "matches": [
    {
      "serviceName": "",
      "category": "",
      "matchLevel": "High | Medium | Low",
      "whyThisMayFit": "",
      "documentsNeeded": [],
      "nextSteps": [],
      "sourceLabel": "",
      "verificationStatus": "sample | needs_review | verified"
    }
  ],
  "documentChecklist": {
    "needed": [],
    "missing": [],
    "notes": []
  },
  "humanReferral": {
    "needed": true,
    "reason": "",
    "suggestedContactType": ""
  },
  "actions": ${JSON.stringify(chatActions)},
  "disclaimer": "${chatDisclaimer}"
}
`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("OpenAI request timed out. Grounded fallback was used.")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("OpenAI returned a response that was not valid JSON.");
    return JSON.parse(match[0]);
  }
}

export function normalizeChatResponse(
  raw: Partial<ChatResponse>,
  fallback: ChatResponse,
  mode: ChatResponse["mode"],
): ChatResponse {
  const rawNextQuestion = cleanText(asText(raw.nextQuestion, ""));
  const intakeStatus = raw.intakeStatus ?? fallback.intakeStatus;
  const nextQuestion =
    intakeStatus === "needs_follow_up" ? rawNextQuestion || cleanText(fallback.nextQuestion) : "";
  const replySource = raw.reply ?? fallback.reply;
  const reply = ensureNextQuestionInReply(
    cleanText(asText(replySource, fallback.reply)),
    nextQuestion,
    intakeStatus,
  );
  const rawMatches = normalizeRawMatches(raw.matches, fallback);

  return {
    mode,
    reply,
    intakeStatus,
    nextQuestion,
    followUpQuestions: asStringArray(raw.followUpQuestions, fallback.followUpQuestions),
    classification: {
      primaryNeeds: asNonEmptyStringArray(raw.classification?.primaryNeeds, fallback.classification.primaryNeeds),
      secondaryNeeds: asNonEmptyStringArray(raw.classification?.secondaryNeeds, fallback.classification.secondaryNeeds),
      urgency: raw.classification?.urgency ?? fallback.classification.urgency,
      documentIssues: asStringArray(raw.classification?.documentIssues, fallback.classification.documentIssues),
    },
    matches: rawMatches.length ? rawMatches.map((match, index) => ({
      serviceName: asText(match.serviceName, fallback.matches[index]?.serviceName ?? "Possible support pathway"),
      category: asText(match.category, fallback.matches[index]?.category ?? "Benefits Support"),
      matchLevel: match.matchLevel ?? fallback.matches[index]?.matchLevel ?? "Medium",
      whyThisMayFit: cleanText(asText(match.whyThisMayFit, fallback.matches[index]?.whyThisMayFit ?? "This may fit based on the information shared.")),
      documentsNeeded: asStringArray(match.documentsNeeded, fallback.matches[index]?.documentsNeeded ?? []),
      nextSteps: asStringArray(match.nextSteps, fallback.matches[index]?.nextSteps ?? []),
      sourceLabel: asText(match.sourceLabel, fallback.matches[index]?.sourceLabel ?? "Sample record for hackathon demo - needs official verification."),
      verificationStatus: match.verificationStatus ?? fallback.matches[index]?.verificationStatus ?? "sample",
    })) : fallback.matches,
    documentChecklist: {
      needed: asNonEmptyStringArray(raw.documentChecklist?.needed, fallback.documentChecklist.needed),
      missing: asNonEmptyStringArray(raw.documentChecklist?.missing, fallback.documentChecklist.missing),
      notes: asNonEmptyStringArray(raw.documentChecklist?.notes, fallback.documentChecklist.notes),
    },
    humanReferral: {
      needed: raw.humanReferral?.needed ?? true,
      reason: asText(raw.humanReferral?.reason, fallback.humanReferral.reason),
      suggestedContactType: asText(raw.humanReferral?.suggestedContactType, fallback.humanReferral.suggestedContactType),
    },
    actions: fallback.actions,
    disclaimer: chatDisclaimer,
  };
}

function asText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : fallback;
}

function asNonEmptyStringArray(value: unknown, fallback: string[]) {
  const strings = asStringArray(value, fallback);
  return strings.length ? strings : fallback;
}

function normalizeRawMatches(rawMatches: unknown, fallback: ChatResponse) {
  if (!Array.isArray(rawMatches)) return [];

  const allowedNames = new Set(fallback.matches.map((match) => match.serviceName));
  if (!allowedNames.size) return [];

  return rawMatches
    .filter((match): match is NonNullable<Partial<ChatResponse["matches"][number]>> => {
      return Boolean(match && typeof match === "object" && allowedNames.has(asText(match.serviceName, "")));
    })
    .slice(0, fallback.matches.length);
}

function cleanText(value: string) {
  return sanitizeResponsibleLanguage(value)
    .replace(/\*\*/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .trim();
}

function sanitizeResponsibleLanguage(value: string) {
  return value
    .replace(/\byou qualify\b/gi, "you may be a possible match")
    .replace(/\byou are qualified\b/gi, "you may be a possible match")
    .replace(/\byou'?re qualified\b/gi, "you may be a possible match")
    .replace(/\byou are eligible\b/gi, "you may be eligible")
    .replace(/\byou'?re eligible\b/gi, "you may be eligible")
    .replace(/\byou are approved\b/gi, "you are not approved by this app")
    .replace(/\byou'?re approved\b/gi, "you are not approved by this app")
    .replace(/\bthis office will help you\b/gi, "this office may be relevant to ask")
    .replace(/\brequirements are guaranteed\b/gi, "requirements must be verified")
    .replace(/\bguaranteed\b/gi, "not guaranteed");
}

function ensureNextQuestionInReply(reply: string, nextQuestion: string, intakeStatus: ChatResponse["intakeStatus"]) {
  if (intakeStatus !== "needs_follow_up" || !nextQuestion) return reply;

  const normalizedReply = reply.toLowerCase();
  const normalizedQuestion = nextQuestion.toLowerCase();
  if (normalizedReply.includes(normalizedQuestion)) return reply;

  return `${removeTrailingQuestions(reply)} ${nextQuestion}`.trim();
}

function removeTrailingQuestions(value: string) {
  return value
    .split(/(?<=[.!])\s+/)
    .filter((sentence) => !sentence.trim().endsWith("?"))
    .join(" ")
    .trim();
}
