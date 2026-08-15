import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  throw error;
}

const commentSchema = z.object({
  content: z.string().min(1).max(500),
});

// GET /api/gallery/[id]/comments — daftar komentar
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const comments = await prisma.galleryComment.findMany({
      where: { photoId: id },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true, house: { select: { blockNumber: true } } } } },
    });
    return NextResponse.json(
      comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        user: c.user.name,
        house: c.user.house?.blockNumber ?? null,
      }))
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/gallery/[id]/comments — tambah komentar
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const body = commentSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Komentar tidak boleh kosong." }, { status: 400 });
    }

    const comment = await prisma.galleryComment.create({
      data: {
        photoId: id,
        userId: session.user.id,
        content: body.data.content.trim(),
      },
      include: { user: { select: { name: true, house: { select: { blockNumber: true } } } } },
    });

    return NextResponse.json(
      {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: comment.user.name,
        house: comment.user.house?.blockNumber ?? null,
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
