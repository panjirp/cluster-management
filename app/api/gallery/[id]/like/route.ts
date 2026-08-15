import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  throw error;
}

// POST /api/gallery/[id]/like — toggle suka (like/unlike)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;

    const existing = await prisma.galleryLike.findUnique({
      where: { photoId_userId: { photoId: id, userId: session.user.id } },
    });

    if (existing) {
      await prisma.galleryLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    await prisma.galleryLike.create({
      data: { photoId: id, userId: session.user.id },
    });
    return NextResponse.json({ liked: true });
  } catch (error) {
    return errorResponse(error);
  }
}
