"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/shared/file-upload";

export function LetterForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [filePath, setFilePath] = useState("");
  const [notifyWarga, setNotifyWarga] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul surat wajib diisi.");
      return;
    }
    if (!filePath) {
      toast.error("Unggah file surat dulu.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), filePath, notifyWarga }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(typeof body?.error === "string" ? body.error : "Gagal menyimpan surat.");
        return;
      }
      toast.success(notifyWarga ? "Surat diterbitkan & notifikasi terkirim ke semua warga." : "Surat edaran diterbitkan.");
      setTitle("");
      setFilePath("");
      setNotifyWarga(false);
      router.refresh();
    } catch {
      toast.error("Gagal menyimpan surat.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="letter-title">Judul Surat</Label>
        <Input
          id="letter-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Surat Edaran HUT RI Ke-81"
        />
      </div>

      <div className="space-y-2">
        <Label>File Surat (PDF atau Gambar)</Label>
        <FileUpload id="letter-file" label="Unggah file PDF / gambar (JPG, PNG, WEBP)" value={filePath} onChange={setFilePath} />
        {filePath && /\.(jpe?g|png|webp)$/i.test(filePath) && (
          <img
            src={filePath}
            alt="Pratinjau surat"
            className="mt-2 max-h-48 w-auto rounded-lg border object-contain"
          />
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/40 p-3">
        <Checkbox
          checked={notifyWarga}
          onCheckedChange={(v) => setNotifyWarga(v === true)}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className="flex items-center gap-1.5 font-medium">
            <Megaphone className="size-4 text-primary" />
            Kirim notifikasi ke semua warga
          </span>
          <span className="text-xs text-muted-foreground">
            Warga akan dapat notifikasi + push di HP bahwa surat edaran baru terbit
          </span>
        </span>
      </label>

      <Button type="submit" disabled={submitting || !title.trim() || !filePath}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
        Terbitkan Surat
      </Button>
    </form>
  );
}
