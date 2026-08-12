import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireBendahara } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { ProofImagePreview } from "@/components/cash/proof-image-preview";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Menunggu", variant: "outline" },
  APPROVED: { label: "Disetujui", variant: "default" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
};

const MONTH_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

// Aksi per bukti (Setujui/Tolak | Lihat/Download | alasan penolakan)
function ProofActions({ proof }: { proof: any }) {
  if (proof.status === "PENDING") {
    return (
      <>
        <form action={`/api/cash/payment-proofs/${proof.id}/review`} method="POST">
          <input type="hidden" name="status" value="APPROVED" />
          <Button type="submit" size="xs" className="bg-green-600 text-white hover:bg-green-700">
            <CheckCircle className="mr-1 size-3" />
            Setujui
          </Button>
        </form>
        <form action={`/api/cash/payment-proofs/${proof.id}/review`} method="POST" className="flex items-center gap-1">
          <input type="hidden" name="status" value="REJECTED" />
          <input
            type="text"
            name="rejectionReason"
            placeholder="Alasan penolakan"
            className="h-7 w-36 rounded-md border border-input bg-background px-2 text-xs"
            required
          />
          <Button type="submit" size="xs" variant="destructive" className="ml-1">
            <XCircle className="mr-1 size-3" />
            Tolak
          </Button>
        </form>
      </>
    );
  }
  if (proof.status === "APPROVED") {
    return (
      <>
        <Button variant="outline" size="xs" render={<a href={proof.filePath} target="_blank" rel="noopener noreferrer">Lihat Bukti</a>}>
          <FileText className="mr-1 size-3" />
        </Button>
        <Button variant="secondary" size="xs" render={<a href={proof.filePath} download={proof.fileName}>Download</a>}>
          <Download className="mr-1 size-3" />
        </Button>
      </>
    );
  }
  if (proof.rejectionReason) {
    return (
      <span className="text-xs text-destructive" title={proof.rejectionReason}>
        {proof.rejectionReason.length > 30 ? proof.rejectionReason.slice(0, 30) + "…" : proof.rejectionReason}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}

export const metadata: Metadata = {
  title: "Review Bukti Pembayaran",
  description: "Review bukti pembayaran kas warga",
};

export default async function PaymentProofsPage() {
  await requireBendahara();

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [proofs, pendingCount, approvedThisMonth, rejectedThisMonth] = await Promise.all([
    prisma.paymentProof.findMany({
      where: {},
      orderBy: { createdAt: "desc" },
      include: {
        monthlyDue: {
          include: {
            house: {
              select: { blockNumber: true },
            },
          },
        },
        submittedBy: {
          select: { name: true },
        },
      },
    }),
    prisma.paymentProof.count({ where: { status: "PENDING" } }),
    prisma.paymentProof.count({
      where: {
        status: "APPROVED",
        reviewedAt: { gte: thisMonthStart },
      },
    }),
    prisma.paymentProof.count({
      where: {
        status: "REJECTED",
        reviewedAt: { gte: thisMonthStart },
      },
    }),
  ]);

  const stats = [
    {
      label: "Menunggu Review",
      value: pendingCount,
      icon: Clock,
    },
    {
      label: "Disetujui (Bulan Ini)",
      value: approvedThisMonth,
      icon: CheckCircle,
    },
    {
      label: "Ditolak (Bulan Ini)",
      value: rejectedThisMonth,
      icon: XCircle,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Review Bukti Pembayaran</h1>
        <p className="text-sm text-muted-foreground">Verifikasi bukti pembayaran kas warga</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <stat.icon className="size-4" />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Proofs table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Semua Bukti Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          {proofs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Belum ada bukti pembayaran yang diajukan.
            </div>
          ) : (
            <>
              {/* Compact: kartu untuk HP potrait & landscape (hingga 1023px) */}
              <div className="grid grid-cols-1 gap-2 lg:hidden sm:grid-cols-2">
                {proofs.map((proof) => {
                  const { monthlyDue } = proof;
                  const monthLabel = monthlyDue
                    ? `${MONTH_LABELS[monthlyDue.month - 1]} ${monthlyDue.year}`
                    : "—";
                  return (
                    <div key={proof.id} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {monthlyDue?.house?.blockNumber ?? "—"}
                        </span>
                        <Badge variant={STATUS_LABELS[proof.status]?.variant ?? "outline"}>
                          {STATUS_LABELS[proof.status]?.label ?? proof.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        <span className="text-muted-foreground">Pengaju</span>
                        <span className="truncate font-medium">{proof.submittedBy?.name ?? "—"}</span>
                        <span className="text-muted-foreground">Bulan Iuran</span>
                        <span>{monthLabel}</span>
                        <span className="text-muted-foreground">Nominal</span>
                        <span className="font-medium">{monthlyDue ? formatRupiah(monthlyDue.amount) : "—"}</span>
                        <span className="text-muted-foreground">Diajukan</span>
                        <span>{formatDate(proof.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ProofImagePreview filePath={proof.filePath} fileName={proof.fileName} />
                        <span className="truncate text-xs text-muted-foreground">{proof.fileName}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <ProofActions proof={proof} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: tabel */}
              <div className="hidden overflow-x-auto rounded-lg border lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rumah</TableHead>
                      <TableHead>Pengaju</TableHead>
                      <TableHead>Bulan Iuran</TableHead>
                      <TableHead>Nominal</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Submit</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proofs.map((proof) => {
                      const { monthlyDue } = proof;
                      const monthLabel = monthlyDue
                        ? `${MONTH_LABELS[monthlyDue.month - 1]} ${monthlyDue.year}`
                        : "—";

                      return (
                        <TableRow key={proof.id}>
                          <TableCell className="font-medium">
                            {monthlyDue?.house?.blockNumber ?? "—"}
                          </TableCell>
                          <TableCell>{proof.submittedBy?.name ?? "—"}</TableCell>
                          <TableCell>{monthLabel}</TableCell>
                          <TableCell>
                            {monthlyDue ? formatRupiah(monthlyDue.amount) : "—"}
                          </TableCell>
                          <TableCell>
                            <ProofImagePreview filePath={proof.filePath} fileName={proof.fileName} />
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_LABELS[proof.status]?.variant ?? "outline"}>
                              {STATUS_LABELS[proof.status]?.label ?? proof.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(proof.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <ProofActions proof={proof} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
