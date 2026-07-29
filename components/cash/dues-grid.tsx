"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DuesDonutChart } from "@/components/cash/dues-donut-chart";
import { buildDuesReminderUrl } from "@/lib/whatsapp";
import { compareBlockNumber } from "@/lib/sort";
import { useQueryState } from "@/lib/use-query-state";

const ALL_BLOCKS = "__all__";

type HouseDue = {
  id: string;
  blockNumber: string;
  ownerName: string | null;
  contactPhone: string | null;
  due: { id: string; amount: number; isPaid: boolean; paidAt: string | null } | null;
  overdueMonths: number;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function statusBadgeText(house: HouseDue) {
  if (!house.due) return "Belum Dibuat";
  if (house.due.isPaid) return "Lunas";
  if (house.overdueMonths >= 2) return `Menunggak ${house.overdueMonths} bulan`;
  return "Belum Bayar";
}

function statusBadgeClass(house: HouseDue) {
  if (!house.due) return "";
  if (house.due.isPaid) return "border-transparent bg-green-500/15 text-green-700 dark:text-green-400";
  if (house.overdueMonths >= 2) return "border-transparent bg-red-500/15 text-red-700 dark:text-red-400";
  return "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400";
}

const MONTH_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function DuesGrid({
  houses: initialHouses,
  canManage,
  year,
  month,
}: {
  houses: HouseDue[];
  canManage: boolean;
  year: number;
  month: number;
}) {
  const [houses, setHouses] = useState(initialHouses);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [bulkPending, setBulkPending] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [block, setBlock] = useQueryState("block", ALL_BLOCKS);
  const [query, setQuery] = useQueryState("q", "");

  const blocks = useMemo(
    () =>
      Array.from(new Set(houses.map((h) => h.blockNumber.split("-")[0]))).sort(compareBlockNumber),
    [houses]
  );

  const blockItems = useMemo(
    () => ({ [ALL_BLOCKS]: "Semua Blok", ...Object.fromEntries(blocks.map((b) => [b, b])) }),
    [blocks]
  );

  const filtered = houses.filter((house) => {
    if (block !== ALL_BLOCKS && !house.blockNumber.startsWith(`${block}-`)) return false;
    if (query) {
      const q = query.toLowerCase();
      const haystack = `${house.blockNumber} ${house.ownerName ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const selectableIds = filtered.filter((h) => h.due && !h.due.isPaid).map((h) => h.due!.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const paidCount = houses.filter((h) => h.due?.isPaid).length;
  const unpaidCount = houses.filter((h) => h.due && !h.due.isPaid).length;

  function toggleSelectAll(checked: boolean) {
    setSelected(checked ? new Set(selectableIds) : new Set());
  }

  function toggleSelect(dueId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(dueId);
      else next.delete(dueId);
      return next;
    });
  }

  async function togglePaid(dueId: string, isPaid: boolean) {
    const previous = houses;
    setPendingId(dueId);
    setHouses((prev) =>
      prev.map((h) =>
        h.due?.id === dueId
          ? { ...h, due: { ...h.due, isPaid, paidAt: isPaid ? new Date().toISOString() : null } }
          : h
      )
    );

    const res = await fetch(`/api/cash/dues/${dueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaid }),
    });
    setPendingId(null);

    if (!res.ok) {
      setHouses(previous);
      toast.error("Gagal memperbarui status iuran.");
    }
  }

  async function bulkMarkPaid() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    const previous = houses;
    setBulkPending(true);
    setHouses((prev) =>
      prev.map((h) =>
        h.due && ids.includes(h.due.id)
          ? { ...h, due: { ...h.due, isPaid: true, paidAt: new Date().toISOString() } }
          : h
      )
    );

    const results = await Promise.all(
      ids.map((id) =>
        fetch(`/api/cash/dues/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPaid: true }),
        }).then((res) => res.ok)
      )
    );
    setBulkPending(false);

    const failedCount = results.filter((ok) => !ok).length;
    if (failedCount > 0) {
      setHouses(previous);
      toast.error(`Gagal menandai ${failedCount} dari ${ids.length} rumah.`);
      return;
    }

    toast.success(`${ids.length} rumah ditandai lunas.`);
    setSelected(new Set());
  }

  return (
    <div className="space-y-3">
      <DuesDonutChart paid={paidCount} unpaid={unpaidCount} />

      <div className="sticky top-0 z-10 -mx-4 space-y-2 border-b bg-background px-4 py-2 sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Select items={blockItems} value={block} onValueChange={(v) => v && setBlock(v)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BLOCKS}>Semua Blok</SelectItem>
              {blocks.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nomor rumah atau nama pemilik…"
            className="w-72"
          />
          <span className="text-xs text-muted-foreground">
            {filtered.length} dari {houses.length} rumah
          </span>
        </div>

        {canManage && selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
            <span>{selected.size} dipilih</span>
            <Button size="sm" disabled={bulkPending} onClick={bulkMarkPaid}>
              {bulkPending ? "Memproses..." : "Tandai Lunas"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Batal Pilih
            </Button>
          </div>
        )}
      </div>

      {/* Mobile: card list, no horizontal scroll needed */}
      <div className="space-y-2 sm:hidden">
        {filtered.map((house) => (
          <div key={house.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {canManage && house.due && !house.due.isPaid && (
                  <Checkbox
                    checked={selected.has(house.due.id)}
                    onCheckedChange={(checked) => toggleSelect(house.due!.id, checked === true)}
                    aria-label={`Pilih ${house.blockNumber}`}
                  />
                )}
                <Link
                  href={`/cash/dues/house/${house.id}?year=${year}&month=${month}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {house.blockNumber}
                </Link>
              </div>
              <Badge variant="outline" className={statusBadgeClass(house)}>
                {statusBadgeText(house)}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{house.ownerName ?? "-"}</span>
              <span>{house.due ? formatRupiah(house.due.amount) : "-"}</span>
            </div>
            {canManage && house.due && (
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                {!house.due.isPaid &&
                  (house.contactPhone ? (
                    <Button
                      variant="outline"
                      size="sm"
                      render={
                        <a
                          href={buildDuesReminderUrl(
                            house.contactPhone,
                            house.blockNumber,
                            MONTH_LABELS[month - 1],
                            year,
                            house.due.amount
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Kirim Pengingat WA
                        </a>
                      }
                    />
                  ) : (
                    <Button variant="outline" size="sm" disabled title="Nomor WA belum diisi">
                      Kirim Pengingat WA
                    </Button>
                  ))}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pendingId === house.due.id}
                  onClick={() => togglePaid(house.due!.id, !house.due!.isPaid)}
                >
                  {house.due.isPaid ? "Tandai Belum Bayar" : "Tandai Lunas"}
                </Button>
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
            {canManage && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                  disabled={selectableIds.length === 0}
                  aria-label="Pilih semua yang belum bayar"
                />
              </TableHead>
            )}
            <TableHead>Rumah</TableHead>
            <TableHead>Pemilik</TableHead>
            <TableHead>Nominal</TableHead>
            <TableHead>Status</TableHead>
            {canManage && <TableHead className="text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((house) => (
            <TableRow key={house.id}>
              {canManage && (
                <TableCell>
                  {house.due && !house.due.isPaid && (
                    <Checkbox
                      checked={selected.has(house.due.id)}
                      onCheckedChange={(checked) => toggleSelect(house.due!.id, checked === true)}
                      aria-label={`Pilih ${house.blockNumber}`}
                    />
                  )}
                </TableCell>
              )}
              <TableCell>
                <Link
                  href={`/cash/dues/house/${house.id}?year=${year}&month=${month}`}
                  className="hover:text-primary hover:underline"
                >
                  {house.blockNumber}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{house.ownerName ?? "-"}</TableCell>
              <TableCell>{house.due ? formatRupiah(house.due.amount) : "-"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={statusBadgeClass(house)}>
                  {statusBadgeText(house)}
                </Badge>
              </TableCell>
              {canManage && (
                <TableCell className="text-right space-x-2 whitespace-nowrap">
                  {house.due &&
                    !house.due.isPaid &&
                    (house.contactPhone ? (
                      <Button
                        variant="outline"
                        size="sm"
                        render={
                          <a
                            href={buildDuesReminderUrl(
                              house.contactPhone,
                              house.blockNumber,
                              MONTH_LABELS[month - 1],
                              year,
                              house.due.amount
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Kirim Pengingat WA
                          </a>
                        }
                      />
                    ) : (
                      <Button variant="outline" size="sm" disabled title="Nomor WA belum diisi">
                        Kirim Pengingat WA
                      </Button>
                    ))}
                  {house.due && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pendingId === house.due.id}
                      onClick={() => togglePaid(house.due!.id, !house.due!.isPaid)}
                    >
                      {house.due.isPaid ? "Tandai Belum Bayar" : "Tandai Lunas"}
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
