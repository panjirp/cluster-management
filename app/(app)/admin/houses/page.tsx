import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { HousesList } from "@/components/admin/houses-list";
import { compareBlockNumber } from "@/lib/sort";

export const metadata: Metadata = { title: "Data Rumah" };

export default async function AdminHousesPage() {
  const houses = (
    await prisma.house.findMany({
      include: { residents: { select: { id: true, name: true, role: true } } },
    })
  ).sort((a, b) => compareBlockNumber(a.blockNumber, b.blockNumber));

  const rows = houses.map((house) => ({
    id: house.id,
    blockNumber: house.blockNumber,
    statusHuni: house.statusHuni,
    contactPhone: house.contactPhone,
    residentNames: house.residents.map((r) => r.name).join(", ") || house.residentName || "",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Data Rumah</h1>
        <p className="text-sm text-muted-foreground">
          Kelola daftar rumah/blok, ubah status hunian lewat dropdown di tiap kartu
        </p>
      </div>

      <HousesList houses={rows} />
    </div>
  );
}
