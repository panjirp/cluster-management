import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { sendPushToUsers } from "@/lib/web-push";

// GET /api/group-chat — return latest 100 messages
export async function GET() {
  try {
    const session = await requireUser();
    const messages = await prisma.groupChatMessage.findMany({
      take: 100,
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            house: { select: { blockNumber: true } },
          },
        },
        house: { select: { id: true, blockNumber: true } },
      },
    });
    return NextResponse.json(messages);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}

// POST /api/group-chat — send a message
export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    const { content } = await req.json();

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    }

    // houseId otomatis dari akun pengirim (anti IDOR — tidak boleh dikirim oleh client).
    const houseId = session.user.houseId;

    const message = await prisma.groupChatMessage.create({
      data: {
        authorId: session.user.id,
        content: content.trim(),
        houseId: houseId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            house: { select: { blockNumber: true } },
          },
        },
        house: { select: { id: true, blockNumber: true } },
      },
    });

    // Deteksi mention @Nama → kirim notifikasi (lonceng + push) ke warga yang di-mention
    try {
      const mentionMatches = content.match(/@([A-Za-z0-9 _\-]+)/g) ?? [];
      const mentionedNames = mentionMatches
        .map((m) => m.slice(1).trim())
        .filter((n) => n && n !== session.user.name);

      if (mentionedNames.length > 0) {
        const mentioned = await prisma.user.findMany({
          where: { name: { in: mentionedNames }, role: "WARGA" },
          select: { id: true, name: true },
        });
        if (mentioned.length > 0) {
          const title = `💬 @${message.author.name} mention kamu`;
          const body = `${content.trim().slice(0, 140)}`;
          await prisma.notification.createMany({
            data: mentioned.map((u) => ({
              userId: u.id,
              title,
              body,
              url: "/chat",
              broadcastId: null,
            })),
          });
          await sendPushToUsers(
            mentioned.map((u) => u.id),
            { title, body, url: "/chat" }
          ).catch(() => {});
        }
      }
    } catch {
      // mention notif gagal tidak menghalangi kirim pesan
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}
