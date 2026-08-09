import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireBendahara } from "@/lib/session";
import { EmergencyList } from "@/components/admin/emergency-list";
import { EmergencyPhoneSetting } from "@/components/admin/emergency-phone-setting";

export const metadata: Metadata = { title: "Sinyal Darurat" };

export default async function AdminEmergencyPage() {
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
  const setting = await prisma.setting.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });

  const toRow = (a: (typeof open)[number]) => ({
    id: a.id,
    userName: a.userName,
    houseBlock: a.houseBlock,
    message: a.message,
    status: a.status,
    resolvedBy: a.resolvedBy,
    createdAt: a.createdAt.toISOString(),
    resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sinyal Darurat</h1>
        <p className="text-sm text-muted-foreground">Notifikasi darurat dari warga yang menekan tombol darurat</p>
      </div>

      <EmergencyPhoneSetting currentPhone={setting.emergencyNotifyPhone ?? null} />

      <EmergencyList open={open.map(toRow)} recent={recent.map(toRow)} />
    </div>
  );
}
