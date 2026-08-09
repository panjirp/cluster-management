import Link from "next/link";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { BackLink } from "@/components/shared/back-link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Kartu Warga Digital" };

export default async function ProfileQrPage() {
  const session = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { house: { select: { blockNumber: true } } },
  });

  if (!user) return null;

  const payload = JSON.stringify({
    type: "BC_WARGA",
    name: user.name,
    email: user.email,
    house: user.house?.blockNumber ?? null,
  });
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 280,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1c1917", light: "#ffffff" },
  });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <BackLink href="/profile" label="Kembali ke Profil" />

      <div>
        <h1 className="text-2xl font-semibold">Kartu Warga Digital</h1>
        <p className="text-sm text-muted-foreground">
          Tunjukkan QR ini kepada satpam / petugas saat diminta
        </p>
      </div>

      {/* Kartu */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_20px_60px_-30px_color-mix(in_oklab,var(--primary)_40%,transparent)]">
        {/* Header maroon */}
        <div className="flex items-center justify-between bg-[#4a1017] px-5 py-4 text-white">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase opacity-80">
              Barcelona Cove
            </p>
            <p className="text-sm font-bold">KARTU WARGA DIGITAL</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="Barcelona Cove"
            className="size-10 rounded-xl bg-white/10 p-1"
          />
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
            {user.house && <Badge variant="secondary">{user.house.blockNumber}</Badge>}
          </div>

          <div className="flex justify-center rounded-xl border bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code Kartu Warga" className="size-64" />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Scan untuk verifikasi identitas warga Barcelona Cove
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" render={<Link href="/profile">Kembali ke Profil</Link>}>
          <QrCode className="size-4" />
          Kelola Profil
        </Button>
      </div>
    </div>
  );
}
