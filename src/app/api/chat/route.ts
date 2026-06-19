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
  const actionIntent = getActionIntent(message);

  if (actionIntent) {
    return NextResponse.json({
      ...buildActionResponse(actionIntent, fallback),
      directorySource: directory.source,
    });
  }

  if (!process.env.OPENAI_API_KEY || safety.urgency === "emergency") {
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

    if (
      assistantText.includes("proof of enrollment") &&
      /\b(ok|okay|yes|yeah|yep|sure|tomorrow|i will|can get|will do)\b/.test(userText)
    ) {
      facts.push("User can get proof of enrollment such as a student letter or registration record.");
    }
  }

  return Array.from(new Set(facts));
}

function getActionIntent(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("show required documents")) return "documents";
  if (normalized.includes("create checklist")) return "checklist";
  return "";
}

function buildActionResponse(intent: string, fallback: ChatResponse): ChatResponse {
  const needed = filterDocumentItems(fallback.documentChecklist.needed);
  const missing = filterDocumentItems(fallback.documentChecklist.missing);
  const documents = canonicalDocuments([...needed, ...missing]);
  const documentText = documents.length
    ? documents.join(", ")
    : "proof of enrollment, proof of residence if available, income-change proof, and any identity alternative you have";
  const baseReply =
    intent === "documents"
      ? `For this situation, prepare these documents: ${documentText}. Since you said you do not have an ID yet, ask the student affairs office or support office which identity alternative they can accept while you work on ID replacement.`
      : `Here is a practical checklist: gather ${documentText}; write a short note explaining that you lost part-time income; contact student affairs or a social worker in your area this week; ask which support can start before your ID is ready.`;

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
