import { NextResponse } from "next/server";
import { serviceCategories, type ServiceRecord } from "@/data/service-directory";
import { getServiceRecords } from "@/lib/firebase-rest";

export async function GET() {
  const directory = await getServiceRecords();
  const records: ServiceRecord[] = directory.records;
  const categoryCounts = records.reduce(
    (counts, record) => ({
      ...counts,
      [record.categoryId]: (counts[record.categoryId] ?? 0) + 1,
    }),
    {} as Record<string, number>,
  );

  const verificationCounts = records.reduce(
    (counts, record) => ({
      ...counts,
      [record.verificationStatus]: (counts[record.verificationStatus] ?? 0) + 1,
    }),
    {} as Record<string, number>,
  );

  return NextResponse.json({
    source: directory.source,
    message: directory.message,
    summary: {
      categories: serviceCategories.length,
      records: records.length,
      categoryCounts,
      verificationCounts,
    },
    design: {
      builtWith:
        "Structured benefit-support records containing target user, possible eligibility, documents, steps, source label, verification status, owner, update cadence, keywords, and curated location type.",
      maintainedBy:
        "Each record has a data owner, last verified date, update cadence, and feedback loop for wrong, unclear, missing, or risky guidance.",
      queriedBy:
        "Guidance retrieval classifies the benefits need, narrows related categories, scores record keywords, and returns a coverage and uncertainty note.",
    },
    categories: serviceCategories,
    records,
  });
}
