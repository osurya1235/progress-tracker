import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const task = await prisma.task.findFirst({
      where: { id },
      include: { goal: true },
    });
    if (!task || task.goal.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.completed !== undefined && { completed: body.completed }),
        ...(body.completed === true && { completedAt: new Date() }),
        ...(body.completed === false && { completedAt: null }),
      },
    });

    // Auto-create daily record when task is completed
    if (body.completed === true && !task.completed) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await prisma.dailyRecord.create({
        data: {
          userId: user.id,
          date: today,
          goalId: task.goalId,
          taskId: task.id,
          description: `Completed: ${task.title}`,
        },
      });
    }

    return NextResponse.json(updatedTask);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

    const { id } = await params;
    const task = await prisma.task.findFirst({ where: { id }, include: { goal: true } });
    if (!task || task.goal.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
