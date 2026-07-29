import Link from "next/link";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { PermitsList, type PermitRow } from "@/components/permits/permits-list";

export const metadata: Metadata = { title: "Perizinan" };

export default async function PermitsPage() {
  const session = await requireUser();
  const isWarga = session.user.role === "WARGA";
  const isAdmin = session.user.role === "ADMIN";

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Perizinan</h1>
          <p className="text-sm text-muted-foreground">
            {isWarga ? "Daftar permohonan izin Anda" : "Semua permohonan izin warga"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isWarga && (
            <Button
              variant="outline"
              render={
                <a href="/api/permits/export">
                  <Download data-icon="inline-start" />
                  Export CSV
                </a>
              }
            />
          )}
          {isWarga && <Button render={<Link href="/permits/new">Ajukan Izin</Link>} />}
        </div>
      </div>

      <PermitsList permits={rows} isWarga={isWarga} canManage={isAdmin} />
    </div>
  );
}
