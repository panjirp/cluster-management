"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Photo = {
  id: string;
  filePath: string;
  caption: string | null;
  createdAt: string;
  event: { id: string; title: string } | null;
  uploaderName: string;
  canDelete: boolean;
};

export function GalleryGrid({ photos, events }: { photos: Photo[]; events: { id: string; title: string }[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const filtered = filter === "all" ? photos : photos.filter((p) => p.event?.id === filter);

  async function remove(photo: Photo) {
    if (!confirm("Hapus foto ini dari galeri?")) return;
    const res = await fetch(`/api/gallery/${photo.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Gagal menghapus foto.");
      return;
    }
    toast.success("Foto dihapus.");
    setLightbox(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">Filter acara:</p>
        <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Semua acara" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Foto</SelectItem>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{filtered.length} foto</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setLightbox(p)}
            className="group relative aspect-square overflow-hidden rounded-xl border bg-muted transition-all hover:border-primary/50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.filePath}
              alt={p.caption ?? "Foto galeri"}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {p.event && (
              <span className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-left text-[11px] font-medium text-white">
                {p.event.title}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada foto untuk filter ini.</p>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="max-h-full max-w-3xl space-y-3" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.filePath} alt={lightbox.caption ?? "Foto galeri"} className="max-h-[70vh] w-full rounded-xl object-contain" />
            <div className="flex flex-wrap items-center justify-between gap-2 text-white">
              <div className="min-w-0 text-sm">
                {lightbox.caption && <p className="font-medium">{lightbox.caption}</p>}
                <p className="text-xs text-white/70">
                  {lightbox.event ? `${lightbox.event.title} · ` : ""}
                  Diunggah oleh {lightbox.uploaderName} ·{" "}
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(lightbox.createdAt))}
                </p>
              </div>
              <div className="flex gap-2">
                {lightbox.canDelete && (
                  <Button variant="outline" size="sm" className="text-red-400" onClick={() => remove(lightbox)}>
                    <Trash2 className="size-4" /> Hapus
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setLightbox(null)}>
                  <X className="size-4" /> Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
