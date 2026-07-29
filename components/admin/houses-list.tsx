"use client";

import { useMemo, useState } from "react";
import { Home, HousePlus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddHouseForm } from "@/components/admin/add-house-form";
import { HouseActions } from "@/components/admin/house-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { houseStatusValues, houseStatusLabels } from "@/lib/validations/house";
import { compareBlockNumber } from "@/lib/sort";
import { useQueryState } from "@/lib/use-query-state";
import type { HouseStatus } from "@/app/generated/prisma/client";

const ALL_STATUS = "__all__";
const ALL_BLOCKS = "__all__";

type HouseRow = {
  id: string;
  blockNumber: string;
  statusHuni: HouseStatus;
  contactPhone: string | null;
  residentNames: string;
};

const statusAccent: Record<HouseStatus, string> = {
  DITEMPATI: "border-l-green-600",
  KOSONG: "border-l-muted-foreground/30",
  DIKONTRAKKAN: "border-l-blue-500",
};

export function HousesList({ houses }: { houses: HouseRow[] }) {
  const [status, setStatus] = useQueryState("status", ALL_STATUS);
  const [block, setBlock] = useQueryState("block", ALL_BLOCKS);
  const [query, setQuery] = useQueryState("q", "");
  const [addOpen, setAddOpen] = useState(false);

  const statusItems = useMemo(() => ({ [ALL_STATUS]: "Semua Status", ...houseStatusLabels }), []);

  const blocks = useMemo(
    () => Array.from(new Set(houses.map((h) => h.blockNumber.split("-")[0]))).sort(compareBlockNumber),
    [houses]
  );
  const blockItems = useMemo(
    () => ({ [ALL_BLOCKS]: "Semua Blok", ...Object.fromEntries(blocks.map((b) => [b, b])) }),
    [blocks]
  );

  const filtered = houses.filter((house) => {
    if (status !== ALL_STATUS && house.statusHuni !== status) return false;
    if (block !== ALL_BLOCKS && !house.blockNumber.startsWith(`${block}-`)) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!`${house.blockNumber} ${house.residentNames}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nomor rumah atau nama warga…"
          className="w-64"
        />
        <Select items={blockItems} value={block} onValueChange={(v) => v && setBlock(v)}>
          <SelectTrigger className="w-32">
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
        <Select items={statusItems} value={status} onValueChange={(v) => v && setStatus(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS}>Semua Status</SelectItem>
            {houseStatusValues.map((value) => (
              <SelectItem key={value} value={value}>
                {houseStatusLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} dari {houses.length} rumah
        </span>

        <div className="ml-auto">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={
                <Button>
                  <HousePlus data-icon="inline-start" />
                  Tambah Rumah
                </Button>
              }
            />
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Tambah Rumah</DialogTitle>
                <DialogDescription>Daftarkan rumah/blok baru di cluster Barcelona Cove.</DialogDescription>
              </DialogHeader>
              <AddHouseForm onSuccess={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filtered.length === 0 ? (
        houses.length === 0 ? (
          <EmptyState icon={Home} title="Belum ada rumah" description="Tambahkan rumah/blok pertama di cluster ini." />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-muted-foreground">
            <SearchX className="size-8" />
            <p className="text-sm">Tidak ada rumah yang cocok dengan pencarian.</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((house) => (
            <Card key={house.id} className={`border-l-4 ${statusAccent[house.statusHuni]}`}>
              <CardContent className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-base font-semibold">{house.blockNumber}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {house.residentNames || "Belum ada warga"}
                  </p>
                  {house.contactPhone && (
                    <p className="text-xs text-muted-foreground">WA: {house.contactPhone}</p>
                  )}
                </div>
                <HouseActions houseId={house.id} blockNumber={house.blockNumber} currentStatus={house.statusHuni} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
