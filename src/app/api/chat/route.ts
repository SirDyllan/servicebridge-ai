import { NextResponse } from "next/server";
import { getServiceRecords } from "@/lib/firebase-rest";
import { buildGroundedFallbackResponse } from "@/lib/groundedFallback";
import { generateOpenAiChatResponse } from "@/lib/openai";
import { assessSafety } from "@/lib/safety";
import { retrieveChatServices } from "@/lib/serviceRetrieval";
import type { ChatMessage, ChatRequest, ChatResponse } from "@/types/chat";

export async function POST(request: Request) {
  let body: ChatRequest;

  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const history = sanitizeHistory(body.history);
  const directory = await getServiceRecords();
  const contextText = buildContextText(message, history);
  const safety = assessSafety(contextText);
  const retrieval = retrieveChatServices(contextText, directory.records, safety);
  const fallback = buildGroundedFallbackResponse(contextText, retrieval, safety);
  const actionIntent = getActionIntent(message, contextText);

  if (actionIntent) {
    return NextResponse.json({
      ...buildActionResponse(actionIntent, fallback, contextText),
      directorySource: directory.source,
    });
  }

  if (!process.env.OPENAI_API_KEY || safety.category === "self-harm" || safety.category === "medical") {
    return NextResponse.json({
      ...fallback,
      mode: "fallback",
      directorySource: directory.source,
    });
  }

  try {
    const openAiResponse = await generateOpenAiChatResponse({
      message,
      history,
      retrieval,
      fallback,
      safety,
    });

    return NextResponse.json({
      ...(openAiResponse ?? fallback),
      directorySource: directory.source,
    });
  } catch (error) {
    return NextResponse.json({
      ...fallback,
      directorySource: directory.source,
      warning: error instanceof Error ? error.message : "OpenAI response failed; grounded fallback was used.",
    });
  }
}

function sanitizeHistory(history: ChatRequest["history"]): ChatMessage[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter((item): item is ChatMessage => {
      return (
        item &&
        typeof item === "object" &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
      );
    })
    .slice(-8);
}

function buildContextText(message: string, history: ChatMessage[]) {
  const userMessages = history
    .filter((item) => item.role === "user")
    .map((item) => item.content);
  const inferredFacts = inferFactsFromRecentAnswer(message, history);

  return [...userMessages, ...inferredFacts, message].join("\n");
}

function inferFactsFromRecentAnswer(message: string, history: ChatMessage[]) {
  const conversation = [...history, { role: "user" as const, content: message }];
  const facts: string[] = [];

  for (let index = 1; index < conversation.length; index += 1) {
    const previous = conversation[index - 1];
    const current = conversation[index];
    if (previous.role !== "assistant" || current.role !== "user") continue;

    const assistantText = previous.content.toLowerCase();
    const userText = current.content.toLowerCase();
    const userLocation = extractLocation(userText);
    const isAffirmative =
      /\b(ok|okay|yes|yeah|yep|sure|i have|have it|got it|i do|all documents|all the documents|all the documnts|everything)\b/.test(
        userText,
      );

    if (userLocation) {
      facts.push(`User location is ${userLocation}.`);
    }

    if (/\b(lost|misplaced|replacement|new id|apply.*id|id.*apply|lost my id)\b/.test(userText)) {
      facts.push("User is asking about replacing a lost or misplaced ID, not income-based benefits.");
    }

    if (/\b(misplaced|lost without theft|not stolen|lost or misplaced)\b/.test(userText)) {
      facts.push("User says the ID was misplaced without theft.");
    }

    if (/\b(all documents|all the documents|all the documnts|everything)\b/.test(userText)) {
      facts.push("User has identity proof such as a birth certificate, old ID copy, or another identity proof.");
      facts.push("User has proof of residence.");
    }

    if (
      assistantText.includes("proof of enrollment") &&
      /\b(ok|okay|yes|yeah|yep|sure|tomorrow|i will|can get|will do)\b/.test(userText)
    ) {
      facts.push("User can get proof of enrollment such as a student letter or registration record.");
    }

    if (
      isAffirmative &&
      (assistantText.includes("birth certificate") ||
        assistantText.includes("old id copy") ||
        assistantText.includes("identity proof"))
    ) {
      facts.push("User has identity proof such as a birth certificate, old ID copy, or another identity proof.");
    }

    if (isAffirmative && assistantText.includes("proof of residence")) {
      facts.push("User has proof of residence.");
    }

    if (
      isAffirmative &&
      (assistantText.includes("stolen") || assistantText.includes("lost or misplaced without theft"))
    ) {
      facts.push("User has answered the theft question about the lost ID.");
    }
  }

  return Array.from(new Set(facts));
}

