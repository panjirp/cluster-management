"use client";

import { QrCode, Landmark, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Pembayaran iuran via transfer ke rekening bendahara.
 * QRIS (Mayar) belum aktif — badge "Coming Soon" tetap tampil,
 * sementara ini arahkan warga ke transfer ke bendahara.
 */
const TREASURER_BANK = "Bank Mandiri";
const TREASURER_ACCOUNT = "1230006040572";
const TREASURER_NAME = "Rahmat Saptowo Nugroho";

export function MayarPaymentSection() {
  const [copied, setCopied] = useState(false);

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(TREASURER_ACCOUNT);
      setCopied(true);
      toast.success("Nomor rekening disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin. Salin manual: " + TREASURER_ACCOUNT);
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="size-4" />
          Pembayaran Online — QRIS
        </CardTitle>
        <CardDescription>
          Bayar iuran secara online melalui QRIS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="rounded-full bg-muted p-4">
            <QrCode className="size-8 text-muted-foreground" />
          </div>
          <Badge variant="secondary" className="px-4 py-1">
            Coming Soon 🚧
          </Badge>
          <p className="max-w-sm text-sm text-muted-foreground">
            Pembayaran iuran via QRIS akan segera hadir.
          </p>
        </div>

        {/* Sementara: transfer manual ke bendahara */}
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
            <Landmark className="size-4 text-muted-foreground" />
            Sementara, transfer ke bendahara:
          </p>
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">Bank</span>
            <span className="font-medium">{TREASURER_BANK}</span>
            <span className="text-muted-foreground">No. Rekening</span>
            <span className="flex items-center gap-2 font-mono text-base font-semibold tracking-wide">
              {TREASURER_ACCOUNT}
              <button
                type="button"
                onClick={copyAccount}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Salin nomor rekening"
              >
                {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
              </button>
            </span>
            <span className="text-muted-foreground">Atas Nama</span>
            <span className="font-medium">{TREASURER_NAME}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Setelah transfer, tekan <span className="font-medium text-foreground">"Ajukan Pembayaran"</span> pada
          bulan yang ingin dibayar dan unggah bukti transfer. Bendahara akan memverifikasi.
        </p>
      </CardContent>
    </Card>
  );
}