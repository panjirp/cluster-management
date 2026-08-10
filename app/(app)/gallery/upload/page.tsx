import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { BackLink } from "@/components/shared/back-link";
import { GalleryUploadForm } from "@/components/gallery/gallery-upload-form";

export const metadata: Metadata = { title: "Upload Foto" };

export default async function GalleryUploadPage() {
  await requireUser();
  const events = await prisma.event.findMany({ orderBy: { eventDate: "desc" }, take: 30, select: { id: true, title: true } });

  return (
    <div className="space-y-6">
      <BackLink href="/gallery" label="Kembali ke Galeri" />
      <div>
        <h1 className="text-2xl font-semibold">Upload Foto</h1>
        <p className="text-sm text-muted-foreground">Bagikan momen acara cluster dengan warga lain</p>
      </div>
      <GalleryUploadForm events={events} />
    </div>
  );
}
