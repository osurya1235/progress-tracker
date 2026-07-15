import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

    const notes = await prisma.labNote.findMany({
      where: { userId: user.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(notes);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

    const { content, date } = await request.json();
    if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const noteDate = date
      ? new Date(date + "T00:00:00.000Z")
      : new Date(new Date().toISOString().split("T")[0] + "T00:00:00.000Z");

    const created = await prisma.labNote.create({
      data: { userId: user.id, date: noteDate, content: content.trim() },
    });
    const note = await prisma.labNote.findUnique({ where: { id: created.id } });

    return NextResponse.json(note, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
