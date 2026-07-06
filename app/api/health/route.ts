import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const hasUrl = url.length > 0;
  const urlPrefix = hasUrl ? url.substring(0, 30) + "..." : "(empty)";

  if (!hasUrl) {
    return NextResponse.json({ ok: false, stage: "env", error: "DATABASE_URL is empty", urlPrefix });
  }

  // Test raw pg connection without Prisma
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 6000, idleTimeoutMillis: 5000 });
    const result = await Promise.race([
      pool.query("SELECT 1 as n"),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout after 6s")), 6000)),
    ]);
    await pool.end();
    return NextResponse.json({ ok: true, stage: "db", rows: (result as { rows: unknown[] }).rows, urlPrefix });
  } catch (e) {
    return NextResponse.json({ ok: false, stage: "db", error: String(e), urlPrefix }, { status: 500 });
  }
}
