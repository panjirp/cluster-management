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

export const metadata: Metadata = {
  title: "Review Bukti Pembayaran",
  description: "Review bukti pembayaran iuran warga",
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
        <p className="text-sm text-muted-foreground">Verifikasi bukti pembayaran iuran warga</p>
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
                      <TableCell className="max-w-[180px] truncate text-sm" title={proof.fileName}>
                        {proof.fileName}
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
                        {proof.status === "PENDING" ? (
                          <div className="flex flex-wrap gap-2">
                            {/* Approve form */}
                            <form action={`/api/cash/payment-proofs/${proof.id}/review`} method="POST">
                              <input type="hidden" name="status" value="APPROVED" />
                              <Button
                                type="submit"
                                size="xs"
                                className="bg-green-600 text-white hover:bg-green-700"
                              >
                                <CheckCircle className="mr-1 size-3" />
                                Setujui
                              </Button>
                            </form>
                            {/* Reject form */}
                            <form action={`/api/cash/payment-proofs/${proof.id}/review`} method="POST">
                              <input type="hidden" name="status" value="REJECTED" />
                              <input
                                type="text"
                                name="rejectionReason"
                                placeholder="Alasan penolakan"
                                className="h-7 w-36 rounded-md border border-input bg-background px-2 text-xs"
                                required
                              />
                              <Button
                                type="submit"
                                size="xs"
                                variant="destructive"
                                className="ml-1"
                              >
                                <XCircle className="mr-1 size-3" />
                                Tolak
                              </Button>
                            </form>
                          </div>
                        ) : proof.status === "APPROVED" ? (
                          <div className="flex gap-2">
                            <Button variant="outline" size="xs" render={<a href={proof.filePath} target="_blank" rel="noopener noreferrer">Lihat Bukti</a>}>
                              <FileText className="mr-1 size-3" />
                            </Button>
                            <Button variant="secondary" size="xs" render={<a href={proof.filePath} download={proof.fileName}>Download</a>}>
                              <Download className="mr-1 size-3" />
                            </Button>
                          </div>
                        ) : proof.rejectionReason ? (
                          <span className="text-xs text-destructive" title={proof.rejectionReason}>
                            {proof.rejectionReason.length > 30
                              ? proof.rejectionReason.slice(0, 30) + "…"
                              : proof.rejectionReason}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
