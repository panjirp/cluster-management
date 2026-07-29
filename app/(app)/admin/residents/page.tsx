import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { ResidentsList } from "@/components/admin/residents-list";
import { compareBlockNumber } from "@/lib/sort";

export const metadata: Metadata = { title: "Data Warga" };

export default async function AdminResidentsPage() {
  const session = await requireAdmin();

  const [users, houses] = await Promise.all([
    prisma.user.findMany({
      include: { house: { select: { blockNumber: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.house.findMany(),
  ]);

  const houseOptions = houses
    .map((h) => ({ id: h.id, blockNumber: h.blockNumber }))
    .sort((a, b) => compareBlockNumber(a.blockNumber, b.blockNumber));

  const residents = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    houseId: user.houseId,
    houseBlock: user.house?.blockNumber ?? null,
    phone: user.phone,
    residencyStatus: user.residencyStatus,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Data Warga</h1>
        <p className="text-sm text-muted-foreground">Kelola akun warga, admin, dan bendahara</p>
      </div>

      <ResidentsList residents={residents} houses={houseOptions} sessionUserId={session.user.id} />
    </div>
  );
}
