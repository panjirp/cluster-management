"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Nomor WhatsApp pengurus yang menerima notifikasi darurat (opsional).
// Jika kosong, pakai nomor pengurus pertama yang punya nomor.
export function EmergencyPhoneSetting({ currentPhone }: { currentPhone: string | null }) {
  const [phone, setPhone] = useState(currentPhone ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/emergency-phone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() || null }),
      });
      if (!res.ok) {
        toast.error("Gagal menyimpan nomor.");
        return;
      }
      toast.success("Nomor notifikasi darurat tersimpan.");
    } catch {
      toast.error("Gagal menyimpan nomor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
      <div className="min-w-52 flex-1 space-y-1.5">
        <Label htmlFor="emergency-phone">Nomor WA Notifikasi Darurat (opsional)</Label>
        <Input
          id="emergency-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xxxxxxxxxx"
        />
        <p className="text-xs text-muted-foreground">
          Kosongkan untuk memakai nomor pengurus pertama yang terdaftar.
        </p>
      </div>
      <Button disabled={saving} onClick={save}>
        {saving ? "Menyimpan..." : "Simpan"}
      </Button>
    </div>
  );
}
