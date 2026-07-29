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

const ALL_TYPES = "__all__";
const typeItems = {
  [ALL_TYPES]: "Semua Tipe",
  INCOME: "Pemasukan",
  EXPENSE: "Pengeluaran",
};

const ALL_CATEGORIES = "__all__";

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
  const [type, setType] = useQueryState("type", ALL_TYPES);
  const [category, setCategory] = useQueryState("category", ALL_CATEGORIES);

  const categoryItems = useMemo(() => ({ [ALL_CATEGORIES]: "Semua Kategori", ...transactionCategoryLabels }), []);

  const filtered = useMemo(
    () =>
      transactions.filter((tx) => {
        if (!isInRange(new Date(tx.date), range)) return false;
        if (type !== ALL_TYPES && tx.type !== type) return false;
        if (category !== ALL_CATEGORIES && tx.category !== category) return false;
        return true;
      }),
    [transactions, range, type, category]
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
        <Select items={typeItems} value={type} onValueChange={(v) => v && setType(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(typeItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select items={categoryItems} value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categoryItems).map(([value, label]) => (
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

      {filtered.length === 0 ? (
        <div className="rounded-lg border py-8 text-center text-sm text-muted-foreground">
          {transactions.length === 0 ? "Belum ada transaksi." : "Tidak ada transaksi pada rentang ini."}
        </div>
      ) : (
        <>
          {/* Mobile: card list, no horizontal scroll needed */}
          <div className="space-y-2 sm:hidden">
            {filtered.map((tx) => (
              <div key={tx.id} className="space-y-1.5 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
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
                  <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                </div>
                <p className="text-sm">{tx.description}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{transactionCategoryLabels[tx.category]}</span>
                  <span
                    className={
                      tx.type === "INCOME"
                        ? "font-medium text-green-700 dark:text-green-400"
                        : "font-medium text-red-700 dark:text-red-400"
                    }
                  >
                    {formatRupiah(tx.amount)}
                  </span>
                </div>
                {isBendahara && (
                  <div className="flex justify-end pt-1">
                    <DeleteTransactionButton id={tx.id} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-lg border sm:block">
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
                {filtered.map((tx) => (
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
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
