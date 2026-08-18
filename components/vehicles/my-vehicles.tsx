"use client";

import { useState, useCallback, useEffect } from "react";
import { Car, Loader2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Vehicle = { id: string; plateNumber: string; vehicleType: string; ownerName: string | null; active: boolean };

export function MyVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ plateNumber: "", vehicleType: "MOBIL", ownerName: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/my-vehicles");
      if (res.ok) setVehicles(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/my-vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plateNumber: form.plateNumber.trim(),
          vehicleType: form.vehicleType,
          ownerName: form.ownerName.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Plat kendaraan terdaftar!");
        setForm({ plateNumber: "", vehicleType: "MOBIL", ownerName: "" });
        load();
      } else {
        const b = await res.json().catch(() => ({}));
        toast.error(b?.error ?? "Gagal mendaftarkan.");
      }
    } catch {
      toast.error("Gagal mendaftarkan.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus kendaraan ini?")) return;
    const res = await fetch(`/api/my-vehicles/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Dihapus."); load(); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-2">
            <Car className="size-5 text-primary" />
            <h2 className="font-semibold tracking-tight">Daftarkan Kendaraan</h2>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <Input value={form.plateNumber} onChange={(e) => setForm((f) => ({ ...f, plateNumber: e.target.value }))} placeholder="Plat nomor (mis. B 1234 XYZ)" required />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.vehicleType} onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="MOBIL">Mobil</option>
                <option value="MOTOR">Motor</option>
              </select>
              <Input value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))} placeholder="Nama pemilik (opsional)" />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? (<><Loader2 className="mr-2 size-4 animate-spin" /> Mendaftarkan...</>) : (<><Plus className="mr-2 size-4" /> Daftarkan</>)}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Plat yang terdaftar akan dikenali sistem gerbang otomatis (boomgate) saat masuk cluster.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
      ) : vehicles.length === 0 ? (
        <Card><CardContent className="py-10 text-center">
          <p className="font-semibold">Belum ada kendaraan terdaftar</p>
          <p className="text-sm text-muted-foreground">Daftarkan plat kendaraanmu di atas.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {vehicles.map((v) => (
            <Card key={v.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Car className="size-5" /></div>
                  <div>
                    <p className="font-mono font-semibold">{v.plateNumber}</p>
                    <p className="text-xs text-muted-foreground">{v.vehicleType === "MOBIL" ? "Mobil" : "Motor"}{v.ownerName ? ` · ${v.ownerName}` : ""}</p>
                  </div>
                </div>
                <Badge variant={v.active ? "default" : "secondary"}>{v.active ? "Aktif" : "Nonaktif"}</Badge>
                <button onClick={() => remove(v.id)} className="text-muted-foreground hover:text-red-500" aria-label="Hapus">
                  <Trash2 className="size-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
