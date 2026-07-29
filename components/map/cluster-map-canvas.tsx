"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SITE_PLAN_URL, SITE_PLAN_ASPECT } from "@/lib/site-plan";
import type { MapHouse } from "@/components/map/cluster-map-grid";

const STATUS_DOT: Record<MapHouse["status"], string> = {
  KOSONG: "bg-[#F1F3F4] dark:bg-[#2A2B2D] border-[#c3c2b7]",
  LUNAS: "bg-[#0ca30c] border-[#0ca30c]",
  MENUNGGAK: "bg-[#d03b3b] border-[#d03b3b]",
  BELUM_ADA_DATA: "bg-muted-foreground/40 border-muted-foreground/40",
};

const STATUS_LABEL: Record<MapHouse["status"], string> = {
  KOSONG: "Kosong",
  LUNAS: "Lunas",
  MENUNGGAK: "Menunggak",
  BELUM_ADA_DATA: "Belum Ada Data",
};

export function ClusterMapCanvas({
  houses,
  dimmed,
}: {
  houses: (MapHouse & { mapX: number; mapY: number })[];
  dimmed: (house: MapHouse) => boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = houses.find((h) => h.id === selectedId) ?? null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border bg-muted/10"
      style={{ aspectRatio: SITE_PLAN_ASPECT }}
      onClick={() => setSelectedId(null)}
    >
      <Image
        src={SITE_PLAN_URL}
        alt="Denah Cluster Barcelona Cove"
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, 700px"
        className="object-cover"
      />
      {houses.map((house) => (
        <div
          key={house.id}
          title={`${house.blockNumber} · ${STATUS_LABEL[house.status]}${
            house.residentsDisplay ? ` · ${house.residentsDisplay}` : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId((prev) => (prev === house.id ? null : house.id));
          }}
          style={{ left: `${house.mapX}%`, top: `${house.mapY}%` }}
          className={cn(
            "absolute z-10 size-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 shadow-sm transition-opacity hover:scale-150",
            STATUS_DOT[house.status],
            house.id === selectedId && "scale-150 ring-2 ring-primary ring-offset-1",
            dimmed(house) && "opacity-15"
          )}
        />
      ))}

      {selected && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            left: `${selected.mapX}%`,
            top: `${selected.mapY}%`,
          }}
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-lg border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
        >
          <p className="font-semibold">{selected.blockNumber}</p>
          <p className="text-muted-foreground">
            {STATUS_LABEL[selected.status]}
            {selected.residentsDisplay ? ` · ${selected.residentsDisplay}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
