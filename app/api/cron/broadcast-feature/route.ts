import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/web-push";

export async function POST(request: NextRequest) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const warga = await prisma.user.findMany({
    where: { role: "WARGA" },
    select: { id: true },
  });

  const title = "📢 Fitur Baru Portal Barcelona Cove";
  const body = `1. Info Cuaca Real-Time ☀️ — cek cuaca, suhu, kualitas udara, & UV.
2. Status Lalu Lintas Perlintasan Kereta 🚂 — macet/lancar di Jl. Selang Cironggeng.
3. Jadwal KRL Metland Telaga Murni 🚆 — 5 keberangkatan berikutnya.
4. Pembayaran Iuran Bulanan 💰 — upload bukti bayar langsung dari HP.`;

  const url = "/dashboard";

  await prisma.notification.createMany({
    data: warga.map((w) => ({
      userId: w.id,
      title,
      body,
      url,
    })),
  });

  const userIds = warga.map((w) => w.id);
  await sendPushToUsers(userIds, { title, body, url }).catch(() => {});

  return NextResponse.json({ sent: warga.length });
}
