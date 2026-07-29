"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileSpreadsheet, TriangleAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { transactionCategoryValues, transactionCategoryLabels } from "@/lib/validations/cash";
import type { ParseResult } from "@/lib/sheet-import";

type PreviewRow = ParseResult["blocks"][number]["rows"][number] & { alreadyImported: boolean };
type PreviewBlock = Omit<ParseResult["blocks"][number], "rows"> & { rows: PreviewRow[] };

const MONTH_LABELS = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function ImportSheetDialog({ defaultSheetUrl }: { defaultSheetUrl?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(defaultSheetUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [blocks, setBlocks] = useState<PreviewBlock[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  function reset() {
    setBlocks(null);
    setWarnings([]);
    setSelected({});
  }

  async function handleFetch() {
    setLoading(true);
    reset();
    const res = await fetch("/api/cash/import/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetUrl }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal mengambil data dari Google Sheets.");
      return;
    }

    const data: { blocks: PreviewBlock[]; warnings: string[] } = await res.json();
    setBlocks(data.blocks);
    setWarnings(data.warnings);

    const initialSelected: Record<string, boolean> = {};
    for (const block of data.blocks) {
      for (const row of block.rows) {
        initialSelected[row.rowId] = row.confident && !row.alreadyImported;
      }
    }
    setSelected(initialSelected);
  }

  function updateRow(rowId: string, patch: Partial<PreviewRow>) {
    setBlocks((prev) =>
      prev
        ? prev.map((block) => ({
            ...block,
            rows: block.rows.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)),
          }))
        : prev
    );
  }

  const allRows = blocks?.flatMap((b) => b.rows) ?? [];
  const selectableRows = allRows.filter((r) => !r.alreadyImported);
  const selectedCount = allRows.filter((r) => selected[r.rowId]).length;
  const allSelected = selectableRows.length > 0 && selectedCount === selectableRows.length;
  const someSelected = selectedCount > 0 && !allSelected;

  function toggleSelectAll(checked: boolean) {
    const next: Record<string, boolean> = {};
    for (const row of selectableRows) next[row.rowId] = checked;
    setSelected(next);
  }

  async function handleImport() {
    const rows = allRows
      .filter((r) => selected[r.rowId])
      .map((r) => ({
        importKey: r.importKey,
        type: r.type,
        category: r.category,
        amount: r.amount,
        description: r.description,
        date: r.date,
      }));

    if (rows.length === 0) {
      toast.error("Pilih minimal satu baris untuk diimpor.");
      return;
    }

    setImporting(true);
    const res = await fetch("/api/cash/import/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    setImporting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal mengimpor transaksi.");
      return;
    }

    const result: { imported: number; skipped: number } = await res.json();
    toast.success(
      result.skipped > 0
        ? `${result.imported} transaksi diimpor, ${result.skipped} dilewati karena sudah pernah diimpor.`
        : `${result.imported} transaksi berhasil diimpor.`
    );
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline">
            <FileSpreadsheet data-icon="inline-start" />
            Import dari Google Sheets
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import dari Google Sheets</DialogTitle>
          <DialogDescription>
            Tarik data laporan kas dari Google Sheets (harus dapat diakses siapa saja yang punya link). Tinjau dan sesuaikan
            baris sebelum disimpan ke aplikasi.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="sheetUrl">URL Google Sheets</Label>
            <Input
              id="sheetUrl"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
          </div>
          <Button onClick={handleFetch} disabled={loading || !sheetUrl}>
            {loading ? "Mengambil..." : "Tarik Data"}
          </Button>
        </div>

        {warnings.length > 0 && (
          <div className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
            {warnings.map((w, i) => (
              <p key={i} className="flex items-start gap-1.5">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        )}

        {blocks && blocks.length > 0 && (
          <div className="space-y-5">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={(v) => toggleSelectAll(v === true)}
                disabled={selectableRows.length === 0}
              />
              Pilih Semua ({selectableRows.length} baris dapat diimpor)
            </label>
            {blocks.map((block) => (
              <div key={block.label} className="space-y-2">
                <p className="text-sm font-semibold">
                  {MONTH_LABELS[block.month]} {block.year}
                </p>
                <div className="space-y-1.5">
                  {block.rows.map((row) => (
                    <div
                      key={row.rowId}
                      className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm data-disabled:opacity-50"
                      data-disabled={row.alreadyImported || undefined}
                    >
                      <Checkbox
                        checked={row.alreadyImported ? false : (selected[row.rowId] ?? false)}
                        disabled={row.alreadyImported}
                        onCheckedChange={(v) => setSelected((prev) => ({ ...prev, [row.rowId]: v === true }))}
                      />
                      <span className="min-w-0 flex-1 truncate" title={row.description}>
                        {row.description}
                      </span>
                      <span className={row.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                        {row.type === "INCOME" ? "+" : "-"}
                        {formatRupiah(row.amount)}
                      </span>
                      <Select
                        items={transactionCategoryLabels}
                        value={row.category}
                        onValueChange={(v) => v && updateRow(row.rowId, { category: v as PreviewRow["category"] })}
                      >
                        <SelectTrigger className="w-40" size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {transactionCategoryValues.map((value) => (
                            <SelectItem key={value} value={value}>
                              {transactionCategoryLabels[value]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {row.alreadyImported ? (
                        <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">
                          <Check className="size-3" data-icon="inline-start" />
                          Sudah diimpor
                        </Badge>
                      ) : !row.confident ? (
                        <Badge variant="outline" className="border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          Perlu ditinjau
                        </Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {blocks && blocks.length === 0 && (
          <p className="text-sm text-muted-foreground">Tidak ada data yang bisa dibaca dari sheet ini.</p>
        )}

        <DialogFooter>
          <span className="mr-auto self-center text-xs text-muted-foreground">
            {selectedCount} baris dipilih
          </span>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={importing}>
            Batal
          </Button>
          <Button onClick={handleImport} disabled={importing || selectedCount === 0}>
            {importing ? "Mengimpor..." : `Import ${selectedCount} Transaksi`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
