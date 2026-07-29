import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/shared/back-link";
import { MapPositionEditor } from "@/components/admin/map-position-editor";
import { compareBlockNumber } from "@/lib/sort";

export const metadata: Metadata = { title: "Editor Posisi Peta" };

export default async function MapEditorPage() {
  const houses = (await prisma.house.findMany({ select: { id: true, blockNumber: true, mapX: true, mapY: true } })).sort(
    (a, b) => compareBlockNumber(a.blockNumber, b.blockNumber)
  );

  return (
    <div className="space-y-6">
      <BackLink href="/map" label="Kembali ke Peta Klaster" />
      <div>
        <h1 className="text-2xl font-semibold">Editor Posisi Peta</h1>
        <p className="text-sm text-muted-foreground">
          Tandai posisi tiap rumah agar Peta Klaster menampilkan denah sesuai tata letak asli.
        </p>
      </div>

      <MapPositionEditor houses={houses} />
    </div>
  );
}
