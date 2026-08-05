"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteTransactionButton } from "@/components/cash/delete-transaction-button";
import { Pagination } from "@/components/shared/pagination";
import { transactionCategoryLabels } from "@/lib/validations/cash";
import { useQueryState } from "@/lib/use-query-state";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

type SortField = "date" | "amount";
type SortDir = "asc" | "desc";

function SortableHead({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const active = sortField === field;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 hover:text-foreground",
          className?.includes("text-right") && "flex-row-reverse"
        )}
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="size-3.5" />
          ) : (
            <ArrowDown className="size-3.5" />
          )
        ) : (
          <ArrowUpDown className="size-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

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
  description: string | null;
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
  const [query, setQuery] = useQueryState("q", "");
  const [range, setRange] = useQueryState("range", ALL_TIME);
  const [type, setType] = useQueryState("type", ALL_TYPES);
  const [category, setCategory] = useQueryState("category", ALL_CATEGORIES);
  const [pageStr, setPageStr] = useQueryState("page", "1");
  const [sortField, setSortField] = useQueryState("sortField", "date" as SortField);
  const [sortDir, setSortDir] = useQueryState("sortDir", "desc" as SortDir);
  const page = Math.max(1, Number(pageStr) || 1);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const categoryItems = useMemo(() => ({ [ALL_CATEGORIES]: "Semua Kategori", ...transactionCategoryLabels }), []);

  const filtered = useMemo(
    () =>
      transactions
        .filter((tx) => {
          if (!isInRange(new Date(tx.date), range)) return false;
          if (type !== ALL_TYPES && tx.type !== type) return false;
          if (category !== ALL_CATEGORIES && tx.category !== category) return false;
          if (query && !(tx.description ?? "").toLowerCase().includes(query.toLowerCase())) return false;
          return true;
        })
        .sort((a, b) => {
          const dir = sortDir === "asc" ? 1 : -1;
          if (sortField === "amount") return (a.amount - b.amount) * dir;
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
        }),
    [transactions, range, type, category, query, sortField, sortDir]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== 1) setPageStr("1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, type, category, query]);

  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari keterangan…"
          className="w-56"
        />
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
            {paginated.map((tx) => (
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
                <p className="text-sm">{tx.description ?? "—"}</p>
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
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit transaksi"
                      render={<Link href={`/cash/transactions/${tx.id}/edit`} />}
                    >
                      <Pencil />
                    </Button>
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
                  <SortableHead
                    label="Tanggal"
                    field="date"
                    sortField={sortField as SortField}
                    sortDir={sortDir as SortDir}
                    onSort={handleSort}
                  />
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <SortableHead
                    label="Nominal"
                    field="amount"
                    sortField={sortField as SortField}
                    sortDir={sortDir as SortDir}
                    onSort={handleSort}
                    className="text-right"
                  />
                  {isBendahara && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((tx) => (
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
                    <TableCell>{tx.description ?? "—"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatRupiah(tx.amount)}</TableCell>
                    {isBendahara && (
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit transaksi"
                          render={<Link href={`/cash/transactions/${tx.id}/edit`} />}
                        >
                          <Pencil />
                        </Button>
                        <DeleteTransactionButton id={tx.id} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination page={currentPage} totalPages={totalPages} onPageChange={(p) => setPageStr(p.toString())} />
        </>
      )}
    </div>
  );
}
