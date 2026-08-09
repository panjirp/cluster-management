import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const createSchema = z.object({
  message: z.string().max(500).optional(),
});

// POST /api/emergency — warga menekan tombol darurat.
// Simpan alert, kirim WA ke pengurus (nomor emergencyNotifyPhone pada
// Setting, atau fallback ke nomor admin pertama yang punya phone), dan buat
// Notification untuk semua pengurus.
export async function POST(request: NextRequest) {
  try {
    const session = await requireUser();
    const body = createSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }
    const { message } = body.data;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });

    const house = user.houseId
      ? await prisma.house.findUnique({ where: { id: user.houseId }, select: { blockNumber: true } })
      : null;

    const alert = await prisma.emergencyAlert.create({
      data: {
        userId: user.id,
        userName: user.name,
        houseBlock: house?.blockNumber ?? "Tidak diketahui",
        message: message?.trim() || null,
      },
    });

    // Kirim WhatsApp ke pengurus (nomor khusus atau nomor pengurus pertama).
    const setting = await prisma.setting.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "BENDAHARA"] } },
      select: { id: true, name: true, phone: true },
    });
    const notifyPhone = setting.emergencyNotifyPhone || admins.find((a) => a.phone)?.phone || null;

    const waText = `🚨 DARURAT — Blok ${alert.houseBlock}
Warga: ${user.name}
Waktu: ${alert.createdAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
${message ? `Keterangan: ${message}` : "Mohon segera tindak lanjut."}
— Portal Barcelona Cove`;

    let waSent = false;
    if (notifyPhone) {
      try {
        await sendWhatsAppMessage(notifyPhone, waText);
        waSent = true;
      } catch {
        waSent = false; // jangan gagalkan alert jika WA bermasalah
      }
    }

    // Notifikasi in-app untuk semua pengurus.
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        title: "🚨 Darurat",
        body: `Blok ${alert.houseBlock} (${user.name}) menekan tombol darurat${message ? `: ${message}` : ""}`,
        url: "/admin/emergency",
      })),
    });

    return NextResponse.json({ alert, waSent });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}

// GET /api/emergency — pengurus melihat daftar alert (yang terbuka + 20 terakhir).
export async function GET() {
  try {
    const session = await requireBendahara();
    void session;
    const [open, recent] = await Promise.all([
      prisma.emergencyAlert.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" } }),
      prisma.emergencyAlert.findMany({
        where: { status: "RESOLVED" },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);
    return NextResponse.json({ open, recent });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
