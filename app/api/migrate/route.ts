import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$executeRaw`ALTER TABLE "DailyRecord" ADD COLUMN IF NOT EXISTS "loggedAt" TIMESTAMP(3)`;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "LabNote" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LabNote_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "LabNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;

    return NextResponse.json({ ok: true, message: "Migration complete" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
