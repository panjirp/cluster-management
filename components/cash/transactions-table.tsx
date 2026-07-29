"use client";

import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteTransactionButton } from "@/components/cash/delete-transaction-button";
import { transactionCategoryLabels } from "@/lib/validations/cash";
import { useQueryState } from "@/lib/use-query-state";

const ALL_TIME = "__all__";
const THIS_MONTH = "this_month";
const LAST_MONTH = "last_month";
const LAST_3_MONTHS = "last_3_months";

const rangeItems = {
  [ALL_TIME]: "Semua Waktu",
  [THIS_MONTH]: "Bulan Ini",
  [LAST_MONTH]: "Bulan Lalu",
  [LAST_3_MONTHS]: "3 Bulan Terakhir",
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(date));
}

export type TransactionRow = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: keyof typeof transactionCategoryLabels;
  description: string;
  amount: number;
  date: string;
};

function isInRange(date: Date, range: string) {
  const now = new Date();
  if (range === ALL_TIME) return true;
  if (range === THIS_MONTH) {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  if (range === LAST_MONTH) {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return date.getFullYear() === lastMonth.getFullYear() && date.getMonth() === lastMonth.getMonth();
  }
  if (range === LAST_3_MONTHS) {
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return date >= cutoff;
  }
  return true;
}

export function TransactionsTable({ transactions, isBendahara }: { transactions: TransactionRow[]; isBendahara: boolean }) {
  const [range, setRange] = useQueryState("range", ALL_TIME);

  const filtered = useMemo(
    () => transactions.filter((tx) => isInRange(new Date(tx.date), range)),
    [transactions, range]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select items={rangeItems} value={range} onValueChange={(v) => v && setRange(v)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(rangeItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} dari {transactions.length} transaksi
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
              {isBendahara && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isBendahara ? 6 : 5} className="text-center text-muted-foreground">
                  {transactions.length === 0 ? "Belum ada transaksi." : "Tidak ada transaksi pada rentang ini."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        tx.type === "INCOME"
                          ? "border-transparent bg-green-500/15 text-green-700 dark:text-green-400"
                          : "border-transparent bg-red-500/15 text-red-700 dark:text-red-400"
                      }
                    >
                      {tx.type === "INCOME" ? "Masuk" : "Keluar"}
                    </Badge>
                  </TableCell>
                  <TableCell>{transactionCategoryLabels[tx.category]}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatRupiah(tx.amount)}</TableCell>
                  {isBendahara && (
                    <TableCell className="text-right">
                      <DeleteTransactionButton id={tx.id} />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
