import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { PermitsList, type PermitRow } from "@/components/permits/permits-list";

export const metadata: Metadata = { title: "Perizinan" };

export default async function PermitsPage() {
  const session = await requireUser();
  const isWarga = session.user.role === "WARGA";

  const permits = await prisma.permit.findMany({
    where: isWarga ? { createdById: session.user.id } : undefined,
    include: { createdBy: { select: { name: true, house: { select: { blockNumber: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const rows: PermitRow[] = permits.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    type: p.type,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    createdByName: p.createdBy.name,
    createdByBlock: p.createdBy.house?.blockNumber ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Perizinan</h1>
          <p className="text-sm text-muted-foreground">
            {isWarga ? "Daftar permohonan izin Anda" : "Semua permohonan izin warga"}
          </p>
        </div>
        {isWarga && <Button render={<Link href="/permits/new">Ajukan Izin</Link>} />}
      </div>

      <PermitsList permits={rows} isWarga={isWarga} />
    </div>
  );
}
