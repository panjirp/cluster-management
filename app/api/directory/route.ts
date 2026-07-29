import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { createDirectoryMemberSchema } from "@/lib/validations/directory";

export async function GET() {
  try {
    await requireUser();
    const members = await prisma.directoryMember.findMany({ orderBy: [{ roleType: "asc" }, { position: "asc" }] });
    return NextResponse.json(members);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = createDirectoryMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const member = await prisma.directoryMember.create({ data: parsed.data });
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
