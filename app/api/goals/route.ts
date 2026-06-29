import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

    const goals = await prisma.goal.findMany({
      where: { userId: user.id, archived: false },
      include: {
        tasks: { orderBy: { createdAt: "asc" } },
        _count: { select: { records: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

    const { title, description, emoji } = await request.json();
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const goal = await prisma.goal.create({
      data: { userId: user.id, title, description: description || null, emoji: emoji || "🎯" },
      include: { tasks: true, _count: { select: { records: true } } },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
