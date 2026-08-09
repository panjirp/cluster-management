"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Form pengumuman: kirim notifikasi ke semua akun warga (muncul di lonceng
// notifikasi, dan di APK tampil sebagai push notification saat app dibuka).
export function BroadcastForm({ wargaCount }: { wargaCount: number }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!title.trim() || !body.trim()) {
      toast.error("Judul dan isi wajib diisi.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; sent?: number };
      if (!res.ok) {
        toast.error(data.error ?? "Gagal mengirim pengumuman.");
        return;
      }
      toast.success(`Pengumuman terkirim ke ${data.sent} akun warga.`);
      setTitle("");
      setBody("");
      setUrl("");
    } catch {
      toast.error("Gagal mengirim pengumuman.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-xl space-y-3 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="bc-title">Judul</Label>
        <Input
          id="bc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Jadwal Gotong Royong"
          maxLength={120}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bc-body">Isi Pengumuman</Label>
        <Textarea
          id="bc-body"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tulis isi pengumuman untuk seluruh warga…"
          maxLength={1000}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bc-url">Tautan (opsional)</Label>
        <Input
          id="bc-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/events"
        />
        <p className="text-xs text-muted-foreground">
          Saat notifikasi ditekan, warga dibawa ke halaman ini (mis. /events atau /cash/dues).
        </p>
      </div>
      <Button disabled={sending || wargaCount === 0} onClick={send}>
        {sending ? "Mengirim..." : `Kirim ke ${wargaCount} Akun Warga`}
      </Button>
    </div>
  );
}
