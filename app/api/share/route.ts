import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });
    return NextResponse.json({ shareToken: user.shareToken });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
