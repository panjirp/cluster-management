import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { sendPushToUsers } from "@/lib/web-push";

const broadcastSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(1000),
  url: z.string().max(500).optional(),
});

// POST /api/notifications/broadcast — pengurus mengirim pengumuman ke semua warga.
// Membuat baris Notification untuk setiap akun WARGA; muncul di lonceng notifikasi
// (dan di APK ditampilkan sebagai push notification lokal saat app dibuka).
export async function POST(request: NextRequest) {
  try {
    const session = await requireBendahara();
    const body = broadcastSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Judul dan isi pengumuman wajib diisi." }, { status: 400 });
    }
    const { title, body: message, url } = body.data;
    const broadcastId = randomUUID();

    const targetCount = await prisma.user.count({ where: { role: "WARGA" } });
    if (targetCount === 0) {
      return NextResponse.json({ error: "Belum ada akun warga untuk dikirimi pengumuman." }, { status: 400 });
    }

    // Buat satu notifikasi per warga (kelompok broadcastId sama utk statistik baca)
    const warga = await prisma.user.findMany({ where: { role: "WARGA" }, select: { id: true } });
    await prisma.notification.createMany({
      data: warga.map((w) => ({
        userId: w.id,
        title,
        body: message,
        url: url ?? null,
        broadcastId,
      })),
    });
    // Push: FCM + Web Push ke perangkat semua warga (walau app tertutup)
    await sendPushToUsers(
      warga.map((w) => w.id),
      { title, body: message, url: url ?? "/dashboard" }
    ).catch(() => {});

    return NextResponse.json({ sent: warga.length });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
