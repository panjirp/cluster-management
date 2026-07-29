import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/client";

export class UnauthorizedError extends Error {
  status = 401;
  constructor() {
    super("Unauthorized");
  }
}

export class ForbiddenError extends Error {
  status = 403;
  constructor() {
    super("Forbidden");
  }
}

export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireUser();
  if (session.user.role !== Role.ADMIN) throw new ForbiddenError();
  return session;
}

export async function requireBendahara(): Promise<Session> {
  const session = await requireUser();
  if (session.user.role !== Role.BENDAHARA) throw new ForbiddenError();
  return session;
}
