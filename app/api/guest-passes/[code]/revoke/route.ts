import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: (error as UnauthorizedError).message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: (error as ForbiddenError).message }, { status: 403 });
  throw error;
}

// PATCH /api/guest-passes/[code]/revoke — tuan rumah membatalkan pass
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const session = await requireUser();
    const { code } = await params;

    const pass = await prisma.guestPass.findUnique({ where: { code: code.toUpperCase() } });
    if (!pass) return NextResponse.json({ error: "Pass tidak ditemukan." }, { status: 404 });
    if (pass.hostId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya tuan rumah yang bisa membatalkan." }, { status: 403 });
    }
    if (pass.status !== "ACTIVE") {
      return NextResponse.json({ error: "Pass ini sudah tidak aktif." }, { status: 409 });
    }

    const updated = await prisma.guestPass.update({
      where: { id: pass.id },
      data: { status: "REVOKED" },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
