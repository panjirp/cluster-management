import Link from "next/link";
import type { Metadata } from "next";
import { Plus, QrCode, Car, Bike, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "QR Pass Tamu" };

const vehicleLabels: Record<string, string> = { MOBIL: "Mobil", MOTOR: "Motor", LAINNYA: "Lainnya" };
const statusLabels: Record<string, string> = { ACTIVE: "Aktif", USED: "Sudah Masuk", REVOKED: "Dibatalkan" };

export default async function GuestPassesPage() {
  const session = await requireUser();
  const passes = await prisma.guestPass.findMany({
    where: { hostId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">QR Pass Tamu</h1>
          <p className="text-sm text-muted-foreground">
            Buat QR/code untuk tamu Anda — tunjukkan ke satpam di gerbang
          </p>
        </div>
        <Button render={<Link href="/guest-passes/new">
          <Plus className="size-4" /> Buat Pass
        </Link>} />
      </div>

      {passes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/20">
              <QrCode className="size-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Belum ada pass tamu. Buat pass untuk tamu yang akan berkunjung.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {passes.map((p) => {
            const expired = p.validUntil < now && p.status === "ACTIVE";
            const effectiveStatus = expired ? "Kedaluwarsa" : statusLabels[p.status] ?? p.status;
            const VehicleIcon = p.vehicleType === "MOBIL" ? Car : Bike;
            return (
              <Link key={p.id} href={`/guest-passes/${p.id}`} className="group block">
                <Card className="h-full transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-[0_8px_30px_-14px_color-mix(in_oklab,var(--primary)_40%,transparent)]">
                  <CardContent className="space-y-3 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold group-hover:text-primary">{p.guestName}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.purpose}</p>
                      </div>
                      <Badge variant={p.status === "ACTIVE" && !expired ? "default" : "secondary"}>
                        {effectiveStatus}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <VehicleIcon className="size-3.5" /> {vehicleLabels[p.vehicleType]}
                        {p.plateNumber ? ` · ${p.plateNumber}` : ""}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" />
                        Berlaku s/d{" "}
                        {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(p.validUntil)}
                      </span>
                    </div>
                    <p className="font-mono text-sm font-bold tracking-widest text-primary">{p.code}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
