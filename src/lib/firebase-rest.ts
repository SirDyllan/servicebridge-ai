import { serviceCategories, serviceRecords, type ServiceRecord } from "@/data/service-directory";

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields: FirestoreFields } };

type FirestoreFields = Record<string, FirestoreValue>;
type FirestoreDocument = { name?: string; fields?: FirestoreFields };
type FirestorePlainRecord = Record<string, unknown>;

export type FeedbackPayload = {
  query: string;
  category: string;
  urgency: string;
  provider: string;
  feedbackType: string;
  comment?: string;
};

export function isFirebaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
}

export async function saveFeedback(payload: FeedbackPayload) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    return {
      mode: "local-fallback" as const,
      id: `local-${Date.now()}`,
      message: "Firebase is not configured yet. Feedback was accepted by the API but not stored remotely.",
    };
  }

  const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/user_feedback?key=${apiKey}`;
  const now = new Date().toISOString();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: toFirestoreFields({
          ...payload,
          createdAt: now,
          status: "new",
          source: "servicebridge-web",
        }),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Firestore feedback write failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    const id = typeof data.name === "string" ? data.name.split("/").pop() : undefined;

    return {
      mode: "firestore" as const,
      id: id ?? "unknown",
      message: "Feedback stored in Firestore.",
    };
  } catch (error) {
    return {
      mode: "local-fallback" as const,
      id: `local-${Date.now()}`,
      message: `Feedback accepted locally because Firestore was unavailable. ${
        error instanceof Error ? error.message : "Unknown Firestore error."
      }`,
    };
  }
}

export async function getServiceRecords() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    return {
      source: "local-fallback" as const,
      records: serviceRecords,
      message: "Firebase is not configured, so local seed records were used.",
    };
  }

  try {
    const endpoint = firestoreCollectionEndpoint("service_records", projectId, apiKey);
    const response = await fetch(endpoint, { cache: "no-store" });

    if (!response.ok) {
      const text = await response.text();
      return {
        source: "local-fallback" as const,
        records: serviceRecords,
        message: `Firestore service record read failed (${response.status}); local seed records were used. ${text}`,
      };
    }

    const data = await response.json();
    const documents = Array.isArray(data.documents) ? data.documents : [];
    const activeCategoryIds = new Set(serviceCategories.map((category) => category.id));
    const activeRecordIds = new Set(serviceRecords.map((record) => record.id));
    const records = (documents as FirestoreDocument[])
      .map(fromFirestoreDocument)
      .filter(isServiceRecord)
      .filter((record) => activeCategoryIds.has(record.categoryId) && activeRecordIds.has(record.id));

    if (!records.length) {
      return {
        source: "local-fallback" as const,
        records: serviceRecords,
        message: "Firestore has no service_records yet, so local seed records were used.",
      };
    }

    return {
      source: "firestore" as const,
      records,
      message: `${records.length} service records loaded from Firestore.`,
    };
  } catch (error) {
    return {
      source: "local-fallback" as const,
      records: serviceRecords,
      message: `Firestore was unavailable, so local seed records were used. ${
        error instanceof Error ? error.message : "Unknown Firestore error."
      }`,
    };
  }
}

export async function seedServiceRecords() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    return {
      mode: "local-fallback" as const,
      count: 0,
      message: "Firebase is not configured. Service records were not seeded.",
    };
  }

  const results = await Promise.all(
    serviceRecords.map(async (record) => {
      const endpoint = `${firestoreCollectionEndpoint("service_records", projectId, apiKey)}&documentId=${encodeURIComponent(record.id)}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: toFirestoreFields(record) }),
      });

      if (response.ok) {
        return { id: record.id, status: "created" };
      }

      if (response.status === 409) {
        const patchEndpoint = firestoreDocumentEndpoint("service_records", record.id, projectId, apiKey);
        const patchResponse = await fetch(patchEndpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: toFirestoreFields(record) }),
        });

        if (patchResponse.ok) {
          return { id: record.id, status: "updated" };
        }

        throw new Error(`Firestore service record update failed for ${record.id}: ${patchResponse.status} ${await patchResponse.text()}`);
      }

      throw new Error(`Firestore service record seed failed for ${record.id}: ${response.status} ${await response.text()}`);
    }),
  );

  return {
    mode: "firestore" as const,
    count: results.length,
    message: `${results.length} service records seeded or updated in Firestore.`,
    results,
  };
}

function firestoreCollectionEndpoint(collection: string, projectId: string, apiKey: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?key=${apiKey}`;
}

function firestoreDocumentEndpoint(collection: string, documentId: string, projectId: string, apiKey: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${encodeURIComponent(documentId)}?key=${apiKey}`;
}

function toFirestoreFields(values: Record<string, unknown>): FirestoreFields {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toFirestoreValue(key, value)]),
  );
}

function toFirestoreValue(key: string, value: unknown): FirestoreValue {
  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }

  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((item) => toFirestoreValue(key, item)) } };
  }

  if (value && typeof value === "object") {
    return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
  }

  if (key === "createdAt" || key === "lastVerified") {
    const dateValue = key === "lastVerified" ? `${String(value)}T00:00:00.000Z` : String(value);
    return { timestampValue: dateValue };
  }

  return { stringValue: String(value ?? "") };
}

function fromFirestoreDocument(document: FirestoreDocument): FirestorePlainRecord {
  const raw = Object.fromEntries(
    Object.entries(document.fields ?? {}).map(([key, value]) => [key, fromFirestoreValue(value)]),
  );
  const id = typeof document.name === "string" ? document.name.split("/").pop() : raw.id;

  return {
    ...raw,
    id: raw.id ?? id,
    lastVerified: normalizeDate(raw.lastVerified),
  };
}

function fromFirestoreValue(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(fromFirestoreValue);
  if ("mapValue" in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields ?? {}).map(([key, fieldValue]) => [key, fromFirestoreValue(fieldValue)]),
    );
  }
  return "";
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return "";
  return value.includes("T") ? value.slice(0, 10) : value;
}

function isServiceRecord(value: Record<string, unknown>): value is ServiceRecord {
  return (
    typeof value.id === "string" &&
    typeof value.categoryId === "string" &&
    typeof value.serviceName === "string" &&
    typeof value.category === "string" &&
    typeof value.targetUser === "string" &&
    typeof value.possibleEligibility === "string" &&
    Array.isArray(value.documentsNeeded) &&
    Array.isArray(value.steps) &&
    Array.isArray(value.keywords)
  );
}
