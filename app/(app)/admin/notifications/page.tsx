import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireBendahara } from "@/lib/session";
import { BroadcastForm } from "@/components/admin/broadcast-form";

export const metadata: Metadata = { title: "Kirim Pengumuman" };

export default async function AdminNotificationsPage() {
  await requireBendahara();
  const wargaCount = await prisma.user.count({ where: { role: "WARGA" } });

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
    </div>
  );
}
