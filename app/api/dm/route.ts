import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { sendPushToUsers } from "@/lib/web-push";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  throw error;
}

// GET /api/dm — daftar percakapan (thread terbaru + jumlah belum dibaca)
export async function GET() {
  try {
    const session = await requireUser();
    const me = session.user.id;

    const messages = await prisma.directMessage.findMany({
      where: { OR: [{ senderId: me }, { recipientId: me }] },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, house: { select: { blockNumber: true } } } },
        recipient: { select: { id: true, name: true, house: { select: { blockNumber: true } } } },
      },
    });

    // Grup per pasangan
    const threads = new Map<string, { other: { id: string; name: string; house: string | null }; last: string; unread: number; at: Date }>();
    for (const m of messages) {
      const other = m.senderId === me ? m.recipient : m.sender;
      const key = other.id;
      if (!threads.has(key)) {
        threads.set(key, { other: { id: other.id, name: other.name, house: other.house?.blockNumber ?? null }, last: "", unread: 0, at: m.createdAt });
      }
      const t = threads.get(key)!;
      if (t.last === "") t.last = m.content;
      if (m.recipientId === me && !m.read) t.unread += 1;
    }

    const result = Array.from(threads.values()).sort((a, b) => b.at.getTime() - a.at.getTime());
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

const sendSchema = z.object({
  recipientId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

// POST /api/dm — kirim pesan langsung ke warga lain
export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    const body = sendSchema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    if (body.data.recipientId === session.user.id) {
      return NextResponse.json({ error: "Tidak bisa kirim ke diri sendiri." }, { status: 400 });
    }

    const msg = await prisma.directMessage.create({
      data: {
        senderId: session.user.id,
        recipientId: body.data.recipientId,
        content: body.data.content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } },
      },
    });

    // Push notifikasi ke penerima (APK + iOS)
    await sendPushToUsers(
      [body.data.recipientId],
      {
        title: `💬 Pesan dari ${msg.sender.name}`,
        body: msg.content.slice(0, 140),
        url: "/dm",
      }
    ).catch(() => {});

    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
