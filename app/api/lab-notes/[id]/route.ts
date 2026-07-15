import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

    const { id } = await params;
    await prisma.labNote.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
