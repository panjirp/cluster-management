"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, SkipForward, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { compareBlockNumber } from "@/lib/sort";
import { SITE_PLAN_URL, SITE_PLAN_ASPECT } from "@/lib/site-plan";

type HouseRow = {
  id: string;
  blockNumber: string;
  mapX: number | null;
  mapY: number | null;
};

const DEFAULT_IMAGE = SITE_PLAN_URL;

export function MapPositionEditor({ houses: initialHouses }: { houses: HouseRow[] }) {
  const [houses, setHouses] = useState(initialHouses);
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_IMAGE);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialHouses.find((h) => h.mapX === null)?.id ?? initialHouses[0]?.id ?? null
  );
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...houses].sort((a, b) => compareBlockNumber(a.blockNumber, b.blockNumber)),
    [houses]
  );
  const placedCount = houses.filter((h) => h.mapX !== null && h.mapY !== null).length;
  const selected = houses.find((h) => h.id === selectedId) ?? null;

  const searchResults = search
    ? sorted.filter((h) => h.blockNumber.toLowerCase().includes(search.toLowerCase()))
    : [];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUrl((prev) => {
      if (prev && prev !== DEFAULT_IMAGE) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function selectNextUnplaced(afterId?: string) {
    const startIndex = afterId ? sorted.findIndex((h) => h.id === afterId) : -1;
    const next = sorted.slice(startIndex + 1).find((h) => h.mapX === null);
    setSelectedId(next?.id ?? sorted.find((h) => h.mapX === null)?.id ?? null);
  }

  async function placeSelected(clientX: number, clientY: number) {
    if (!selected || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));

    setHouses((prev) => prev.map((h) => (h.id === selected.id ? { ...h, mapX: x, mapY: y } : h)));

    setSaving(true);
    const res = await fetch(`/api/houses/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mapX: x, mapY: y }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(`Gagal menyimpan posisi ${selected.blockNumber}.`);
      return;
    }

    selectNextUnplaced(selected.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" render={<label className="cursor-pointer" />}>
          <Upload data-icon="inline-start" />
          Ganti Foto Referensi
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </Button>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Lompat ke nomor rumah…"
          className="w-48"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => selectNextUnplaced()}
          disabled={placedCount === houses.length}
        >
          <SkipForward data-icon="inline-start" />
          Rumah Berikutnya
        </Button>
        <span className="text-xs text-muted-foreground">
          {placedCount} dari {houses.length} sudah ditandai
        </span>
        {saving && <span className="text-xs text-muted-foreground">Menyimpan…</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        Latar menggunakan denah_bc.png yang sudah disimpan di aplikasi. Foto pengganti yang Anda unggah di sini hanya
        dipakai di browser Anda saat ini, tidak ikut tersimpan.
      </p>

      {search && (
        <div className="flex flex-wrap gap-1.5 rounded-lg border p-2">
          {searchResults.slice(0, 30).map((h) => (
            <button
              key={h.id}
              onClick={() => {
                setSelectedId(h.id);
                setSearch("");
              }}
              className={cn(
                "rounded-md border px-2 py-1 text-xs",
                h.mapX !== null ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-muted"
              )}
            >
              {h.blockNumber}
            </button>
          ))}
          {searchResults.length === 0 && <p className="text-xs text-muted-foreground">Tidak ditemukan.</p>}
        </div>
      )}

      {selected && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
          <span className="text-sm">
            Menandai: <span className="font-semibold">{selected.blockNumber}</span>
          </span>
          {selected.mapX !== null && (
            <Badge variant="outline" className="border-transparent bg-green-500/15 text-green-700 dark:text-green-400">
              <Check className="size-3" data-icon="inline-start" />
              Sudah ditandai
            </Badge>
          )}
          <span className="ml-auto text-xs text-muted-foreground">Klik posisi rumah ini di gambar di bawah</span>
        </div>
      )}

      <div
        ref={canvasRef}
        onClick={(e) => placeSelected(e.clientX, e.clientY)}
        className={cn(
          "relative w-full overflow-hidden rounded-xl border bg-muted/20 bg-cover bg-center",
          selected ? "cursor-crosshair" : "cursor-not-allowed"
        )}
        style={{ backgroundImage: `url(${imageUrl})`, aspectRatio: SITE_PLAN_ASPECT }}
      >
        {houses
          .filter((h) => h.mapX !== null && h.mapY !== null)
          .map((h) => (
            <div
              key={h.id}
              title={h.blockNumber}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(h.id);
              }}
              style={{ left: `${h.mapX}%`, top: `${h.mapY}%` }}
              className={cn(
                "absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow",
                h.id === selectedId ? "z-10 size-4 bg-primary ring-2 ring-primary/40" : "bg-green-500"
              )}
            />
          ))}
      </div>
    </div>
  );
}
