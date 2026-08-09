"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AlertRow = {
  id: string;
  userName: string;
  houseBlock: string;
  message: string | null;
  status: string;
  resolvedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "short", timeStyle: "short" });
}

export function EmergencyList({ open, recent }: { open: AlertRow[]; recent: AlertRow[] }) {
  const router = useRouter();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  async function resolve(id: string) {
    setResolvingId(id);
    try {
      const res = await fetch(`/api/emergency/${id}`, { method: "PATCH" });
      if (!res.ok) {
        toast.error("Gagal menandai selesai.");
        return;
      }
      toast.success("Sinyal darurat ditandai selesai.");
      router.refresh();
    } catch {
      toast.error("Gagal menandai selesai.");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Aktif ({open.length})</h2>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada sinyal darurat aktif. 👍</p>
        ) : (
          <div className="space-y-2">
            {open.map((alert) => (
              <Card key={alert.id} className="border-red-500/50 bg-red-500/5">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-red-600">🚨 {alert.houseBlock}</Badge>
                      <span className="font-medium">{alert.userName}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(alert.createdAt)}</span>
                    </div>
                    {alert.message && <p className="text-sm">{alert.message}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resolvingId === alert.id}
                    onClick={() => resolve(alert.id)}
                  >
                    {resolvingId === alert.id ? "Memproses..." : "Tandai Selesai"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Riwayat</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-5">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline">{alert.houseBlock}</Badge>
                    <span>{alert.userName}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(alert.createdAt)}</span>
                    {alert.resolvedBy && (
                      <span className="text-xs text-muted-foreground">
                        · selesai oleh {alert.resolvedBy}
                      </span>
                    )}
                  </div>
                  {alert.message && <span className="text-sm text-muted-foreground">{alert.message}</span>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
