import type { Metadata } from "next";
import { Images, Upload } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GalleryGrid } from "@/components/gallery/gallery-grid";

export const metadata: Metadata = { title: "Galeri Acara" };

export default async function GalleryPage() {
  const session = await requireUser();

  const [photos, events] = await Promise.all([
    prisma.galleryPhoto.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        event: { select: { id: true, title: true } },
        uploadedBy: { select: { name: true } },
      },
    }),
    prisma.event.findMany({ orderBy: { eventDate: "desc" }, take: 30, select: { id: true, title: true } }),
  ]);

  const serialized = photos.map((p) => ({
    id: p.id,
    filePath: p.filePath,
    caption: p.caption,
    createdAt: p.createdAt.toISOString(),
    event: p.event,
    uploaderName: p.uploadedBy.name,
    canDelete: session.user.role === "ADMIN" || p.uploadedById === session.user.id,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Galeri Acara</h1>
          <p className="text-sm text-muted-foreground">Momen & dokumentasi kegiatan cluster</p>
        </div>
        <Button render={<Link href="/gallery/upload">
          <Upload className="size-4" /> Upload Foto
        </Link>} />
      </div>

      {serialized.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/20">
              <Images className="size-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Belum ada foto. Jadilah yang pertama mengunggah momen acara cluster!
            </p>
          </CardContent>
        </Card>
      ) : (
        <GalleryGrid photos={serialized} events={events} />
      )}
    </div>
  );
}
