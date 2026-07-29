import Link from "next/link";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ComplaintsList, type ComplaintRow } from "@/components/complaints/complaints-list";

export const metadata: Metadata = { title: "Pengaduan" };

export default async function ComplaintsPage() {
  const session = await requireUser();
  const isWarga = session.user.role === "WARGA";
  const isAdmin = session.user.role === "ADMIN";

  const complaints = await prisma.complaint.findMany({
    where: isWarga ? { createdById: session.user.id } : undefined,
    include: { createdBy: { select: { name: true, house: { select: { blockNumber: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const rows: ComplaintRow[] = complaints.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    createdByName: c.createdBy.name,
    createdByBlock: c.createdBy.house?.blockNumber ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pengaduan</h1>
          <p className="text-sm text-muted-foreground">
            {isWarga ? "Daftar pengaduan yang Anda ajukan" : "Semua pengaduan warga"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isWarga && (
            <Button
              variant="outline"
              render={
                <a href="/api/complaints/export">
                  <Download data-icon="inline-start" />
                  Export CSV
                </a>
              }
            />
          )}
          {isWarga && <Button render={<Link href="/complaints/new">Buat Pengaduan</Link>} />}
        </div>
      </div>

      <ComplaintsList complaints={rows} isWarga={isWarga} canManage={isAdmin} />
    </div>
  );
}
