import QRCode from "qrcode";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Car, Bike, Clock, User, X } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { BackLink } from "@/components/shared/back-link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RevokeButton } from "@/components/guest-passes/revoke-button";

export const metadata: Metadata = { title: "Detail Pass Tamu" };

const vehicleLabels: Record<string, string> = { MOBIL: "Mobil", MOTOR: "Motor", LAINNYA: "Lainnya" };

export default async function GuestPassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  const pass = await prisma.guestPass.findUnique({
    where: { id },
    include: { house: { select: { blockNumber: true } } },
  });
  if (!pass) notFound();
  if (pass.hostId !== session.user.id && session.user.role !== "ADMIN") redirect("/guest-passes");

  const qrPayload = JSON.stringify({ type: "BC_GUEST_PASS", code: pass.code });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 280,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1c1917", light: "#ffffff" },
  });

  const now = new Date();
  const expired = pass.validUntil < now;
  const isActive = pass.status === "ACTIVE" && !expired;
  const VehicleIcon = pass.vehicleType === "MOBIL" ? Car : Bike;

  const statusBadge =
    pass.status === "USED" ? (
      <Badge variant="secondary">Sudah Masuk</Badge>
    ) : pass.status === "REVOKED" ? (
      <Badge variant="secondary">Dibatalkan</Badge>
    ) : expired ? (
      <Badge variant="secondary">Kedaluwarsa</Badge>
    ) : (
      <Badge>Aktif</Badge>
    );

  return (
    <div className="mx-auto max-w-md space-y-6">
      <BackLink href="/guest-passes" label="Kembali ke Daftar" />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between bg-[#4a1017] px-5 py-4 text-white">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase opacity-80">Barcelona Cove</p>
            <p className="text-sm font-bold">PASS TAMU</p>
          </div>
          {statusBadge}
        </div>

        <CardContent className="space-y-5 p-5">
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <span className="font-semibold">{pass.guestName}</span>
              {pass.guestPhone ? <span className="text-muted-foreground">· {pass.guestPhone}</span> : null}
            </p>
            <p className="flex items-center gap-2">
              <VehicleIcon className="size-4 text-muted-foreground" />
              {vehicleLabels[pass.vehicleType]}
              {pass.plateNumber ? ` · ${pass.plateNumber}` : ""}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Berlaku s/d{" "}
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(pass.validUntil)}
            </p>
          </div>

          <div className="flex justify-center rounded-xl border bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code Pass Tamu" className="size-64" />
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">Ataau sebutkan kode ini ke satpam</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-primary">{pass.code}</p>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Keperluan: {pass.purpose}
            {pass.house ? ` · Rumah ${pass.house.blockNumber}` : ""}
          </p>

          {isActive ? (
            <RevokeButton code={pass.code} />
          ) : pass.status === "USED" && pass.scannedAt ? (
            <p className="text-center text-xs text-muted-foreground">
              Masuk gerbang pukul{" "}
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(pass.scannedAt)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="outline" render={<Link href="/guest-passes/new">
          <X className="size-4" /> Buat Pass Lain
        </Link>} />
      </div>
    </div>
  );
}
