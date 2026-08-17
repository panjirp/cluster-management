import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { awardCoveCoin } from "@/lib/covecoin";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: (error as UnauthorizedError).message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: (error as ForbiddenError).message }, { status: 403 });
  throw error;
}

// GET /api/gallery — foto galeri (opsional filter eventId)
export async function GET(req: NextRequest) {
  try {
    const session = await requireUser();
    const eventId = req.nextUrl.searchParams.get("eventId");
    const photos = await prisma.galleryPhoto.findMany({
      where: eventId ? { eventId } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        event: { select: { title: true } },
        uploadedBy: { select: { name: true, house: { select: { blockNumber: true } } } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: session.user.id }, select: { id: true } },
        comments: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { user: { select: { name: true } } },
        },
      },
    });
    const mapped = photos.map((p) => ({
      id: p.id,
      filePath: p.filePath,
      caption: p.caption,
      createdAt: p.createdAt,
      uploadedById: p.uploadedById,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      likedByMe: p.likes.length > 0,
      event: p.event,
      uploadedBy: p.uploadedBy,
      comments: p.comments.map((c) => ({ id: c.id, content: c.content, user: c.user.name })),
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  filePath: z.string().min(1).startsWith("/api/uploads/"),
  caption: z.string().max(200).optional().or(z.literal("")),
  eventId: z.string().optional().nullable(),
});

// POST /api/gallery — warga/admin upload foto ke galeri
export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    const body = createSchema.safeParse(await req.json());
    if (!body.success) {
      const message = body.error.issues[0]?.message ?? "Data tidak valid.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const photo = await prisma.galleryPhoto.create({
      data: {
        filePath: body.data.filePath,
        caption: body.data.caption?.trim() || null,
        eventId: body.data.eventId || null,
        uploadedById: session.user.id,
      },
    });

    // Award CoveCoin saat unggah momen
    await awardCoveCoin(session.user.id, 100, "CoveCoin unggah FYP").catch(() => {});

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
