import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildFallbackGuidance, normalizeGuidance, retrieveServices } from "@/lib/retrieval";
import { getServiceRecords } from "@/lib/firebase-rest";
import type { IntakeFormData } from "@/types/benefits";

type GuidanceRequest = {
  query?: string;
  intake?: Partial<IntakeFormData>;
};

export async function POST(request: Request) {
  const body = (await request.json()) as GuidanceRequest;
  const query = buildQuery(body);

  if (!query) {
    return NextResponse.json({ error: "A query is required." }, { status: 400 });
  }

  const directory = await getServiceRecords();
  const retrieval = retrieveServices(query, directory.records);
  const fallback = buildFallbackGuidance(query, retrieval);
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (openAiKey) {
    try {
      const client = new OpenAI({ apiKey: openAiKey });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are ServiceBridge AI, a Benefits Navigator for public support. You help users understand possible support pathways, missing documents, and safe next steps in simple language. Never say the user qualifies; say they may qualify or may match a pathway. You do not make medical, legal, welfare, immigration, emergency, or eligibility decisions. Use only the provided support-record context. Return valid JSON only.",
          },
          {
            role: "user",
            content: buildGuidancePrompt(query, retrieval),
          },
        ],
      });

      const text = completion.choices[0]?.message.content;
      const guidance = text ? normalizeGuidance(JSON.parse(text), fallback) : fallback;

      return NextResponse.json({
        provider: "openai-gpt-4o-mini",
        directorySource: directory.source,
        retrieval,
        guidance,
      });
    } catch (error) {
      return NextResponse.json({
        provider: "local-fallback-after-openai-error",
        directorySource: directory.source,
        retrieval,
        guidance: fallback,
        warning: error instanceof Error ? error.message : "OpenAI generation failed.",
      });
    }
  }

  if (!geminiKey) {
    return NextResponse.json({
      provider: "local-fallback",
      directorySource: directory.source,
      retrieval,
      guidance: fallback,
    });
  }

  try {
    const prompt = buildGuidancePrompt(query, retrieval);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.25,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed with ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const guidance = text ? normalizeGuidance(JSON.parse(text), fallback) : fallback;

    return NextResponse.json({
      provider: "gemini-2.5-flash",
      directorySource: directory.source,
      retrieval,
      guidance,
    });
  } catch (error) {
    return NextResponse.json({
      provider: "local-fallback-after-ai-error",
      directorySource: directory.source,
      retrieval,
      guidance: fallback,
      warning: error instanceof Error ? error.message : "AI generation failed.",
    });
  }
}

function buildQuery(body: GuidanceRequest) {
  const freeText = body.query?.trim() ?? "";
  const intake = body.intake;

  if (!intake) return freeText;

  const intakeSummary = [
    intake.age ? `Age: ${intake.age}` : "",
    intake.studentStatus ? `Student status: ${intake.studentStatus}` : "",
    intake.employmentStatus ? `Employment status: ${intake.employmentStatus}` : "",
    intake.incomeSituation ? `Income situation: ${intake.incomeSituation}` : "",
    intake.dependents ? `Dependents: ${intake.dependents}` : "",
    intake.location ? `Location: ${intake.location}` : "",
    intake.supportNeeded?.length ? `Support needed: ${intake.supportNeeded.join(", ")}` : "",
    intake.urgency ? `Urgency: ${intake.urgency}` : "",
    intake.hasId ? `Has ID: ${intake.hasId}` : "",
    intake.hasProofOfResidence ? `Has proof of residence: ${intake.hasProofOfResidence}` : "",
    intake.hasStudentLetter ? `Has student letter: ${intake.hasStudentLetter}` : "",
    intake.hasProofOfIncome ? `Has proof of income/unemployment: ${intake.hasProofOfIncome}` : "",
    intake.freeText ? `Additional details: ${intake.freeText}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [freeText, intakeSummary].filter(Boolean).join("\n\n");
}

function buildGuidancePrompt(query: string, retrieval: ReturnType<typeof retrieveServices>) {
  return `
Use only the support-record context below. If information is missing, say what is limited and ask a follow-up question. Frame matches as possible support pathways, not guaranteed eligibility.

User question:
${query}

Detected benefits flow: ${retrieval.categoryName}
Urgency: ${retrieval.urgency}
Directory coverage: ${retrieval.coverage}
Directory note:
${retrieval.directoryNote}
Safety note that must be preserved:
${retrieval.safetyNote}

Support-record context:
${JSON.stringify(retrieval.records, null, 2)}

Return valid JSON only with these fields:
{
  "summary": "What I understand in 1-2 sentences, using may qualify/may match language",
  "followUpQuestions": ["Question 1", "Question 2"],
  "possibleMatches": [
    {
      "id": "record id from context",
      "name": "Possible support name",
      "category": "Support category",
      "whyThisMayFit": "Why this may fit, never guaranteed",
      "documentsNeeded": ["Document"],
      "nextSteps": ["Step 1", "Step 2", "Step 3"],
      "sourceLabel": "Source or verification label",
      "sourceUrl": "URL from context",
      "verificationStatus": "sample",
      "matchLevel": "High",
      "uncertaintyNote": "What must be verified",
      "location": "Curated location from context"
    }
  ],
  "documentReadiness": {
    "summary": "Document readiness summary",
    "items": [{"name": "ID", "status": "missing", "guidance": "What to do"}],
    "missingDocuments": ["Missing document"],
    "idPreparationSteps": ["Step"]
  },
  "nextSteps": ["Step 1", "Step 2", "Step 3"],
  "safetyNote": "Safety note",
  "humanReferral": {
    "title": "Human verification required",
    "reason": "Why a human stays in control",
    "options": ["Student affairs office"],
    "verificationStep": "What to ask the human/official office"
  }
}
`;
}
