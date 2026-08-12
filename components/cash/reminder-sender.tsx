"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ReminderHouse = {
  houseId: string;
  blockNumber: string;
  ownerName: string | null;
  contactPhone: string | null;
  amount: number;
  overdueMonths: number;
  preview: string;
};

type BulkResult = { houseId: string; ok: boolean; error?: string };

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function statusBadge(row: ReminderHouse) {
  if (row.overdueMonths >= 2) {
    return {
      text: `Menunggak ${row.overdueMonths} bulan`,
      className: "border-transparent bg-red-500/15 text-red-700 dark:text-red-400",
    };
  }
  return {
    text: "Belum Bayar",
    className: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
  };
}

export function ReminderSender({
  rows,
  year,
  month,
  monthLabel,
}: {
  rows: ReminderHouse[];
  year: number;
  month: number;
  monthLabel: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState<{ houseId: string; label: string; error: string }[]>([]);
  const [previewHouseId, setPreviewHouseId] = useState<string | null>(
    () => rows.find((r) => r.contactPhone)?.houseId ?? null
  );

  const withPhone = rows.filter((r) => r.contactPhone);
  const withoutPhone = rows.length - withPhone.length;
  const selectableIds = withPhone.map((r) => r.houseId);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const previewHouse = rows.find((r) => r.houseId === previewHouseId) ?? withPhone[0] ?? null;

  function toggleSelectAll(checked: boolean) {
    setSelected(checked ? new Set(selectableIds) : new Set());
  }

  function toggleSelect(houseId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(houseId);
      else next.delete(houseId);
      return next;
    });
  }

  async function sendOne(row: ReminderHouse) {
    setSendingId(row.houseId);
    try {
      const res = await fetch("/api/whatsapp/dues-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ houseId: row.houseId, year, month }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Gagal mengirim pengingat.");
        return;
      }
      toast.success(`Pengingat untuk Blok ${row.blockNumber} terkirim.`);
      setSentIds((prev) => new Set(prev).add(row.houseId));
      setFailed((prev) => prev.filter((f) => f.houseId !== row.houseId));
    } catch {
      toast.error("Gagal mengirim pengingat.");
    } finally {
      setSendingId(null);
    }
  }

  async function sendBulk() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    setBulkSending(true);
    setFailed([]);
    try {
      const res = await fetch("/api/whatsapp/dues-reminders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ houseIds: ids, year, month }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        sent?: number;
        failed?: number;
        results?: BulkResult[];
      };
      if (!res.ok) {
        toast.error(data.error ?? "Gagal mengirim pengingat massal.");
        return;
      }

      const results = data.results ?? [];
      const okIds = results.filter((r) => r.ok).map((r) => r.houseId);
      const failList = results.filter((r) => !r.ok);
      setSentIds((prev) => new Set([...prev, ...okIds]));
      setFailed(
        failList.map((f) => ({
          houseId: f.houseId,
          label: rows.find((r) => r.houseId === f.houseId)?.blockNumber ?? f.houseId,
          error: f.error ?? "Gagal",
        }))
      );

      if (data.sent && data.sent > 0) toast.success(`${data.sent} pengingat terkirim.`);
      if (data.failed && data.failed > 0) toast.error(`${data.failed} pengingat gagal dikirim.`);
      setSelected(new Set());
    } catch {
      toast.error("Gagal mengirim pengingat massal.");
    } finally {
      setBulkSending(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Ringkasan */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="rounded-full bg-muted px-3 py-1">
          {rows.length} rumah belum bayar
        </span>
        <span className="rounded-full bg-muted px-3 py-1">
          {withPhone.length} bisa dikirim
        </span>
        {withoutPhone > 0 && (
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-400">
            {withoutPhone} tanpa nomor WA
          </span>
        )}
      </div>

      {/* Pratinjau pesan */}
      <div className="rounded-lg border p-4">
        <div className="mb-2 flex items-center gap-2">
          <Eye className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Pratinjau Pesan</h2>
        </div>
        {previewHouse ? (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-muted-foreground">{previewHouse.preview}</p>
            <p className="text-xs text-muted-foreground">
              Kirim ke <span className="font-medium">{previewHouse.contactPhone}</span> — Blok{" "}
              {previewHouse.blockNumber} · {monthLabel} {year}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tidak ada rumah dengan nomor WhatsApp. Isi nomor di menu Data Rumah terlebih dahulu.
          </p>
        )}
      </div>

      {/* Bar aksi massal */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
          <span>{selected.size} rumah dipilih</span>
          <Button size="sm" disabled={bulkSending} onClick={sendBulk}>
            {bulkSending ? "Mengirim..." : `Kirim ke ${selected.size} Rumah`}
          </Button>
          <Button variant="ghost" size="sm" disabled={bulkSending} onClick={() => setSelected(new Set())}>
            Batal Pilih
          </Button>
        </div>
      )}

      {/* Compact: kartu untuk HP potrait & landscape (hingga 1023px), tabel di desktop */}
      <div className="grid grid-cols-1 gap-2 lg:hidden sm:grid-cols-2">
        {rows.map((row) => {
          const badge = statusBadge(row);
          const sent = sentIds.has(row.houseId);
          return (
            <div key={row.houseId} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {row.contactPhone && (
                    <Checkbox
                      checked={selected.has(row.houseId)}
                      onCheckedChange={(c) => toggleSelect(row.houseId, c === true)}
                      aria-label={`Pilih ${row.blockNumber}`}
                    />
                  )}
                  <span className="font-medium">{row.blockNumber}</span>
                </div>
                <Badge variant="outline" className={badge.className}>
                  {badge.text}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{row.ownerName ?? "-"}</span>
                <span>{formatRupiah(row.amount)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {row.contactPhone ?? "Nomor WA belum diisi"}
              </p>
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!previewHouse}
                  onClick={() => setPreviewHouseId(row.houseId)}
                  title="Lihat pratinjau pesan"
                >
                  <Eye className="size-4" />
                </Button>
                {row.contactPhone ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sendingId === row.houseId || bulkSending}
                    onClick={() => sendOne(row)}
                  >
                    {sent ? (
                      <>
                        <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                        Terkirim
                      </>
                    ) : sendingId === row.houseId ? (
                      "Mengirim..."
                    ) : (
                      "Kirim"
                    )}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled title="Nomor WA belum diisi">
                    Kirim
                  </Button>
                )}
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
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(c) => toggleSelectAll(c === true)}
                  disabled={selectableIds.length === 0}
                  aria-label="Pilih semua yang bisa dikirim"
                />
              </TableHead>
              <TableHead>Rumah</TableHead>
              <TableHead>Pemilik</TableHead>
              <TableHead>No. WA</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const badge = statusBadge(row);
              const sent = sentIds.has(row.houseId);
              return (
                <TableRow key={row.houseId} className={cn(sent && "bg-green-500/5")}>
                  <TableCell>
                    {row.contactPhone && (
                      <Checkbox
                        checked={selected.has(row.houseId)}
                        onCheckedChange={(c) => toggleSelect(row.houseId, c === true)}
                        aria-label={`Pilih ${row.blockNumber}`}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{row.blockNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{row.ownerName ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.contactPhone ?? <span className="text-xs">Belum diisi</span>}
                  </TableCell>
                  <TableCell>{formatRupiah(row.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={badge.className}>
                      {badge.text}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setPreviewHouseId(row.houseId)}
                        title="Lihat pratinjau pesan"
                        aria-label={`Pratinjau pesan ${row.blockNumber}`}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {row.contactPhone ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={sendingId === row.houseId || bulkSending}
                          onClick={() => sendOne(row)}
                        >
                          {sent ? (
                            <>
                              <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                              Terkirim
                            </>
                          ) : sendingId === row.houseId ? (
                            "Mengirim..."
                          ) : (
                            <>
                              <Send className="size-4" />
                              Kirim
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled title="Nomor WA belum diisi">
                          Kirim
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Semua rumah sudah bayar kas {monthLabel} {year}. 🎉
        </p>
      )}

      {/* Daftar yang gagal */}
      {failed.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <h3 className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">
            {failed.length} pengingat gagal dikirim
          </h3>
          <ul className="space-y-1 text-sm">
            {failed.map((f) => (
              <li key={f.houseId} className="text-muted-foreground">
                <span className="font-medium text-foreground">Blok {f.label}</span> — {f.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
