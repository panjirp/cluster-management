import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { BackLink } from "@/components/shared/back-link";
import { ComplaintStatusBadge } from "@/components/complaints/complaint-status-badge";
import { ComplaintStatusForm } from "@/components/complaints/complaint-status-form";
import { PhotoLightbox } from "@/components/complaints/photo-lightbox";
import { complaintCategoryLabels } from "@/lib/validations/complaint";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const complaint = await prisma.complaint.findUnique({ where: { id }, select: { title: true } });
  return { title: complaint?.title ?? "Pengaduan" };
}

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true, house: { select: { blockNumber: true } } } } },
  });

  if (!complaint) notFound();
  if (session.user.role === "WARGA" && complaint.createdById !== session.user.id) {
    redirect("/complaints");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <BackLink href="/complaints" label="Kembali ke Pengaduan" />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{complaint.title}</h1>
          <p className="text-sm text-muted-foreground">
            {complaintCategoryLabels[complaint.category]} · {complaint.createdBy.name}
            {complaint.createdBy.house ? ` (${complaint.createdBy.house.blockNumber})` : ""}
          </p>
        </div>
        <ComplaintStatusBadge status={complaint.status} />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Deskripsi</p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
      </div>

      {complaint.photoUrl && <PhotoLightbox src={complaint.photoUrl} alt="Foto bukti pengaduan" />}

      {complaint.response && (
        <div className="space-y-1 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">Tanggapan Pengurus</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{complaint.response}</p>
        </div>
      )}

      {session.user.role === "ADMIN" && (
        <ComplaintStatusForm
          complaintId={complaint.id}
          currentStatus={complaint.status}
          currentResponse={complaint.response}
        />
      )}
    </div>
  );
}
