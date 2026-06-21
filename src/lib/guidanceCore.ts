import { buildGroundedFallbackResponse } from "@/lib/groundedFallback";
import { appendIntentContext, understandSupportIntent, type IntentUnderstandingResult } from "@/lib/intentUnderstanding";
import { buildFallbackGuidance, retrieveServices, type RetrievalResult } from "@/lib/retrieval";
import { retrieveChatServices, type ChatRetrievalResult } from "@/lib/serviceRetrieval";
import type { SafetyAssessment } from "@/lib/safety";
import type { BenefitsGuidance, ServiceRecord } from "@/types/benefits";
import type { ChatResponse } from "@/types/chat";

export const unclearPrimaryNeed = "Need not clear yet";

export type GuidedGuidanceCore = {
  baseQuery: string;
  query: string;
  intent: IntentUnderstandingResult;
  retrieval: RetrievalResult;
  fallback: BenefitsGuidance;
};

export type ChatGuidanceCore = {
  retrieval: ChatRetrievalResult;
  fallback: ChatResponse;
};

export async function buildGuidedGuidanceCore({
  baseQuery,
  records,
  openAiKey,
}: {
  baseQuery: string;
  records: ServiceRecord[];
  openAiKey?: string;
}): Promise<GuidedGuidanceCore> {
  const intent = await understandSupportIntent(baseQuery, openAiKey);
  const query = appendIntentContext(baseQuery, intent);
  const retrieval = retrieveServices(query, records);
  const fallback = buildFallbackGuidance(query, retrieval);

  return {
    baseQuery,
    query,
    intent,
    retrieval,
    fallback,
  };
}

export function buildChatGuidanceCore({
  contextText,
  records,
  safety,
}: {
  contextText: string;
  records: ServiceRecord[];
  safety: SafetyAssessment;
}): ChatGuidanceCore {
  const retrieval = retrieveChatServices(contextText, records, safety);
  const fallback = buildGroundedFallbackResponse(contextText, retrieval, safety);

  return {
    retrieval,
    fallback,
  };
}

export function isUnclearPrimaryNeed(primaryNeeds: string[] | undefined) {
  return primaryNeeds?.[0] === unclearPrimaryNeed;
}
