import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { compareBlockNumber } from "@/lib/sort";
import { ClusterMapGrid, type MapHouse } from "@/components/map/cluster-map-grid";

export const metadata: Metadata = { title: "Peta Klaster" };

export default async function ClusterMapPage() {
  await requireUser();

  const houses: MapHouse[] = (
    await prisma.house.findMany({
      select: { id: true, blockNumber: true, mapX: true, mapY: true },
    })
  ).sort((a, b) => compareBlockNumber(a.blockNumber, b.blockNumber));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Peta Klaster</h1>
        <p className="text-sm text-muted-foreground">Denah skematik Cluster Barcelona Cove.</p>
      </div>

      <ClusterMapGrid houses={houses} />
    </div>
  );
}
