import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

    const { goalId, title } = await request.json();
    if (!goalId || !title) return NextResponse.json({ error: "goalId and title required" }, { status: 400 });

    const goal = await prisma.goal.findFirst({ where: { id: goalId, userId: user.id } });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    const task = await prisma.task.create({ data: { goalId, title } });
    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
