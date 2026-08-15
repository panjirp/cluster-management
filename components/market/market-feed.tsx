"use client";

import { useState, useCallback, useEffect } from "react";
import { Store, Loader2, Trash2, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  category: string;
  imagePath: string | null;
  status: string;
  sellerId: string;
  sellerName: string;
  sellerHouse: string | null;
};

const CATEGORIES = [
  { value: "BARANG", label: "Barang" },
  { value: "JASA", label: "Jasa" },
  { value: "MAKANAN", label: "Makanan" },
  { value: "LAINNYA", label: "Lainnya" },
];

function rupiah(n: number | null) {
  if (n == null) return "Gratis / Nego";
  return "Rp " + n.toLocaleString("id-ID");
}

function catLabel(v: string) {
  return CATEGORIES.find((c) => c.value === v)?.label ?? v;
}

export function MarketFeed({ currentUserId }: { currentUserId: string }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", price: "", category: "BARANG" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/market");
      if (res.ok) setListings(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Judul wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          price: form.price ? Number(form.price) : undefined,
          category: form.category,
        }),
      });
      if (!res.ok) throw new Error("gagal");
      toast.success("Listing terpasang!");
      setForm({ title: "", description: "", price: "", category: "BARANG" });
      load();
    } catch {
      toast.error("Gagal memasang listing.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(id: string) {
    try {
      const res = await fetch(`/api/market/${id}`, { method: "PATCH" });
      if (res.ok) load();
    } catch {
      // silent
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus listing ini?")) return;
    try {
      const res = await fetch(`/api/market/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Listing dihapus.");
        load();
      }
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-2">
            <Store className="size-5 text-primary" />
            <h2 className="font-semibold tracking-tight">Pasang Jualan / Jasa</h2>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Judul (mis. Jual sepeda anak)" />
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Deskripsi..." rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="Harga (Rp)" type="number" />
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? (<><Loader2 className="mr-2 size-4 animate-spin" /> Memasang...</>) : "Pasang"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Listings */}
      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
      ) : listings.length === 0 ? (
        <Card><CardContent className="py-14 text-center">
          <p className="font-semibold">Belum ada listing</p>
          <p className="text-sm text-muted-foreground">Jadi yang pertama memasang jualan!</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <Card key={l.id} className={l.status === "TERJUAL" ? "opacity-60" : ""}>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{l.title}</p>
                    <Badge variant="secondary" className="mt-1">{catLabel(l.category)}</Badge>
                  </div>
                  {l.status === "TERJUAL" ? (
                    <Badge className="bg-green-600">Terjual</Badge>
                  ) : (
                    <Badge variant="outline">Aktif</Badge>
                  )}
                </div>
                {l.description && <p className="line-clamp-2 text-sm text-muted-foreground">{l.description}</p>}
                <p className="font-bold text-primary">{rupiah(l.price)}</p>
                <p className="text-xs text-muted-foreground">
                  {l.sellerName}{l.sellerHouse ? ` · ${l.sellerHouse}` : ""}
                </p>
                {l.sellerId === currentUserId && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => toggle(l.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                      {l.status === "TERJUAL" ? (<><CheckCircle2 className="size-3.5" /> Aktifkan</>) : (<><Circle className="size-3.5" /> Tandai Terjual</>)}
                    </button>
                    <button onClick={() => remove(l.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500">
                      <Trash2 className="size-3.5" /> Hapus
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
