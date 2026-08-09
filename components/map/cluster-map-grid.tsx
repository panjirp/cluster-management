"use client";

import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compareBlockNumber } from "@/lib/sort";
import { useQueryState } from "@/lib/use-query-state";
import { ClusterMapCanvas } from "@/components/map/cluster-map-canvas";

const ALL_BLOCKS = "__all__";

export type MapHouse = {
  id: string;
  blockNumber: string;
  mapX: number | null;
  mapY: number | null;
};

export function ClusterMapGrid({ houses }: { houses: MapHouse[] }) {
  const [block, setBlock] = useQueryState("block", ALL_BLOCKS);

  const blocks = useMemo(
    () => Array.from(new Set(houses.map((h) => h.blockNumber.split("-")[0]))).sort(compareBlockNumber),
    [houses]
  );

  const blockItems = useMemo(
    () => ({ [ALL_BLOCKS]: "Semua Blok", ...Object.fromEntries(blocks.map((b) => [b, b])) }),
    [blocks]
  );

  const filtered = useMemo(
    () => (block === ALL_BLOCKS ? houses : houses.filter((h) => h.blockNumber.startsWith(`${block}-`))),
    [houses, block]
  );

  const placedCount = useMemo(() => filtered.filter((h) => h.mapX !== null && h.mapY !== null).length, [filtered]);
  const unplacedCount = filtered.length - placedCount;

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
        <span className="text-xs text-muted-foreground">
          {filtered.length} rumah · {unplacedCount} belum ditandai posisi
        </span>
      </div>

      <ClusterMapCanvas />

      {unplacedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {unplacedCount} rumah belum ditandai posisinya di peta.
        </p>
      )}
    </div>
  );
}
