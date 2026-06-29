import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const user = await prisma.user.findUnique({
      where: { shareToken: token },
      include: {
        goals: {
          where: { archived: false },
          include: { tasks: { orderBy: { createdAt: "asc" } } },
          orderBy: { createdAt: "desc" },
        },
        records: {
          take: 30,
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          include: { goal: true },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ goals: user.goals, records: user.records });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
