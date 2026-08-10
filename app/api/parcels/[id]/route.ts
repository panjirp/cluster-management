import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: (error as UnauthorizedError).message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: (error as ForbiddenError).message }, { status: 403 });
  throw error;
}

// PATCH /api/parcels/[id] — warga (pemilik) atau admin menandai paket sudah diambil
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;

    const parcel = await prisma.parcel.findUnique({ where: { id } });
    if (!parcel) return NextResponse.json({ error: "Paket tidak ditemukan." }, { status: 404 });

    const isOwner =
      parcel.residentId === session.user.id ||
      (session.user.houseId != null && parcel.houseId === session.user.houseId);
    if (session.user.role !== "ADMIN" && !isOwner) {
      return NextResponse.json({ error: "Hanya pemilik paket atau admin yang bisa mengambil." }, { status: 403 });
    }

    const updated = await prisma.parcel.update({
      where: { id },
      data: { status: "PICKED_UP", pickedUpAt: new Date() },
      include: { house: { select: { blockNumber: true } } },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
