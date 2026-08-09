import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { sendPushToUser, isWebPushConfigured } from "@/lib/web-push";
import { sendFcmToUser, isFcmConfigured } from "@/lib/fcm";

/**
 * POST /api/push/register — daftarkan token FCM device milik user yang login.
 * Body: { token: string, platform?: "android" | "ios" }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    const body = (await req.json().catch(() => ({}))) as { token?: string; platform?: string };
    if (!body.token || typeof body.token !== "string" || body.token.length < 10) {
      return NextResponse.json({ error: "Token FCM tidak valid." }, { status: 400 });
    }

    await prisma.deviceToken.upsert({
      where: { token: body.token },
      update: { userId: session.user.id, platform: body.platform ?? "android" },
      create: { userId: session.user.id, token: body.token, platform: body.platform ?? "android" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error("Push register gagal:", error);
    return NextResponse.json({ error: "Gagal mendaftarkan token." }, { status: 500 });
  }
}

/**
 * DELETE /api/push/register — hapus token (saat logout / token tidak terpakai).
 * Body: { token: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    await requireUser();
    const body = (await req.json().catch(() => ({}))) as { token?: string };
    if (body.token) {
      await prisma.deviceToken.deleteMany({ where: { token: body.token } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    return NextResponse.json({ error: "Gagal menghapus token." }, { status: 500 });
  }
}

/**
 * POST /api/push/test — kirim notifikasi test ke perangkat user sendiri.
 * Dipakai untuk verifikasi FCM (Android) & Web Push (PWA iOS/desktop).
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await requireUser();
    if (!isFcmConfigured()) {
      return NextResponse.json({ error: "FCM belum dikonfigurasi di server." }, { status: 503 });
    }
    const sent = await sendPushToUser(session.user.id, {
      title: "🔔 Test Push Notification",
      body: "Jika notifikasi ini muncul, FCM server berfungsi sempurna! 🎉",
      url: "/dashboard",
    });
    if (sent.fcm === 0 && sent.web === 0) {
      return NextResponse.json(
        { error: "Tidak ada perangkat terdaftar. Buka app dulu sekali agar token terdaftar." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error("Push test gagal:", error);
    return NextResponse.json({ error: "Gagal mengirim test push." }, { status: 500 });
  }
}
