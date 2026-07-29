"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function FileUpload({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value?: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/uploads", { method: "POST", body: formData });
    setUploading(false);

    if (!res.ok) {
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal mengunggah file.");
      return;
    }

    const { url } = await res.json();
    onChange(url);
    toast.success("File berhasil diunggah.");
  }

  function handleRemove() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onChange("");
  }

  const displayUrl = previewUrl ?? value;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>

      {displayUrl ? (
        <div className="relative w-fit">
          <a href={value ?? previewUrl ?? undefined} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt={label}
              className="h-28 w-28 rounded-lg border object-cover"
              style={uploading ? { opacity: 0.6 } : undefined}
            />
          </a>
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              Mengunggah…
            </span>
          )}
          {!uploading && (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Hapus foto"
              title="Hapus foto"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 rounded-full bg-background"
            >
              <X />
            </Button>
          )}
        </div>
      ) : (
        <Input id={id} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} disabled={uploading} />
      )}
    </div>
  );
}
