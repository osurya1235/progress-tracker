import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    let dateFilter = {};

    if (dateStr) {
      const start = new Date(dateStr + "T00:00:00.000Z");
      const end = new Date(dateStr + "T23:59:59.999Z");
      dateFilter = { date: { gte: start, lte: end } };
    } else if (year && month) {
      const start = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
      const end = new Date(Date.UTC(parseInt(year), parseInt(month), 0, 23, 59, 59, 999));
      dateFilter = { date: { gte: start, lte: end } };
    }

    const records = await prisma.dailyRecord.findMany({
      where: { userId: user.id, ...dateFilter },
      include: { goal: true, task: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

    const { description, goalId, date } = await request.json();
    if (!description) return NextResponse.json({ error: "Description required" }, { status: 400 });

    const recordDate = date
      ? new Date(date + "T00:00:00.000Z")
      : new Date(new Date().toISOString().split("T")[0] + "T00:00:00.000Z");

    const created = await prisma.dailyRecord.create({
      data: {
        userId: user.id,
        date: recordDate,
        goalId: goalId || null,
        description,
      },
    });
    const record = await prisma.dailyRecord.findUnique({
      where: { id: created.id },
      include: { goal: true, task: true },
    });

    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
