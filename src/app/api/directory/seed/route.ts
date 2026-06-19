import { NextResponse } from "next/server";
import { seedServiceRecords } from "@/lib/firebase-rest";

export async function POST() {
  try {
    const result = await seedServiceRecords();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        mode: "failed",
        error: error instanceof Error ? error.message : "Service records could not be seeded.",
      },
      { status: 500 },
    );
  }
}
