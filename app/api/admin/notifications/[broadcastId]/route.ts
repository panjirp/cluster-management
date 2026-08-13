import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";

// GET /api/admin/notifications/[broadcastId] — detail siapa yang sudah/belum baca broadcast
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ broadcastId: string }> }
) {
  try {
    await requireBendahara();
    const { broadcastId } = await params;

    const notifs = await prisma.notification.findMany({
      where: { broadcastId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            house: { select: { blockNumber: true } },
          },
        },
      },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    });

    const read = notifs.filter((n) => n.read).map((n) => ({ name: n.user.name, house: n.user.house?.blockNumber ?? null }));
    const unread = notifs.filter((n) => !n.read).map((n) => ({ name: n.user.name, house: n.user.house?.blockNumber ?? null }));

    return NextResponse.json({
      title: notifs[0]?.title ?? "Pengumuman",
      total: notifs.length,
      readCount: read.length,
      unreadCount: unread.length,
      read,
      unread,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
