"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function isImage(path: string): boolean {
  return /\.(jpe?g|png|webp|gif)$/i.test(path);
}

/**
 * Preview bukti pembayaran:
 * - Gambar → thumbnail kecil; klik → lightbox besar yang menyesuaikan layar.
 * - PDF/file lain → ikon + nama file; klik → buka di tab baru.
 */
export function ProofImagePreview({
  filePath,
  fileName,
}: {
  filePath: string | null;
  fileName: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (!filePath) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  if (isImage(filePath)) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={filePath}
            alt={fileName ?? "Bukti pembayaran"}
            className="h-12 w-16 cursor-pointer rounded-md border object-cover transition hover:opacity-80"
            loading="lazy"
          />
        </DialogTrigger>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate text-base">{fileName ?? "Bukti Pembayaran"}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[70vh] items-start justify-center overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={filePath}
              alt={fileName ?? "Bukti pembayaran"}
              className="h-auto max-h-[65vh] w-auto max-w-full rounded-lg object-contain"
            />
          </div>
          <div className="flex justify-end gap-2 text-sm">
            <a
              href={filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              Buka di tab baru ↗
            </a>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // PDF / file lain
  return (
    <a
      href={filePath}
      target="_blank"
      rel="noopener noreferrer"
      className="flex max-w-[180px] items-center gap-1.5 truncate text-sm text-primary hover:underline"
      title={fileName ?? filePath}
    >
      <FileText className="size-4 shrink-0" />
      <span className="truncate">{fileName ?? "Lihat file"}</span>
    </a>
  );
}
