import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  throw error;
}

// DELETE /api/gallery/[id] — hapus foto (hanya pemilik atau admin)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;

    const photo = await prisma.galleryPhoto.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json({ error: "Foto tidak ditemukan." }, { status: 404 });
    }

    const isOwner = photo.uploadedById === session.user.id;
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "BENDAHARA";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Kamu tidak bisa menghapus foto orang lain." }, { status: 403 });
    }

    await prisma.galleryPhoto.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
