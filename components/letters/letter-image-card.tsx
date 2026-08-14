"use client";

import { useState } from "react";
import { ExternalLink, X, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

// Penampil surat edaran: klik foto -> tampil dalam card (lightbox), bukan loncat tab baru
export function LetterImageCard({
  src,
  alt,
  title,
  date,
}: {
  src: string;
  alt: string;
  title: string;
  date: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Thumbnail — klik untuk buka card penuh */}
      <div
        className="group relative max-h-56 w-full cursor-zoom-in overflow-hidden border-t"
        onClick={() => setOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="h-56 w-full object-contain bg-black/5 transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-black shadow">
            <ZoomIn className="size-4" /> Perbesar
          </span>
        </div>
      </div>

      {/* Card penuh (lightbox) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden border-0 bg-transparent p-0 sm:max-w-3xl">
          <div className="overflow-hidden rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{date}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <ExternalLink className="size-4" /> Buka File
                </a>
                <button
                  onClick={() => setOpen(false)}
                  className="grid size-9 place-items-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Tutup"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[calc(90vh-72px)] overflow-y-auto">
              <img src={src} alt={alt} className="h-auto w-full object-contain" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
