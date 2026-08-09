import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";

// DELETE /api/letters/[id] — hapus surat (pengurus)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireBendahara();
    const { id } = await params;

    const existing = await prisma.suratEdaran.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Surat tidak ditemukan." }, { status: 404 });
    }

    await prisma.suratEdaran.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
