import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: (error as UnauthorizedError).message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: (error as ForbiddenError).message }, { status: 403 });
  throw error;
}

// DELETE /api/polls/[id] — admin menghapus poll
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const poll = await prisma.poll.findUnique({ where: { id } });
    if (!poll) return NextResponse.json({ error: "Poll tidak ditemukan." }, { status: 404 });
    await prisma.poll.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
