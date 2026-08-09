import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

/**
 * Ambil notifikasi terbaru user — dipakai service worker untuk menampilkan
 * push di iOS (iOS TIDAK mengirim payload data pada event push, jadi SW
 * mengambil pesan dari server lewat endpoint ini, same-origin + session cookie).
 */
export async function GET() {
  const session = await requireUser();
  const latest = await prisma.notification.findFirst({
    where: { userId: session.user.id, read: false },
    orderBy: { createdAt: "desc" },
    select: { title: true, body: true, url: true, createdAt: true },
  });

  return NextResponse.json({
    title: latest?.title ?? "Barcelona Cove Portal",
    body: latest?.body ?? "Ada notifikasi baru untuk Anda.",
    url: latest?.url ?? "/",
    createdAt: latest?.createdAt ?? new Date().toISOString(),
  });
}
