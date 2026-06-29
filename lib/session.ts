import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getOrCreateUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) return null;

  let user = await prisma.user.findUnique({ where: { sessionId } });

  if (!user) {
    user = await prisma.user.create({ data: { sessionId } });
  }

  return user;
}
