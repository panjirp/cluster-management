"use client";

import { useState } from "react";
import { Coins } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function CoveCoinAdmin() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; house: string | null }[]>([]);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  async function searchUsers(q: string) {
    setSearch(q);
    if (!q.trim()) { setResults([]); return; }
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
    if (res.ok) setResults(await res.json());
  }

  async function submit() {
    if (!selected || !amount) {
      toast.error("Pilih warga & isi jumlah.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/covecoin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, amount: Number(amount), description: desc.trim() || null }),
      });
      if (res.ok) {
        toast.success("CoveCoin tercatat!");
        setAmount("");
        setDesc("");
        setSelected(null);
        setSearch("");
        setResults([]);
      } else {
        const b = await res.json().catch(() => ({}));
        toast.error(b?.error ?? "Gagal.");
      }
    } catch {
      toast.error("Gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-2">
          <Coins className="size-5 text-primary" />
          <h2 className="font-semibold tracking-tight">Kelola CoveCoin</h2>
        </div>

        <div className="relative">
          <Input value={search} onChange={(e) => searchUsers(e.target.value)} placeholder="Cari nama warga..." />
          {results.length > 0 && !selected && (
            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border bg-popover shadow-lg">
              {results.map((u) => (
                <button key={u.id} onClick={() => { setSelected({ id: u.id, name: u.name }); setResults([]); setSearch(u.name); }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted">
                  <span className="font-medium">{u.name}</span>
                  {u.house && <span className="text-xs text-muted-foreground">{u.house}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="rounded-lg border bg-muted/40 p-2 text-sm">
            Dipilih: <span className="font-semibold">{selected.name}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Jumlah (+ tambah / - kurang)" type="number" />
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Keterangan (opsional)" />
        </div>
        <p className="text-xs text-muted-foreground">
          ⚠️ Jumlah negatif (mis. -5000) = potong/redeem. Positif = tambah hadiah.
        </p>
        <Button onClick={submit} disabled={busy}>{busy ? "Menyimpan..." : "Catat CoveCoin"}</Button>
      </CardContent>
    </Card>
  );
}
