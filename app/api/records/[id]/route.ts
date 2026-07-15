import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

    const { id } = await params;
    const { goalId, taskId } = await request.json();

    const { count } = await prisma.dailyRecord.updateMany({
      where: { id, userId: user.id },
      data: { goalId: goalId || null, taskId: taskId || null },
    });
    if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const record = await prisma.dailyRecord.findUnique({
      where: { id },
      include: { goal: true, task: true },
    });
    return NextResponse.json(record);
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
    await prisma.dailyRecord.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
