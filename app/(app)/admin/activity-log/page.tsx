import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { EmptyState } from "@/components/shared/empty-state";
import { ActivityLogList } from "@/components/admin/activity-log-list";
import { History } from "lucide-react";

export const metadata: Metadata = { title: "Log Aktivitas" };

export default async function ActivityLogPage() {
  await requireAdmin();

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Log Aktivitas</h1>
        <p className="text-sm text-muted-foreground">Riwayat tindakan admin — 200 aktivitas terakhir</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={History} title="Belum ada aktivitas" description="Riwayat tindakan admin akan muncul di sini." />
      ) : (
        <ActivityLogList logs={logs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() }))} />
      )}
    </div>
  );
}
