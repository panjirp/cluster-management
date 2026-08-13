"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

export const IMMUNIZATION_OPTIONS = [
  { value: "HB0", label: "HB0 (0-24 jam)" },
  { value: "BCG", label: "BCG" },
  { value: "POLIO_1", label: "Polio 1" },
  { value: "POLIO_2", label: "Polio 2" },
  { value: "POLIO_3", label: "Polio 3" },
  { value: "POLIO_4", label: "Polio 4" },
  { value: "DPT_1", label: "DPT-HB-Hib 1" },
  { value: "DPT_2", label: "DPT-HB-Hib 2" },
  { value: "DPT_3", label: "DPT-HB-Hib 3" },
  { value: "IPV", label: "IPV" },
  { value: "CAMPAK", label: "Campak/MR" },
  { value: "JE", label: "Japanese Encephalitis" },
];

const VITAMIN_OPTIONS = [
  { value: "Vitamin A Biru (6-11 bulan)", label: "Vitamin A Biru (6-11 bulan)" },
  { value: "Vitamin A Merah (12-59 bulan)", label: "Vitamin A Merah (12-59 bulan)" },
  { value: "Vitamin D", label: "Vitamin D" },
  { value: "Zinc", label: "Zinc" },
];

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
    vitaminsOther: "",
    notes: "",
  });
  const [immunizations, setImmunizations] = useState<string[]>([]);
  const [vitamins, setVitamins] = useState<string[]>([]);

  function reset() {
    setForm({ name: "", birthDate: "", gender: "", birthWeight: "", birthLength: "", nik: "", allergies: "", vitaminsOther: "", notes: "" });
    setImmunizations([]);
    setVitamins([]);
  }

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleSubmit() {
    if (!form.name.trim()) { toast.error("Nama anak wajib diisi."); return; }
    if (!form.birthDate) { toast.error("Tanggal lahir wajib diisi."); return; }
    if (!form.gender) { toast.error("Jenis kelamin wajib dipilih."); return; }

    const allVitamins = [
      ...vitamins,
      ...(form.vitaminsOther.trim() ? form.vitaminsOther.trim().split(",").map((s) => s.trim()).filter(Boolean) : []),
    ];

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
        immunizationsDone: immunizations,
        vitamins: allVitamins.join(", ") || undefined,
        notes: form.notes.trim() || undefined,
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

          {/* Imunisasi yang sudah diterima */}
          <div className="space-y-2">
            <Label>Imunisasi yang Sudah Diterima</Label>
            <p className="text-xs text-muted-foreground">Centang imunisasi yang sudah pernah didapat anak.</p>
            <div className="grid grid-cols-2 gap-1.5 rounded-lg border p-3">
              {IMMUNIZATION_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={immunizations.includes(opt.value)}
                    onCheckedChange={() => toggle(immunizations, setImmunizations, opt.value)}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Vitamin yang sudah diterima */}
          <div className="space-y-2">
            <Label>Vitamin yang Sudah Diterima</Label>
            <div className="grid grid-cols-1 gap-1.5 rounded-lg border p-3">
              {VITAMIN_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={vitamins.includes(opt.value)}
                    onCheckedChange={() => toggle(vitamins, setVitamins, opt.value)}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
            <Input
              value={form.vitaminsOther}
              onChange={(e) => setForm((f) => ({ ...f, vitaminsOther: e.target.value }))}
              placeholder="Vitamin lain (pisahkan koma, opsional)"
            />
          </div>

          {/* Keterangan */}
          <div className="space-y-2">
            <Label htmlFor="child-notes">Keterangan</Label>
            <Textarea
              id="child-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Keterangan tambahan, mis. riwayat kelahiran, kondisi khusus, dll."
              rows={3}
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
