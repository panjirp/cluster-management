import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  throw error;
}

// DELETE /api/my-vehicles/[id] — warga hapus plat kendaraan miliknya
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;

    const reg = await prisma.vehicleRegistration.findUnique({ where: { id } });
    if (!reg) return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
    if (reg.houseId !== session.user.houseId) {
      return NextResponse.json({ error: "Kamu tidak bisa menghapus kendaraan rumah lain." }, { status: 403 });
    }

    await prisma.vehicleRegistration.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
