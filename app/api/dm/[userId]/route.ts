import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  throw error;
}

// GET /api/dm/[userId] — thread pesan antara saya dan user
export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await requireUser();
    const { userId } = await params;
    const me = session.user.id;

    const msgs = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: me, recipientId: userId },
          { senderId: userId, recipientId: me },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(msgs);
  } catch (error) {
    return errorResponse(error);
  }
}

// PATCH /api/dm/[userId] — tandai semua pesan dari user ini sebagai dibaca
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await requireUser();
    const { userId } = await params;
    await prisma.directMessage.updateMany({
      where: { senderId: userId, recipientId: session.user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
