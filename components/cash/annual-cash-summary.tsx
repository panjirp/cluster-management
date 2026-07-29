"use client";

import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryState } from "@/lib/use-query-state";
import { buildAnnualSummary, getAvailableYears } from "@/lib/cash";
import { transactionCategoryLabels } from "@/lib/validations/cash";
import type { CashTransaction } from "@/app/generated/prisma/client";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function AnnualCashSummary({ transactions }: { transactions: CashTransaction[] }) {
  const years = useMemo(() => getAvailableYears(transactions), [transactions]);
  const currentYear = new Date().getFullYear();
  const defaultYear = (years[0] ?? currentYear).toString();
  const [yearStr, setYearStr] = useQueryState("year", defaultYear);
  const year = Number(yearStr);

  const yearItems = useMemo(() => {
    const list = years.includes(year) ? years : [year, ...years];
    return Object.fromEntries(list.map((y) => [y.toString(), y.toString()]));
  }, [years, year]);

  const summary = useMemo(() => buildAnnualSummary(transactions, year), [transactions, year]);
  const maxAmount = Math.max(1, ...summary.byCategory.map((c) => c.amount));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select items={yearItems} value={yearStr} onValueChange={(v) => v && setYearStr(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(yearItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{summary.transactionCount} transaksi tahun ini</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pemasukan {year}</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-green-700 dark:text-green-400">
            {formatRupiah(summary.income)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran {year}</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-red-700 dark:text-red-400">
            {formatRupiah(summary.expense)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Selisih {year}</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold text-foreground">{formatRupiah(summary.balance)}</CardContent>
        </Card>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-medium">Rincian per Kategori</h2>
        {summary.byCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada transaksi di tahun ini.</p>
        ) : (
          <div className="space-y-2.5">
            {summary.byCategory.map((c) => (
              <div key={`${c.type}-${c.category}`} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {transactionCategoryLabels[c.category]}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({c.type === "INCOME" ? "Pemasukan" : "Pengeluaran"})
                    </span>
                  </span>
                  <span className="font-medium">{formatRupiah(c.amount)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${c.type === "INCOME" ? "bg-green-600" : "bg-red-600"}`}
                    style={{ width: `${(c.amount / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
