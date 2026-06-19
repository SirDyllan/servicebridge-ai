import { NextResponse } from "next/server";
import { saveFeedback, type FeedbackPayload } from "@/lib/firebase-rest";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<FeedbackPayload>;

  if (!body.feedbackType || !body.category || !body.urgency || !body.provider) {
    return NextResponse.json(
      { error: "feedbackType, category, urgency, and provider are required." },
      { status: 400 },
    );
  }

  const payload: FeedbackPayload = {
    query: String(body.query ?? ""),
    category: String(body.category),
    urgency: String(body.urgency),
    provider: String(body.provider),
    feedbackType: String(body.feedbackType),
    comment: String(body.comment ?? ""),
  };

  try {
    const result = await saveFeedback(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        mode: "failed",
        error: error instanceof Error ? error.message : "Feedback could not be stored.",
      },
      { status: 500 },
    );
  }
}