function extractLocation(text: string) {
  const normalized = text.replace(/\btexa city\b/g, "texas city");
  const match = normalized.match(/\b(?:in|near|around|at)\s+([a-z][a-z\s-]{2,40})\b/);
  if (!match) return "";

  return match[1]
    .replace(/\b(i|and|but|with|have|need|want)\b.*$/i, "")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getActionIntent(message: string, contextText: string) {
  const normalized = message.toLowerCase();
  const normalizedContext = contextText.toLowerCase();
  if (normalized.includes("show required documents")) return "documents";
  if (normalized.includes("create checklist")) return "checklist";
  if (
    /\b(where to go|location link|location links|map|nearby|nearest|office)\b/.test(normalized) &&
    /\b(id|identity|lost|misplaced|dmv|document)\b/.test(normalizedContext)
  ) {
    return "map";
  }
  return "";
}

function buildActionResponse(intent: string, fallback: ChatResponse, contextText: string): ChatResponse {
  if (intent === "map") {
    const location = extractLocation(contextText) || "your area";
    const query = `${location} ID office DMV`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

    return {
      ...fallback,
      reply: `For a lost or misplaced ID, start with the nearest official ID/DMV office for ${location}. Use this Google Maps search link as a starting point: ${mapsUrl}. Please verify the office website, opening hours, fees, and appointment rules before travelling.`,
      intakeStatus: "ready_for_guidance",
      nextQuestion: "",
      followUpQuestions: [],
    };
  }

  const needed = filterDocumentItems(fallback.documentChecklist.needed);
  const missing = filterDocumentItems(fallback.documentChecklist.missing);
  const documents = canonicalDocuments([...needed, ...missing]);
  const documentText = documents.length
    ? documents.join(", ")
    : "birth certificate or accepted identity proof, proof of residence if available, and any old ID copy or reference number you still have";
  const baseReply =
    intent === "documents"
      ? `For this situation, prepare these documents: ${documentText}. Since this is an ID replacement issue, ask the official ID/DMV office which identity alternatives they accept.`
      : `Here is a practical checklist: gather ${documentText}; confirm whether the lost ID needs a police report only if it was stolen; find the nearest official ID/DMV office; verify appointment, fee, and form requirements before travelling.`;

  return {
    ...fallback,
    reply: `${baseReply} Please verify the final list with the official office or a human adviser.`,
    intakeStatus: "ready_for_guidance",
    nextQuestion: "",
    followUpQuestions: [],
    documentChecklist: {
      ...fallback.documentChecklist,
      needed,
      missing,
    },
  };
}

function filterDocumentItems(items: string[]) {
  return items.filter((item) => {
    const normalized = item.toLowerCase();
    return !["current location", "household size if relevant", "contact details"].includes(normalized);
  });
}

function canonicalDocuments(items: string[]) {
  const canonical = new Map<string, string>();

  for (const item of items) {
    const normalized = item.toLowerCase();

    if (normalized.includes("student") || normalized.includes("enrollment")) {
      canonical.set("enrollment", "proof of enrollment or a student letter");
      continue;
    }

    if (normalized.includes("income") || normalized.includes("unemployment") || normalized.includes("job")) {
      canonical.set("income", "a short explanation or proof of your lost part-time income");
      continue;
    }

    if (normalized.includes("residence") || normalized.includes("address")) {
      canonical.set("residence", "proof of residence if available");
      continue;
    }

    if (normalized.includes("birth certificate")) {
      canonical.set("birth", "birth certificate or accepted identity alternative");
      continue;
    }

    if (normalized.includes("id") || normalized.includes("identity")) {
      canonical.set("identity", "any identity proof you still have, such as an old ID copy or school record");
      continue;
    }

    if (normalized.includes("urgent") || normalized.includes("summary") || normalized.includes("problem")) {
      canonical.set("summary", "a short written summary of your food and school-expense need");
    }
  }

  return [...canonical.values()];
}
