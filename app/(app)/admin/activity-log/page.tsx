import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { History } from "lucide-react";

export const metadata: Metadata = { title: "Log Aktivitas" };

const actionLabels: Record<string, string> = {
  UPDATE_COMPLAINT_STATUS: "Pengaduan",
  UPDATE_PERMIT_STATUS: "Perizinan",
  DELETE_RESIDENT: "Warga",
  DELETE_HOUSE: "Rumah",
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

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
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm">
                    <span className="font-medium">{log.actorName}</span> — {log.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {actionLabels[log.action] ?? log.action} · {formatDateTime(log.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
