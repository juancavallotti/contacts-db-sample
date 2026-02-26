import { NextResponse } from "next/server";
import { db } from "@/persistence/db/client";

export async function GET() {
  try {
    const contacts = await db.contact.findMany({
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    return NextResponse.json({ ok: true, contacts }, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        contacts: [],
        error: "Database healthcheck failed.",
      },
      { status: 500 },
    );
  }
}
