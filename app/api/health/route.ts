import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const hasUrl = url.length > 0;
  const urlPrefix = hasUrl ? url.substring(0, 35) + "..." : "(empty)";

  if (!hasUrl) {
    return NextResponse.json({ ok: false, stage: "env", error: "DATABASE_URL is empty", urlPrefix });
  }

  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 7000 });
  try {
    const result = await Promise.race([
      pool.query("SELECT 1 as n"),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout after 8s")), 8000)),
    ]);
    await pool.end();
    return NextResponse.json({ ok: true, stage: "db", rows: (result as { rows: unknown[] }).rows, urlPrefix });
  } catch (e) {
    try { await pool.end(); } catch { /* ignore */ }
    return NextResponse.json({ ok: false, stage: "db", error: String(e), urlPrefix }, { status: 500 });
  }
}
