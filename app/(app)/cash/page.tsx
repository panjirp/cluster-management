import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CashChart } from "@/components/cash/cash-chart";
import { TransactionsTable, type TransactionRow } from "@/components/cash/transactions-table";
import { ImportSheetDialog } from "@/components/cash/import-sheet-dialog";
import { buildMonthlySummary, computeTotals } from "@/lib/cash";

export const metadata: Metadata = { title: "Uang Kas" };

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default async function CashPage() {
  const session = await requireUser();
  const isBendahara = session.user.role === "BENDAHARA";

  const [transactions, setting] = await Promise.all([
    prisma.cashTransaction.findMany({ orderBy: { date: "desc" } }),
    isBendahara
      ? prisma.setting.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } })
      : null,
  ]);
  const totals = computeTotals(transactions);
  const chartData = buildMonthlySummary(transactions);

  const rows: TransactionRow[] = transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    category: tx.category,
    description: tx.description,
    amount: tx.amount,
    date: tx.date.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Uang Kas</h1>
          <p className="text-sm text-muted-foreground">Transparansi keuangan cluster Barcelona Cove</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<a href="/api/cash/transactions/export">Export CSV</a>} />
          <Button variant="outline" render={<Link href="/cash/annual">Rekap Tahunan</Link>} />
          <Button variant="outline" render={<Link href="/cash/dues">Iuran Bulanan</Link>} />
          {isBendahara && <ImportSheetDialog defaultSheetUrl={setting?.cashSheetUrl} />}
          {isBendahara && (
            <Button render={<Link href="/cash/transactions/new">Tambah Transaksi</Link>} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pemasukan</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-foreground">{formatRupiah(totals.income)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-foreground">{formatRupiah(totals.expense)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Saat Ini</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-foreground">{formatRupiah(totals.balance)}</CardContent>
        </Card>
      </div>

      {chartData.length > 0 && <CashChart data={chartData} />}

      <TransactionsTable transactions={rows} isBendahara={isBendahara} />
    </div>
  );
}
