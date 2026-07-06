import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const hasUrl = url.length > 0;
  const urlPrefix = hasUrl ? url.substring(0, 20) + "..." : "(empty)";

  if (!hasUrl) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL is not set", urlPrefix }, { status: 500 });
  }

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout after 8s")), 8000)),
    ]);
    return NextResponse.json({ ok: true, db: "connected", urlPrefix });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), urlPrefix }, { status: 500 });
  }
}
