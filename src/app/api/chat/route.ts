import { NextResponse } from "next/server";
import { getServiceRecords } from "@/lib/firebase-rest";
import { buildGroundedFallbackResponse } from "@/lib/groundedFallback";
import { generateOpenAiChatResponse } from "@/lib/openai";
import { assessSafety } from "@/lib/safety";
import { retrieveChatServices } from "@/lib/serviceRetrieval";
import type { ChatMessage, ChatRequest } from "@/types/chat";

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
  const fallback = buildGroundedFallbackResponse(message, retrieval, safety);

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
  const recentConversation = history
    .slice(-8)
    .map((item) => `${item.role}: ${item.content}`);

  return [...recentConversation, `user: ${message}`].join("\n");
}
