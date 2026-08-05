"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, QrCode, CheckCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type MayarInvoice = {
  ok: boolean;
  invoiceId: string;
  paymentUrl: string;
  qrUrl: string;
  status: string;
  existing?: boolean;
};

type DueRow = {
  id: string;
  year: number;
  month: number;
  amount: number;
  isPaid: boolean;
  mayarInvoiceId: string | null;
  proof?: { status: string; fileName: string; filePath: string; createdAt: Date; rejectionReason: string | null } | null;
};

const MONTH_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function MayarPaymentDialog({
  due,
  onPaymentSuccess,
}: {
  due: DueRow;
  onPaymentSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<MayarInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateInvoice() {
    setLoading(true);
    setError(null);
    setInvoice(null);
    try {
      const res = await fetch("/api/mayar/invoice/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyDueId: due.id }),
      });

      const data = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

      if (!res.ok) {
        throw new Error(
          (data.error as string) || "Gagal membuat invoice Mayar."
        );
      }

      setInvoice(data as MayarInvoice);
      toast.success("Invoice berhasil dibuat!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenPayment() {
    if (!invoice?.paymentUrl) return;
    try {
      await navigator.clipboard.writeText(invoice.paymentUrl);
      toast.success("Link pembayaran disalin!");
    } catch {
      // Fallback: open in new tab
      window.open(invoice.paymentUrl, "_blank", "noopener");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="size-4" />
          Pembayaran Online — Mayar
        </CardTitle>
        <CardDescription>
          Bayar iuran {MONTH_LABELS[due.month - 1]} {due.year} —{" "}
          {formatRupiah(due.amount)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invoice ? (
          <div className="space-y-4">
            <Badge
              variant={invoice.status === "PAID" ? "default" : "outline"}
            >
              {invoice.status === "PAID" ? "Lunas ✅" : "Menunggu Pembayaran"}
            </Badge>

            {invoice.qrUrl && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={invoice.qrUrl}
                  alt="QRIS Pembayaran"
                  className="size-48 rounded-lg border"
                />
                <p className="text-xs text-muted-foreground">
                  Scan QRIS dengan aplikasi pembayaran Anda
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {invoice.paymentUrl && (
                <Button
                  size="sm"
                  onClick={handleOpenPayment}
                >
                  <ExternalLink className="mr-2 size-4" />
                  Buka Halaman Pembayaran
                </Button>
              )}
              {invoice.qrUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(invoice.qrUrl, "_blank", "noopener")}
                >
                  <QrCode className="mr-2 size-4" />
                  Lihat QRIS
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setInvoice(null);
                  onPaymentSuccess();
                }}
              >
                <CheckCircle className="mr-2 size-4" />
                Sudah Bayar? Refresh
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleCreateInvoice}
            disabled={loading}
            className="w-full"
          >
            <CreditCard className="mr-2 size-4" />
            {loading ? "Membuat Invoice…" : "Bayar dengan Mayar"}
          </Button>
        )}

        {error && (
          <p className="text-sm text-destructive">Error: {error}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function MayarPaymentSection({ due }: { due: DueRow }) {
  const [key, setKey] = useState(0);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Pembayaran Online</h3>
        <p className="text-sm text-muted-foreground">
          Bayar iuran melalui Mayar — QRIS / transfer bank
        </p>
      </div>

      <MayarPaymentDialog
        key={key}
        due={due}
        onPaymentSuccess={() => {
          setKey((k) => k + 1);
          window.location.reload();
        }}
      />
    </div>
  );
}
