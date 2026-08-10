"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";

export function GalleryUploadForm({ events }: { events: { id: string; title: string }[] }) {
  const router = useRouter();
  const [filePath, setFilePath] = useState("");
  const [caption, setCaption] = useState("");
  const [eventId, setEventId] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!filePath) {
      toast.error("Pilih foto yang akan diunggah.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, caption: caption.trim() || null, eventId: eventId || null }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(body.error ?? "Gagal mengunggah foto.");
      return;
    }
    toast.success("Foto berhasil diunggah.");
    router.push("/gallery");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-4">
      <FileUpload id="gallery-photo" label="Foto" value={filePath} onChange={setFilePath} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="gallery-caption">Caption (opsional)</Label>
        <Input id="gallery-caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Contoh: Lomba 17 Agustus" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="gallery-event">Acara (opsional)</Label>
        <Select value={eventId} onValueChange={(v) => setEventId(v ?? "")}>
          <SelectTrigger id="gallery-event">
            <SelectValue placeholder="Tidak terkait acara tertentu" />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={submit} disabled={busy}>
        {busy ? "Mengunggah..." : "Upload ke Galeri"}
      </Button>
    </div>
  );
}
