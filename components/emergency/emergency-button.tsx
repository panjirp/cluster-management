"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Siren, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EmergencyButton({ blockNumber }: { blockNumber: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Gagal mengirim sinyal darurat.");
        return;
      }
      toast.success("Sinyal darurat terkirim ke pengurus!");
      setOpen(false);
      setMessage("");
      router.refresh();
    } catch {
      toast.error("Gagal mengirim sinyal darurat.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              size="lg"
              className="h-40 w-full flex-col gap-3 rounded-3xl bg-red-600 text-lg font-semibold shadow-lg shadow-red-600/30 hover:bg-red-700 active:scale-95"
            />
          }
        >
          <Siren className="size-10" />
          TEKAN UNTUK DARURAT
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="size-5 text-red-600" />
              Yakin ingin mengirim sinyal darurat?
            </DialogTitle>
            <DialogDescription>
              ⚠️ Tombol ini hanya boleh ditekan jika <strong>benar-benar darurat</strong> — seperti kebakaran,
              kecelakaan, atau keadaan yang membahayakan keselamatan. Pengurus akan langsung mendapat notifikasi
              {blockNumber ? ` untuk Blok ${blockNumber}` : ""} dan segera menghubungimu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="msg">Keterangan (opsional)</Label>
            <Textarea
              id="msg"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Contoh: ada kebakaran / kecelakaan / keadaan mendesak…"
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" disabled={sending} onClick={send}>
              {sending ? "Mengirim..." : "Ya, Kirim Sinyal Darurat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-center text-xs text-muted-foreground">
        ⚠️ Gunakan hanya untuk keadaan darurat yang membutuhkan tindakan cepat pengurus.
      </p>
    </div>
  );
}
