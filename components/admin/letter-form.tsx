"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/shared/file-upload";

export function LetterForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [filePath, setFilePath] = useState("");
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
        body: JSON.stringify({ title: title.trim(), filePath }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(typeof body?.error === "string" ? body.error : "Gagal menyimpan surat.");
        return;
      }
      toast.success("Surat edaran diterbitkan.");
      setTitle("");
      setFilePath("");
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
        <Label>File Surat (PDF)</Label>
        <FileUpload id="letter-file" label="Unggah file PDF" value={filePath} onChange={setFilePath} />
      </div>

      <Button type="submit" disabled={submitting || !title.trim() || !filePath}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
        Terbitkan Surat
      </Button>
    </form>
  );
}
