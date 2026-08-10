import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: (error as UnauthorizedError).message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: (error as ForbiddenError).message }, { status: 403 });
  throw error;
}

// DELETE /api/gallery/[id] — admin, atau warga yang meng-upload
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const photo = await prisma.galleryPhoto.findUnique({ where: { id } });
    if (!photo) return NextResponse.json({ error: "Foto tidak ditemukan." }, { status: 404 });
    if (session.user.role !== "ADMIN" && photo.uploadedById !== session.user.id) {
      return NextResponse.json({ error: "Hanya pengunggah atau admin yang bisa menghapus." }, { status: 403 });
    }
    await prisma.galleryPhoto.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
