"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MayarPaymentSection } from "./mayar-payment-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MONTH_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Menunggu", variant: "outline" },
  APPROVED: { label: "Disetujui", variant: "default" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
};

const DUE_STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  lunas: { label: "Lunas", variant: "default" },
  belum: { label: "Belum Bayar", variant: "secondary" },
  menunggak: { label: "Menunggak", variant: "destructive" },
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

type ProofWithDetails = {
  id: string;
  status: string;
  fileName: string;
  filePath: string;
  createdAt: Date;
  rejectionReason: string | null;
};

type DueRow = {
  id: string;
  year: number;
  month: number;
  amount: number;
  isPaid: boolean;
  proof: ProofWithDetails | null;
  mayarInvoiceId: string | null;
};

function getDueStatus(row: DueRow, currentYear: number, currentMonth: number): "lunas" | "belum" | "menunggak" {
  if (row.isPaid) return "lunas";
  if (row.year < currentYear || (row.year === currentYear && row.month < currentMonth)) return "menunggak";
  return "belum";
}

function SubmitProofDialog({
  dueId,
  monthLabel,
  amount,
}: {
  dueId: string;
  monthLabel: string;
  amount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File | null;

    if (!file) {
      toast.error("Pilih file terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/cash/dues/proof-submit", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          toast.error(body?.error ?? "Gagal mengajukan pembayaran.");
          return;
        }

        toast.success("Bukti pembayaran berhasil diajukan!");
        setOpen(false);
        setNote("");
        // Refresh the page to show updated state
        window.location.reload();
      } catch {
        toast.error("Terjadi kesalahan. Coba lagi.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" variant="outline">
          <Upload className="mr-2 size-4" />
          Ajukan Pembayaran
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="monthlyDueId" value={dueId} />
          <DialogHeader>
            <DialogTitle>Ajukan Pembayaran</DialogTitle>
            <DialogDescription>
              Upload bukti pembayaran iuran {monthLabel} — Rp {amount.toLocaleString("id-ID")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Bukti Pembayaran *</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept="image/*,application/pdf"
                required
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Format: JPG, PNG, atau PDF. Maksimal 5 MB.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Catatan (opsional)</Label>
              <Textarea
                id="note"
                name="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tambah catatan jika perlu"
                rows={3}
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              <Upload className="mr-2 size-4" />
              {isPending ? "Mengunggah…" : "Kirim Bukti"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProofStatusDialog({
  proof,
  children,
}: {
  proof: ProofWithDetails;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Bukti Pembayaran</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">File:</span>
            <span className="font-medium">{proof.fileName}</span>
            <span className="text-muted-foreground">Status:</span>
            <span>
              <Badge variant={STATUS_LABELS[proof.status]?.variant ?? "outline"}>
                {STATUS_LABELS[proof.status]?.label ?? proof.status}
              </Badge>
            </span>
            <span className="text-muted-foreground">Diajukan:</span>
            <span>{proof.createdAt.toLocaleDateString("id-ID", { dateStyle: "medium" })}</span>
            {proof.rejectionReason && (
              <>
                <span className="text-muted-foreground">Alasan Penolakan:</span>
                <span className="text-destructive">{proof.rejectionReason}</span>
              </>
            )}
          </div>
          <Button variant="outline" size="sm" render={<a href={proof.filePath} target="_blank" rel="noopener noreferrer">Lihat Bukti</a>}>
            <FileText className="mr-2 size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProofSubmitClient({ initialDues }: { initialDues: DueRow[] }) {
  const [rows] = useState<DueRow[]>(initialDues);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Pick the first unpaid due without a proof to show the Mayar payment section
  const mayarDue = rows.find(
    (r) => !r.isPaid && !r.proof
  );

  // Build the table with all dues
  const tableRows = rows.map((row) => {
    const dueStatus = getDueStatus(row, currentYear, currentMonth);
    const statusInfo = DUE_STATUS_LABELS[dueStatus];
    return (
      <TableRow key={row.id}>
        <TableCell className="font-medium">
          {MONTH_LABELS[row.month - 1]} {row.year}
        </TableCell>
        <TableCell>Rp {row.amount.toLocaleString("id-ID")}</TableCell>
        <TableCell>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </TableCell>
        <TableCell>
          {row.proof ? (
            <div className="flex flex-col gap-1">
              <Badge variant={STATUS_LABELS[row.proof.status]?.variant ?? "outline"}>
                {STATUS_LABELS[row.proof.status]?.label ?? row.proof.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{row.proof.fileName}</span>
              <ProofStatusDialog proof={row.proof}>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                >
                  Lihat Detail
                </button>
              </ProofStatusDialog>
            </div>
          ) : row.isPaid ? (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <CheckCircle className="size-3.5" />
              Lunas
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          {!row.isPaid && !row.proof && (
            <SubmitProofDialog
              dueId={row.id}
              monthLabel={`${MONTH_LABELS[row.month - 1]} ${row.year}`}
              amount={row.amount}
            />
          )}
        </TableCell>
      </TableRow>
    );
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pengajuan Pembayaran Iuran</h1>
        <p className="text-sm text-muted-foreground">
          Upload bukti pembayaran atau bayar langsung via QRIS
        </p>
      </div>

      {/* Mayar Online Payment — first unpaid row only */}
      {mayarDue && (
        <MayarPaymentSection due={mayarDue} />
      )}

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Belum ada data iuran untuk rumah Anda. Hubungi bendahara.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Iuran</CardTitle>
            <CardDescription>Status pembayaran iuran bulanan Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bulan / Tahun</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bukti Pembayaran</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{tableRows}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
