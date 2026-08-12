'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MayarPaymentSection } from './mayar-payment-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MONTH_LABELS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Menunggu', variant: 'outline' },
  APPROVED: { label: 'Disetujui', variant: 'default' },
  REJECTED: { label: 'Ditolak', variant: 'destructive' },
};

const DUE_STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  lunas: { label: 'Lunas', variant: 'default' },
  belum: { label: 'Belum Bayar', variant: 'secondary' },
  menunggak: { label: 'Menunggak', variant: 'destructive' },
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
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

function getDueStatus(row: DueRow, currentYear: number, currentMonth: number): 'lunas' | 'belum' | 'menunggak' {
  if (row.isPaid) return 'lunas';
  if (row.year < currentYear || (row.year === currentYear && row.month < currentMonth)) return 'menunggak';
  return 'belum';
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
  const [note, setNote] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File | null;

    if (!file) {
      toast.error('Pilih file terlebih dahulu.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/cash/dues/proof-submit', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          toast.error(body?.error ?? 'Gagal mengajukan pembayaran.');
          return;
        }

        toast.success('Bukti pembayaran berhasil diajukan!');
        setOpen(false);
        setNote('');
        window.location.reload();
      } catch {
        toast.error('Terjadi kesalahan. Coba lagi.');
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
              Upload bukti pembayaran kas {monthLabel} — Rp {amount.toLocaleString('id-ID')}
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
              {isPending ? 'Mengunggah…' : 'Kirim Bukti'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Inline card untuk lihat bukti (bukan dialog)
function ProofCard({ proof }: { proof: ProofWithDetails }) {
  const [expanded, setExpanded] = useState(false);
  const isImage = /\.(jpe?g|png|webp|gif)$/i.test(proof.filePath ?? '');

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="truncate">{proof.fileName}</span>
        <Badge variant={STATUS_LABELS[proof.status]?.variant ?? 'outline'}>
          {STATUS_LABELS[proof.status]?.label ?? proof.status}
        </Badge>
        <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => setExpanded(!expanded)}>
          <Eye className="size-3 mr-1" />
          {expanded ? 'Tutup' : 'Lihat'}
        </Button>
      </div>

      {expanded && (
        <Card className="overflow-hidden border-muted">
          {isImage ? (
            <div className="flex justify-center bg-muted/20 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proof.filePath}
                alt={proof.fileName ?? 'Bukti pembayaran'}
                className="max-h-48 w-auto rounded-md object-contain"
              />
            </div>
          ) : null}
          <CardContent className="p-3 text-xs space-y-1">
            <div><span className="text-muted-foreground">Status:</span> {STATUS_LABELS[proof.status]?.label ?? proof.status}</div>
            <div><span className="text-muted-foreground">Diajukan:</span> {proof.createdAt.toLocaleDateString('id-ID', { dateStyle: 'medium' })}</div>
            {proof.rejectionReason && (
              <div><span className="text-muted-foreground">Alasan:</span> <span className="text-destructive">{proof.rejectionReason}</span></div>
            )}
            <div className="flex gap-2 pt-1">
              {isImage && (
                <Button variant="outline" size="sm" render={<a href={proof.filePath} download={proof.fileName}>Download</a>}>
                  <Download className="mr-1 size-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ProofSubmitClient({ initialDues }: { initialDues: DueRow[] }) {
  const [rows] = useState<DueRow[]>(initialDues);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const tableRows = rows.map((row) => {
    const dueStatus = getDueStatus(row, currentYear, currentMonth);
    const statusInfo = DUE_STATUS_LABELS[dueStatus];
    return (
      <TableRow key={row.id}>
        <TableCell className="font-medium">
          {MONTH_LABELS[row.month - 1]} {row.year}
        </TableCell>
        <TableCell>Rp {row.amount.toLocaleString('id-ID')}</TableCell>
        <TableCell>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </TableCell>
        <TableCell>
          {row.proof ? (
            <ProofCard proof={row.proof} />
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
      <MayarPaymentSection />

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Belum ada data kas untuk rumah Anda. Hubungi bendahara.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Iuran</CardTitle>
            <CardDescription>Status pembayaran kas bulanan Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Compact: kartu untuk HP potrait & landscape (hingga 1023px), tabel di desktop */}
            <div className="grid grid-cols-1 gap-2 lg:hidden sm:grid-cols-2">
              {rows.map((row) => {
                const dueStatus = getDueStatus(row, currentYear, currentMonth);
                const statusInfo = DUE_STATUS_LABELS[dueStatus];
                return (
                  <div key={row.id} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {MONTH_LABELS[row.month - 1]} {row.year}
                      </span>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Rp {row.amount.toLocaleString('id-ID')}</span>
                      {row.proof ? (
                        <Badge variant={STATUS_LABELS[row.proof.status]?.variant ?? 'outline'}>
                          {STATUS_LABELS[row.proof.status]?.label ?? row.proof.status}
                        </Badge>
                      ) : row.isPaid ? (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CheckCircle className="size-3.5" /> Lunas
                        </span>
                      ) : null}
                    </div>
                    {row.proof && <ProofCard proof={row.proof} />}
                    {!row.isPaid && !row.proof && (
                      <SubmitProofDialog
                        dueId={row.id}
                        monthLabel={`${MONTH_LABELS[row.month - 1]} ${row.year}`}
                        amount={row.amount}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop: tabel */}
            <div className="hidden overflow-x-auto rounded-lg border lg:block">
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
