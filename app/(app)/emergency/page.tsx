import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { EmergencyButton } from "@/components/emergency/emergency-button";
import { EmergencyDirectory } from "@/components/emergency/emergency-directory";

export const metadata: Metadata = { title: "Tombol Darurat" };

export default async function EmergencyPage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { house: { select: { blockNumber: true } } },
  });
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Tombol Darurat</h1>
          <p className="text-sm text-muted-foreground">
            Tekan tombol ini jika terjadi keadaan darurat. Pengurus akan langsung mendapat notifikasi
            {user.house ? ` untuk Blok ${user.house.blockNumber}` : ""}.
          </p>
        </div>

        <EmergencyButton blockNumber={user.house?.blockNumber ?? null} />
      </div>

      <EmergencyDirectory />
    </div>
  );
}
