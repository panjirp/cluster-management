import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/web-push";
import { REMINDER_DAYS, BODIES, REMINDER_HOUR, REMINDER_MINUTE } from "@/lib/reminder-schedule";

/**
 * POST /api/cron/dues-reminders?force=1
 * Dipanggil systemd timer setiap tanggal 1, 10, 25 jam 07:00.
 * SERVER yang mengirim pengingat iuran kas → FCM ke perangkat warga yang
 * BELUM membayar iuran bulan berjalan (yang sudah bayar otomatis dilewati).
 *
 * Keamanan: header `x-cron-secret` wajib sama dengan env CRON_SECRET.
 * `force=1` dipakai untuk test manual (kirim walau bukan tgl 1/10/25).
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const force = req.nextUrl.searchParams.get("force") === "1";
    const day = now.getDate();

    if (!force && !(REMINDER_DAYS as readonly number[]).includes(day)) {
      return NextResponse.json({ ok: true, skipped: true, reason: `Tanggal ${day} bukan hari pengingat (1/10/25)` });
    }

    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Semua rumah yang BELUM bayar iuran bulan berjalan
    const unpaidHouses = await prisma.monthlyDue.findMany({
      where: { year, month, isPaid: false },
      select: { houseId: true },
    });
    const houseIds = Array.from(new Set(unpaidHouses.map((h) => h.houseId)));

    // Warga pemilik rumah tersebut (yang punya akun)
    const warga = await prisma.user.findMany({
      where: { role: "WARGA", houseId: { in: houseIds } },
      select: { id: true },
    });
    const userIds = warga.map((u) => u.id);

    const title = "💸 Iuran Kas Barcelona Cove";
    const body = BODIES[day] ?? "Jangan lupa bayar iuran kas bulan ini ya. Terima kasih 🙏";

    // Push: FCM + Web Push langsung (silent skip jika belum dikonfigurasi)
    const sent = await sendPushToUsers(userIds, { title, body, url: "/cash/dues" });

    return NextResponse.json({
      ok: true,
      date: now.toISOString(),
      day,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
      unpaidHouses: houseIds.length,
      targetWarga: userIds.length,
      fcmSent: sent,
      fcmConfigured: Boolean(process.env.FCM_SERVICE_ACCOUNT_PATH),
    });
  } catch (error) {
    console.error("Cron dues-reminders gagal:", error);
    return NextResponse.json({ error: "Cron gagal." }, { status: 500 });
  }
}
