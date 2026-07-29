import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { maskName } from "@/lib/mask";
import { compareBlockNumber } from "@/lib/sort";
import { ClusterMapGrid, type MapHouse } from "@/components/map/cluster-map-grid";

export const metadata: Metadata = { title: "Peta Klaster" };

export default async function ClusterMapPage() {
  const session = await requireUser();
  const now = new Date();

  const houses = (
    await prisma.house.findMany({
      include: {
        residents: { select: { id: true, name: true } },
        monthlyDues: { where: { year: now.getFullYear(), month: now.getMonth() + 1 } },
      },
    })
  ).sort((a, b) => compareBlockNumber(a.blockNumber, b.blockNumber));

  const canSeeFullNames = session.user.role === "ADMIN" || session.user.role === "BENDAHARA";

  const mapHouses: MapHouse[] = houses.map((house) => {
    const due = house.monthlyDues[0];
    let status: MapHouse["status"] = "BELUM_ADA_DATA";
    if (house.statusHuni === "KOSONG") status = "KOSONG";
    else if (due?.isPaid) status = "LUNAS";
    else if (due && !due.isPaid) status = "MENUNGGAK";

    const isOwner = house.id === session.user.houseId;

    const names =
      house.residents.length > 0
        ? house.residents.map((r) => r.name)
        : house.residentName
          ? [house.residentName]
          : [];

    return {
      id: house.id,
      blockNumber: house.blockNumber,
      status,
      residentsDisplay: names.map((n) => (canSeeFullNames || isOwner ? n : maskName(n))).join(", "),
      mapX: house.mapX,
      mapY: house.mapY,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Peta Klaster</h1>
        <p className="text-sm text-muted-foreground">
          Denah skematik per blok — status hunian & kepatuhan iuran bulan ini. Klik atau arahkan kursor ke tiap rumah untuk detail.
        </p>
      </div>

      <ClusterMapGrid houses={mapHouses} canEdit={session.user.role === "ADMIN"} />
    </div>
  );
}
