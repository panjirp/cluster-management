import type { Metadata } from "next";
import { Flame, Heart, Camera } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "FYP Cluster" };

export default async function FypPage() {
  const session = await requireUser();
  const me = session.user;

  const photos = await prisma.galleryPhoto.findMany({
    include: {
      uploadedBy: { select: { name: true, house: { select: { blockNumber: true } } } },
      event: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Flame className="size-6 text-primary" /> FYP Cluster
        </h1>
        <p className="text-sm text-muted-foreground">
          Feed konten & momen warga Barcelona Cove — scroll, like, dan rasakan vibes cluster!
        </p>
      </div>

      {photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Camera className="size-7" />
            </div>
            <p className="text-sm font-semibold">Belum ada konten</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Unggah momen kegiatan melalui menu Galeri Acara. Konten warga akan tampil di sini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <Card key={p.id} className="group overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-md">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.filePath}
                  alt={p.caption ?? "Konten warga"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <CardContent className="space-y-2 py-3">
                {p.caption && <p className="line-clamp-2 text-sm">{p.caption}</p>}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">
                    {p.uploadedBy.name}
                    {p.uploadedBy.house?.blockNumber ? ` · ${p.uploadedBy.house.blockNumber}` : ""}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {p.event?.title ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{p.event.title}</span> : null}
                    <Heart className="size-3.5 text-muted-foreground/50" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        💡 Punya momen seru? Upload lewat <span className="font-medium">Galeri Acara</span> biar masuk feed FYP Cluster.
      </p>
    </div>
  );
}
