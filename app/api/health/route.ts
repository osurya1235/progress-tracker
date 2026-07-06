import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const urlPrefix = url.length > 0 ? url.substring(0, 40) + "..." : "(empty)";

  // Test Prisma import
  try {
    const { prisma } = await import("@/lib/prisma");
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1 as n`,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DB timeout 8s")), 8000)),
    ]);
    return NextResponse.json({ ok: true, result, urlPrefix });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), urlPrefix }, { status: 500 });
  }
}
