"use client";

import { QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Pembayaran online (QRIS) — sementara dinonaktifkan.
 * API Mayar belum aktif; tampilkan "Coming Soon" sampai payment gateway siap.
 */
export function MayarPaymentSection() {
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
      <CardContent>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="rounded-full bg-muted p-4">
            <QrCode className="size-8 text-muted-foreground" />
          </div>
          <Badge variant="secondary" className="px-4 py-1">
            Coming Soon 🚧
          </Badge>
          <p className="max-w-sm text-sm text-muted-foreground">
            Pembayaran iuran via QRIS akan segera hadir. Untuk saat ini,
            silakan menghubungi bendahara untuk info pembayaran.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
