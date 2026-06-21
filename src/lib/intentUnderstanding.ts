import OpenAI from "openai";

const supportCategoryLabels: Record<string, string> = {
  "food-support": "Food Support",
  "education-support": "Education Support",
  "student-welfare": "Student Welfare",
  "emergency-relief": "Emergency Relief",
  "document-readiness": "Document Readiness",
  "healthcare-access": "Healthcare Access",
  "employment-youth": "Youth Employment",
  "family-childcare": "Family / Childcare",
  "human-referral": "Human Referral",
};

const categorySignals = [
  {
    id: "emergency-relief",
    pattern:
      /\b(emergency|urgent|today|tonight|right now|relief|crisis|homeless|no food today|shutoff|disconnect|utility bill|power bill|liheap)\b/i,
  },
  {
    id: "healthcare-access",
    pattern:
      /\b(sick|ill|unwell|not feeling well|health|healthcare|clinic|doctor|nurse|hospital|medicine|medication|medical|pain|fever|pregnant|disability|treatment)\b/i,
  },
  {
    id: "food-support",
    pattern: /\b(food|groceries|grocery|meal|meals|hungry|hunger|nutrition|eat|snap|food stamps)\b/i,
  },
  {
    id: "education-support",
    pattern: /\b(school|education|fees|tuition|student|college|university|bursary|scholarship|beam|learner)\b/i,
  },
  {
    id: "student-welfare",
    pattern: /\b(student welfare|student affairs|campus|hardship|registrar|dean of students)\b/i,
  },
  {
    id: "employment-youth",
    pattern:
      /\b(job|work|employment|unemployed|lost job|lost income|income|cv|resume|training|business|sme|entrepreneur|startup|self employed)\b/i,
  },
  {
    id: "family-childcare",
    pattern: /\b(child|children|family|caregiver|dependent|childcare|guardian|parent|tanf|household)\b/i,
  },
  {
    id: "document-readiness",
    pattern:
      /\b(id|identity|document|documents|papers|birth certificate|proof of residence|proof of address|license|licence|dmv|passport|civil registry)\b/i,
  },
  {
    id: "human-referral",
    pattern: /\b(human|adviser|advisor|social worker|case worker|official verification|speak to someone|complicated|not sure)\b/i,
  },
];

export type IntentUnderstandingResult = {
  categoryIds: string[];
  source: "local" | "openai" | "none";
};

export function inferLocalSupportCategoryIds(text: string) {
  const normalized = text.toLowerCase();
  return categorySignals
    .map(({ id, pattern }, priority) => ({
      id,
      priority,
      index: normalized.search(pattern),
    }))
    .filter((match) => match.index >= 0)
    .sort((left, right) => left.index - right.index || left.priority - right.priority)
    .map((match) => match.id);
}

export function categoryIdsToLabels(categoryIds: string[]) {
  return Array.from(new Set(categoryIds))
    .map((categoryId) => supportCategoryLabels[categoryId])
    .filter((label): label is string => Boolean(label));
}

export function appendIntentContext(query: string, intent: IntentUnderstandingResult) {
  const labels = categoryIdsToLabels(intent.categoryIds);
  if (!labels.length) return query;

  return `${query}\nPlain-language inferred support areas (${intent.source}): ${labels.join(", ")}`;
}

export async function understandSupportIntent(text: string, apiKey?: string): Promise<IntentUnderstandingResult> {
  const localCategoryIds = inferLocalSupportCategoryIds(text);
  const shouldUseOpenAi = Boolean(apiKey) && shouldAskOpenAiForIntent(text, localCategoryIds);

  if (!apiKey || !shouldUseOpenAi) {
    return {
      categoryIds: localCategoryIds,
      source: localCategoryIds.length ? "local" : "none",
    };
  }

  try {
    const openAiCategoryIds = await classifySupportIntentWithOpenAi(text, apiKey);
    const categoryIds = openAiCategoryIds.length
      ? mergeCategoryIds(openAiCategoryIds, localCategoryIds)
      : localCategoryIds;

    return {
      categoryIds,
      source: openAiCategoryIds.length ? "openai" : localCategoryIds.length ? "local" : "none",
    };
  } catch {
    return {
      categoryIds: localCategoryIds,
      source: localCategoryIds.length ? "local" : "none",
    };
  }
}

function shouldAskOpenAiForIntent(text: string, localCategoryIds: string[]) {
  const normalized = text.toLowerCase();
  if (!localCategoryIds.length) return true;
  if (localCategoryIds.length > 1) return true;
  if (/\b(i feel|feeling|problem|struggling|not okay|not ok|help me|i need help)\b/i.test(normalized)) return true;
  return false;
}

async function classifySupportIntentWithOpenAi(text: string, apiKey: string) {
  const client = new OpenAI({ apiKey });
  const completion = await withTimeout(
    client.chat.completions.create({
      model: process.env.OPENAI_INTENT_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Classify a user's plain-language support need into allowed ServiceBridge support categories. Return JSON only. Do not decide eligibility and do not invent programs.",
        },
        {
          role: "user",
          content: `Allowed category ids:
food-support, education-support, student-welfare, emergency-relief, document-readiness, healthcare-access, employment-youth, family-childcare, human-referral

User text:
${text}

Return:
{"categoryIds":["allowed-id"],"reason":"short phrase"}`,
        },
      ],
    }),
    4500,
  );

  const textResponse = completion.choices[0]?.message.content;
  if (!textResponse) return [];

  const parsed = JSON.parse(textResponse) as { categoryIds?: unknown };
  if (!Array.isArray(parsed.categoryIds)) return [];

  const allowed = new Set(Object.keys(supportCategoryLabels));
  return parsed.categoryIds.filter((item): item is string => typeof item === "string" && allowed.has(item));
}

function mergeCategoryIds(first: string[], second: string[]) {
  return Array.from(new Set([...first, ...second]));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Intent classification timed out.")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
