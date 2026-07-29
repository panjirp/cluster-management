import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { BackLink } from "@/components/shared/back-link";
import { PermitStatusBadge } from "@/components/permits/permit-status-badge";
import { PermitStatusForm } from "@/components/permits/permit-status-form";
import { permitTypeLabels } from "@/lib/validations/permit";

function formatDate(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const permit = await prisma.permit.findUnique({ where: { id }, select: { title: true } });
  return { title: permit?.title ?? "Perizinan" };
}

export default async function PermitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  const permit = await prisma.permit.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, house: { select: { blockNumber: true } } } },
      assetBookings: { include: { asset: true } },
    },
  });

  if (!permit) notFound();
  if (session.user.role === "WARGA" && permit.createdById !== session.user.id) {
    redirect("/permits");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <BackLink href="/permits" label="Kembali ke Perizinan" />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{permit.title}</h1>
          <p className="text-sm text-muted-foreground">
            {permitTypeLabels[permit.type]} · {permit.createdBy.name}
            {permit.createdBy.house ? ` (${permit.createdBy.house.blockNumber})` : ""}
          </p>
          {(permit.startDate || permit.endDate) && (
            <p className="text-sm text-muted-foreground">
              {formatDate(permit.startDate)}
              {permit.endDate ? ` – ${formatDate(permit.endDate)}` : ""}
            </p>
          )}
        </div>
        <PermitStatusBadge status={permit.status} />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Deskripsi</p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{permit.description}</p>
      </div>

      {permit.adminNotes && (
        <div className="space-y-1 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">Catatan Pengurus</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{permit.adminNotes}</p>
        </div>
      )}

      {permit.assetBookings.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Aset Dipinjam</p>
          <p className="text-sm text-muted-foreground">
            {permit.assetBookings.map((b) => b.asset.name).join(", ")}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-sm">
        {permit.supportingDocUrl && (
          <a href={permit.supportingDocUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            Dokumen Pendukung
          </a>
        )}
        {permit.neighborConsentUrl && (
          <a href={permit.neighborConsentUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            Foto Izin Tetangga
          </a>
        )}
        {permit.finalDocUrl && (
          <a href={permit.finalDocUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            Unduh Surat Izin Resmi (PDF)
          </a>
        )}
      </div>

      {session.user.role === "ADMIN" && (
        <PermitStatusForm permitId={permit.id} currentStatus={permit.status} currentNotes={permit.adminNotes} />
      )}
    </div>
  );
}
