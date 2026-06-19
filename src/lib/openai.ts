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
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are ServiceBridge AI, a public benefits navigation assistant. You help users understand possible public/social support pathways, document readiness, safe next steps, and when to verify with a human or official office. Speak naturally like a calm human adviser. Understand small spelling mistakes from context, such as 'foad' meaning food. Do not repeat or echo the user's full message back to them. Use only the provided service records and user-provided information. Do not invent programs, phone numbers, addresses, deadlines, official requirements, or eligibility results. Never say the user qualifies or is approved. Use 'may qualify', 'possible match', or 'please verify with the official office'. If the user message is a greeting, warmly explain what you can help with and ask one useful question. If important details are missing, ask exactly one follow-up question at a time and put that same question in nextQuestion. Do not list every follow-up question in the reply. For document-readiness cases such as a lost ID, stay focused on ID replacement readiness, documents, official identity/civil registry offices, and human verification. If the user says the ID is needed for jobs or work, you may mention employment-office handoff only if it is provided in the retrieved records; do not introduce food, education, healthcare, or income-support pathways unless the user explicitly asks for them. Show uncertainty clearly. Give short, practical next steps. Refer the user to a human, social worker, student affairs office, government office, or verified support organization for final verification. Do not give legal, medical, or final public-service decisions. Do not use markdown formatting, bullets with asterisks, or bold markers. Return structured JSON matching the required schema.",
      },
      {
        role: "user",
        content: buildPrompt(message, history, retrieval, safety),
      },
    ],
  });

  const text = completion.choices[0]?.message.content;
  if (!text) return null;

  return normalizeChatResponse(JSON.parse(text), fallback, "openai");
}

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

export function normalizeChatResponse(
  raw: Partial<ChatResponse>,
  fallback: ChatResponse,
  mode: ChatResponse["mode"],
): ChatResponse {
  const fallbackHasNextQuestion = fallback.intakeStatus === "needs_follow_up" && Boolean(fallback.nextQuestion);
  const intakeStatus = fallbackHasNextQuestion ? (raw.intakeStatus ?? fallback.intakeStatus) : fallback.intakeStatus;
  const nextQuestion = fallbackHasNextQuestion
    ? cleanText(asText(raw.nextQuestion, raw.followUpQuestions?.[0] ?? fallback.nextQuestion ?? fallback.followUpQuestions[0] ?? ""))
    : "";
  const replySource =
    !fallbackHasNextQuestion && (raw.intakeStatus === "needs_follow_up" || looksLikeFollowUpQuestion(raw.reply))
      ? fallback.reply
      : raw.reply;
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
      needed: asStringArray(raw.documentChecklist?.needed, fallback.documentChecklist.needed),
      missing: asStringArray(raw.documentChecklist?.missing, fallback.documentChecklist.missing),
      notes: asStringArray(raw.documentChecklist?.notes, fallback.documentChecklist.notes),
    },
    humanReferral: {
      needed: raw.humanReferral?.needed ?? true,
      reason: asText(raw.humanReferral?.reason, fallback.humanReferral.reason),
      suggestedContactType: asText(raw.humanReferral?.suggestedContactType, fallback.humanReferral.suggestedContactType),
    },
    actions: chatActions,
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
  return value
    .replace(/\*\*/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .trim();
}

function ensureNextQuestionInReply(reply: string, nextQuestion: string, intakeStatus: ChatResponse["intakeStatus"]) {
  if (intakeStatus !== "needs_follow_up" || !nextQuestion) return reply;

  const normalizedReply = reply.toLowerCase();
  const normalizedQuestion = nextQuestion.toLowerCase();
  if (normalizedReply.includes(normalizedQuestion)) return reply;
  if (reply.includes("?")) return reply;

  return `${reply} ${nextQuestion}`;
}

function looksLikeFollowUpQuestion(value: unknown) {
  return typeof value === "string" && /\?\s*$/.test(value.trim());
}
