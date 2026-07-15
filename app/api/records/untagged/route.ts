import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

    const records = await prisma.dailyRecord.findMany({
      where: { userId: user.id, goalId: null },
      include: { goal: true, task: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
