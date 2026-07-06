import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// One-time migration helper — run once then remove
export async function POST(request: Request) {
  const authHeader = request.headers.get("x-migrate-key") ?? "";
  if (authHeader !== "progress-migrate-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "shareToken" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      )
    `;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "User_sessionId_key" ON "User"("sessionId")`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "User_shareToken_key" ON "User"("shareToken")`;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Goal" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "emoji" TEXT NOT NULL DEFAULT '🎯',
        "archived" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Goal_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Task" (
        "id" TEXT NOT NULL,
        "goalId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "completedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Task_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "DailyRecord" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "goalId" TEXT,
        "taskId" TEXT,
        "description" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DailyRecord_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "DailyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        CONSTRAINT "DailyRecord_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL,
        CONSTRAINT "DailyRecord_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL
      )
    `;

    return NextResponse.json({ ok: true, message: "Tables created successfully" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
