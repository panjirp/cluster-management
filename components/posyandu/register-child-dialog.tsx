"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function RegisterChildDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    gender: "",
    birthWeight: "",
    birthLength: "",
    nik: "",
    allergies: "",
  });

  function reset() {
    setForm({ name: "", birthDate: "", gender: "", birthWeight: "", birthLength: "", nik: "", allergies: "" });
  }

  async function handleSubmit() {
    if (!form.name.trim()) { toast.error("Nama anak wajib diisi."); return; }
    if (!form.birthDate) { toast.error("Tanggal lahir wajib diisi."); return; }
    if (!form.gender) { toast.error("Jenis kelamin wajib dipilih."); return; }

    setLoading(true);
    const res = await fetch("/api/posyandu/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        birthDate: form.birthDate,
        gender: form.gender,
        birthWeight: form.birthWeight ? parseFloat(form.birthWeight) : undefined,
        birthLength: form.birthLength ? parseFloat(form.birthLength) : undefined,
        nik: form.nik.trim() || undefined,
        allergies: form.allergies.trim() || undefined,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal mendaftarkan anak.");
      return;
    }

    toast.success("Anak berhasil didaftarkan.");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger render={children as any} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daftarkan Anak</DialogTitle>
          <DialogDescription>
            Isi data anak untuk didaftarkan ke Posyandu. Data akan diverifikasi oleh admin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="child-name">Nama Anak *</Label>
            <Input
              id="child-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nama lengkap anak"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="child-birthDate">Tanggal Lahir *</Label>
            <Input
              id="child-birthDate"
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="child-gender">Jenis Kelamin *</Label>
            <Select
              items={[
                { value: "LAKI_LAKI", label: "Laki-laki" },
                { value: "PEREMPUAN", label: "Perempuan" },
              ]}
              value={form.gender}
              onValueChange={(v) => v && setForm((f) => ({ ...f, gender: v }))}
            >
              <SelectTrigger id="child-gender" className="w-full">
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="child-nik">NIK</Label>
            <Input
              id="child-nik"
              value={form.nik}
              onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value }))}
              placeholder="Nomor Induk Kependudukan"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="child-birthWeight">Berat Lahir (kg)</Label>
              <Input
                id="child-birthWeight"
                type="number"
                step="0.1"
                min="0"
                value={form.birthWeight}
                onChange={(e) => setForm((f) => ({ ...f, birthWeight: e.target.value }))}
                placeholder="3.2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="child-birthLength">Panjang Lahir (cm)</Label>
              <Input
                id="child-birthLength"
                type="number"
                step="0.1"
                min="0"
                value={form.birthLength}
                onChange={(e) => setForm((f) => ({ ...f, birthLength: e.target.value }))}
                placeholder="50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="child-allergies">Alergi</Label>
            <Input
              id="child-allergies"
              value={form.allergies}
              onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
              placeholder="Contoh: telur, kacang"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Mendaftarkan..." : "Daftarkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
