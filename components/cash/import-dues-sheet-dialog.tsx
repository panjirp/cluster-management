"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileSpreadsheet, TriangleAlert, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MONTH_LABELS = [
  "", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

type MonthEntry = { year: number; month: number; amount: number; status: "new" | "update_to_paid" | "already_paid" };
type HouseGroup = {
  blockNumber: string;
  houseCode: string;
  residentName: string;
  houseExists: boolean;
  months: MonthEntry[];
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function ImportDuesSheetDialog({ defaultSheetUrl }: { defaultSheetUrl?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(defaultSheetUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [houses, setHouses] = useState<HouseGroup[] | null>(null);
  const [skippedColumns, setSkippedColumns] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  function reset() {
    setHouses(null);
    setSkippedColumns([]);
    setWarnings([]);
    setSelected({});
    setSearch("");
  }

  async function handleFetch() {
    setLoading(true);
    reset();
    const res = await fetch("/api/cash/dues/import/preview", {
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

    const data: { houses: HouseGroup[]; skippedColumns: string[]; warnings: string[] } = await res.json();
    setHouses(data.houses);
    setSkippedColumns(data.skippedColumns);
    setWarnings(data.warnings);

    const initialSelected: Record<string, boolean> = {};
    for (const house of data.houses) {
      const importableCount = house.months.filter((m) => m.status !== "already_paid").length;
      initialSelected[house.blockNumber] = importableCount > 0;
    }
    setSelected(initialSelected);
  }

  const filteredHouses = useMemo(() => {
    if (!houses) return [];
    if (!search) return houses;
    const q = search.toLowerCase();
    return houses.filter(
      (h) => h.blockNumber.toLowerCase().includes(q) || h.residentName.toLowerCase().includes(q)
    );
  }, [houses, search]);

  const selectableHouses = houses?.filter((h) => h.months.some((m) => m.status !== "already_paid")) ?? [];
  const selectedHouses = selectableHouses.filter((h) => selected[h.blockNumber]);
  const totalSelectedMonths = selectedHouses.reduce(
    (sum, h) => sum + h.months.filter((m) => m.status !== "already_paid").length,
    0
  );
  const housesToCreate = selectedHouses.filter((h) => !h.houseExists).length;

  function toggleSelectAll(checked: boolean) {
    const next: Record<string, boolean> = {};
    for (const h of selectableHouses) next[h.blockNumber] = checked;
    setSelected(next);
  }

  async function handleImport() {
    const payload = {
      houses: selectedHouses.map((h) => ({
        blockNumber: h.blockNumber,
        months: h.months
          .filter((m) => m.status !== "already_paid")
          .map((m) => ({ year: m.year, month: m.month, amount: m.amount })),
      })),
    };

    if (payload.houses.length === 0) {
      toast.error("Pilih minimal satu rumah untuk diimpor.");
      return;
    }

    setImporting(true);
    const res = await fetch("/api/cash/dues/import/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setImporting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal mengimpor iuran.");
      return;
    }

    const result: { imported: number; skipped: number; housesCreated: number } = await res.json();
    toast.success(
      `${result.imported} catatan iuran diimpor` +
        (result.housesCreated > 0 ? `, ${result.housesCreated} rumah baru dibuat` : "") +
        (result.skipped > 0 ? `, ${result.skipped} dilewati.` : ".")
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
          <DialogTitle>Import Iuran dari Google Sheets</DialogTitle>
          <DialogDescription>
            Tarik data matriks iuran per rumah per bulan dari Google Sheets (harus dapat diakses siapa saja yang punya
            link). Rumah yang belum terdaftar akan dibuat otomatis; bulan yang sudah tercatat lunas tidak akan ditimpa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="duesSheetUrl">URL Google Sheets</Label>
            <Input
              id="duesSheetUrl"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
          </div>
          <Button onClick={handleFetch} disabled={loading || !sheetUrl}>
            {loading ? "Mengambil..." : "Tarik Data"}
          </Button>
        </div>

        {(warnings.length > 0 || skippedColumns.length > 0) && (
          <div className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
            {skippedColumns.length > 0 && (
              <p className="flex items-start gap-1.5">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                Kolom berikut dilewati karena mencakup beberapa bulan sekaligus: {skippedColumns.join(", ")}.
              </p>
            )}
            {warnings.map((w, i) => (
              <p key={i} className="flex items-start gap-1.5">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        )}

        {houses && houses.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedHouses.length > 0 && selectedHouses.length === selectableHouses.length}
                  indeterminate={selectedHouses.length > 0 && selectedHouses.length < selectableHouses.length}
                  onCheckedChange={(v) => toggleSelectAll(v === true)}
                  disabled={selectableHouses.length === 0}
                />
                Pilih Semua ({selectableHouses.length} rumah dapat diimpor)
              </label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari blok atau nama warga…"
                className="ml-auto w-56"
              />
            </div>

            <div className="max-h-96 space-y-1.5 overflow-y-auto rounded-lg border p-2">
              {filteredHouses.map((house) => {
                const importable = house.months.filter((m) => m.status !== "already_paid");
                const toUpdate = importable.filter((m) => m.status === "update_to_paid").length;
                return (
                  <div
                    key={house.blockNumber}
                    className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm data-disabled:opacity-50"
                    data-disabled={importable.length === 0 || undefined}
                  >
                    <Checkbox
                      checked={selected[house.blockNumber] ?? false}
                      disabled={importable.length === 0}
                      onCheckedChange={(v) =>
                        setSelected((prev) => ({ ...prev, [house.blockNumber]: v === true }))
                      }
                    />
                    <span className="font-medium">{house.blockNumber}</span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground" title={house.residentName}>
                      {house.residentName || "—"}
                    </span>
                    {!house.houseExists && (
                      <Badge variant="outline" className="border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400">
                        <Plus className="size-3" data-icon="inline-start" />
                        Rumah baru
                      </Badge>
                    )}
                    {importable.length > 0 ? (
                      <Badge variant="outline" className="border-transparent bg-green-500/15 text-green-700 dark:text-green-400">
                        {importable.length} bulan akan diimpor
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">
                        <Check className="size-3" data-icon="inline-start" />
                        Semua sudah tercatat
                      </Badge>
                    )}
                    {toUpdate > 0 && (
                      <Badge variant="outline" className="border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        {toUpdate} akan ditandai lunas
                      </Badge>
                    )}
                    <span
                      className="w-full truncate text-xs text-muted-foreground"
                      title={importable.map((m) => `${MONTH_LABELS[m.month]} ${m.year}: ${formatRupiah(m.amount)}`).join(", ")}
                    >
                      {importable.map((m) => `${MONTH_LABELS[m.month]} ${m.year}`).join(", ") || "-"}
                    </span>
                  </div>
                );
              })}
              {filteredHouses.length === 0 && (
                <p className="p-2 text-sm text-muted-foreground">Tidak ada rumah yang cocok dengan pencarian.</p>
              )}
            </div>
          </div>
        )}

        {houses && houses.length === 0 && (
          <p className="text-sm text-muted-foreground">Tidak ada data yang bisa dibaca dari sheet ini.</p>
        )}

        <DialogFooter>
          <span className="mr-auto self-center text-xs text-muted-foreground">
            {selectedHouses.length} rumah / {totalSelectedMonths} catatan bulan dipilih
            {housesToCreate > 0 ? ` (${housesToCreate} rumah baru)` : ""}
          </span>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={importing}>
            Batal
          </Button>
          <Button onClick={handleImport} disabled={importing || selectedHouses.length === 0}>
            {importing ? "Mengimpor..." : `Import ${totalSelectedMonths} Catatan`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
