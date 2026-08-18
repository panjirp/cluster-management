import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireBendahara } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export const metadata: Metadata = { title: "Log Akses Kendaraan" };

export const dynamic = "force-dynamic";

export default async function AccessLogAdminPage() {
  await requireBendahara();

  const [logs, regs] = await Promise.all([
    prisma.vehicleAccess.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { house: { select: { blockNumber: true, residentName: true } } },
    }),
    prisma.vehicleRegistration.findMany({
      orderBy: { createdAt: "desc" },
      include: { house: { select: { blockNumber: true, residentName: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Car className="size-6 text-primary" /> Log Akses Kendaraan
        </h1>
        <p className="text-sm text-muted-foreground">
          Riwayat kendaraan yang melewati gerbang (dari CCTV/boomgate).
        </p>
      </div>

      {/* Whitelist */}
      <Card>
        <CardContent className="py-4">
          <h2 className="mb-3 font-semibold">Whitelist Plat Terdaftar ({regs.length})</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {regs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada plat terdaftar.</p>
            ) : (
              regs.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                  <span className="font-mono font-semibold">{r.plateNumber}</span>
                  <span className="text-muted-foreground">
                    {r.house.blockNumber}{r.house.residentName ? ` · ${r.house.residentName}` : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log akses */}
      <div className="space-y-2">
        <h2 className="font-semibold">Aktivitas Terbaru ({logs.length})</h2>
        {logs.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Belum ada akses kendaraan.</CardContent></Card>
        ) : (
          logs.map((l) => (
            <Card key={l.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <div className={`grid size-9 place-items-center rounded-lg ${l.direction === "MASUK" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                  {l.direction === "MASUK" ? <ArrowDownToLine className="size-4" /> : <ArrowUpFromLine className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono font-semibold">{l.plateNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.direction}{l.house ? ` · ${l.house.blockNumber}${l.house.residentName ? ` (${l.house.residentName})` : ""}` : " · tidak terdaftar"}
                  </p>
                </div>
                <Badge variant={l.status === "DIBUKA" ? "default" : "destructive"}>{l.status === "DIBUKA" ? "Dibuka" : "Ditolak"}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(l.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
