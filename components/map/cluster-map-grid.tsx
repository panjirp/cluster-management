"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compareBlockNumber } from "@/lib/sort";
import { useQueryState } from "@/lib/use-query-state";
import { cn } from "@/lib/utils";
import { ClusterMapCanvas } from "@/components/map/cluster-map-canvas";

const ALL_BLOCKS = "__all__";

export type MapHouse = {
  id: string;
  blockNumber: string;
  status: "KOSONG" | "LUNAS" | "MENUNGGAK" | "BELUM_ADA_DATA";
  residentsDisplay: string;
  mapX: number | null;
  mapY: number | null;
};

const STATUS_STYLE: Record<MapHouse["status"], string> = {
  KOSONG: "bg-[#F1F3F4] dark:bg-[#2A2B2D] border-[#e1e0d9] dark:border-[#2c2c2a]",
  LUNAS: "bg-[#E6F4EA] dark:bg-[#0C2915] border-[#0ca30c]/40",
  MENUNGGAK: "bg-[#FCE8E6] dark:bg-[#2D1210] border-[#d03b3b]/40",
  BELUM_ADA_DATA: "bg-muted border-border",
};

const STATUS_LABEL: Record<MapHouse["status"], string> = {
  KOSONG: "Kosong",
  LUNAS: "Lunas",
  MENUNGGAK: "Menunggak",
  BELUM_ADA_DATA: "Belum Ada Data",
};

export function ClusterMapGrid({ houses, canEdit }: { houses: MapHouse[]; canEdit: boolean }) {
  const [block, setBlock] = useQueryState("block", ALL_BLOCKS);
  const [query, setQuery] = useQueryState("q", "");

  const blocks = useMemo(
    () => Array.from(new Set(houses.map((h) => h.blockNumber.split("-")[0]))).sort(compareBlockNumber),
    [houses]
  );

  const blockItems = useMemo(
    () => ({ [ALL_BLOCKS]: "Semua Blok", ...Object.fromEntries(blocks.map((b) => [b, b])) }),
    [blocks]
  );

  const matches = (house: MapHouse) => {
    if (block !== ALL_BLOCKS && !house.blockNumber.startsWith(`${block}-`)) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!house.blockNumber.toLowerCase().includes(q) && !house.residentsDisplay.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  };

  const matchCount = houses.filter(matches).length;
  const isFiltering = block !== ALL_BLOCKS || query !== "";

  const placed = useMemo(
    () => houses.filter((h): h is MapHouse & { mapX: number; mapY: number } => h.mapX !== null && h.mapY !== null),
    [houses]
  );
  const unplaced = useMemo(() => houses.filter((h) => h.mapX === null || h.mapY === null), [houses]);

  const rows = useMemo(() => {
    const grouped = new Map<string, MapHouse[]>();
    for (const house of unplaced) {
      const key = house.blockNumber.split("-")[0];
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(house);
    }
    for (const arr of grouped.values()) arr.sort((a, b) => compareBlockNumber(a.blockNumber, b.blockNumber));
    return Array.from(grouped.entries()).sort((a, b) => compareBlockNumber(a[0], b[0]));
  }, [unplaced]);

  return (
    <div className="space-y-4">
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
          placeholder="Cari rumah atau nama…"
          className="w-56"
        />
        <span className="text-xs text-muted-foreground">
          {matchCount} dari {houses.length} rumah
        </span>
        {canEdit && (
          <Button variant="outline" size="sm" className="ml-auto" render={<Link href="/admin/map-editor">Edit Posisi Peta</Link>} />
        )}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm border border-[#0ca30c]/40 bg-[#E6F4EA]" /> Lunas
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm border border-[#d03b3b]/40 bg-[#FCE8E6]" /> Menunggak
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm border bg-[#F1F3F4]" /> Kosong
        </span>
      </div>

      {matchCount === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada rumah yang cocok dengan pencarian.</p>
      ) : (
        <>
          {placed.length > 0 && <ClusterMapCanvas houses={placed} dimmed={(h) => isFiltering && !matches(h)} />}

          {unplaced.length > 0 && (
            <div className="space-y-2">
              {placed.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {unplaced.length} rumah belum ditandai posisinya di peta:
                </p>
              )}
              <div className="space-y-2 overflow-x-auto rounded-xl border bg-muted/10 p-4">
                {rows.map(([blockName, blockHouses]) => (
                  <div key={blockName} className="flex items-start gap-3">
                    <div className="w-14 shrink-0 pt-1 text-right text-xs font-semibold text-muted-foreground">
                      {blockName}
                    </div>
                    <div className="flex flex-1 flex-wrap gap-1 rounded-md bg-background/60 p-1.5">
                      {blockHouses.map((house) => (
                        <div
                          key={house.id}
                          title={`${house.blockNumber} · ${STATUS_LABEL[house.status]}${
                            house.residentsDisplay ? ` · ${house.residentsDisplay}` : ""
                          }`}
                          className={cn(
                            "size-5 shrink-0 rounded-[3px] border transition-opacity",
                            STATUS_STYLE[house.status],
                            isFiltering && !matches(house) && "opacity-15"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
