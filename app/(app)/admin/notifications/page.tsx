import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireBendahara } from "@/lib/session";
import { BroadcastForm } from "@/components/admin/broadcast-form";
import { BroadcastReadStats } from "@/components/admin/broadcast-read-stats";

export const metadata: Metadata = { title: "Kirim Pengumuman" };

export default async function AdminNotificationsPage() {
  await requireBendahara();
  const [wargaCount, broadcasts] = await Promise.all([
    prisma.user.count({ where: { role: "WARGA" } }),
    prisma.notification.groupBy({
      by: ["broadcastId", "title"],
      where: { broadcastId: { not: null } },
      _count: { _all: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
      take: 20,
    }),
  ]);

  // Broadcast modern pakai broadcastId -> hitung read/unread; yang lama null diabaikan
  const broadcastList = broadcasts
    .filter((b) => b.broadcastId)
    .map((b) => ({
      id: b.broadcastId!,
      title: b.title,
      createdAt: b._max.createdAt?.toISOString() ?? "",
      total: b._count._all,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kirim Pengumuman</h1>
        <p className="text-sm text-muted-foreground">
          Kirim notifikasi ke seluruh warga — muncul di lonceng notifikasi aplikasi, dan di APK sebagai
          push notification saat aplikasi dibuka.
        </p>
      </div>

      <BroadcastForm wargaCount={wargaCount} />

      <BroadcastReadStats broadcasts={broadcastList} />
    </div>
  );
}
