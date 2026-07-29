"use client";

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function PhotoLightbox({ src, alt }: { src: string; alt: string }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="max-w-sm cursor-zoom-in rounded-lg border" />
        }
      />
      <DialogContent className="sm:max-w-3xl" showCloseButton>
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-h-[80vh] w-full rounded-lg object-contain" />
      </DialogContent>
    </Dialog>
  );
}
