import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { BackLink } from "@/components/shared/back-link";
import { ParcelForm } from "@/components/parcels/parcel-form";

export const metadata: Metadata = { title: "Catat Paket Masuk" };

export default async function NewParcelPage() {
  const session = await requireAdmin();
  if (session.user.role !== "ADMIN") redirect("/parcels");

  const houses = await prisma.house.findMany({
    orderBy: { blockNumber: "asc" },
    select: { id: true, blockNumber: true, residentName: true },
  });

  return (
    <div className="space-y-6">
      <BackLink href="/parcels" label="Kembali ke Titip Paket" />
      <div>
        <h1 className="text-2xl font-semibold">Catat Paket Masuk</h1>
        <p className="text-sm text-muted-foreground">
          Catat paket yang dititipkan di pos satpam — warga langsung diberi notifikasi
        </p>
      </div>
      <ParcelForm houses={houses} />
    </div>
  );
}
