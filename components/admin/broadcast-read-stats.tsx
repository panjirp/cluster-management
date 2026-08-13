"use client";

import { useState } from "react";
import { Eye, EyeOff, Megaphone, Loader2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BroadcastItem {
  id: string;
  title: string;
  createdAt: string;
  total: number;
}

interface Detail {
  title: string;
  total: number;
  readCount: number;
  unreadCount: number;
  read: { name: string; house: string | null }[];
  unread: { name: string; house: string | null }[];
}

export function BroadcastReadStats({ broadcasts }: { broadcasts: BroadcastItem[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);

  async function openDetail(id: string) {
    setOpen(true);
    setLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/notifications/${id}`);
      if (res.ok) setDetail(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function fmt(iso: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
  }

  if (broadcasts.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="size-5 text-primary" />
            <h2 className="font-semibold tracking-tight">Riwayat Pengumuman</h2>
          </div>
          <span className="text-xs text-muted-foreground">{broadcasts.length} pengumuman</span>
        </div>

        <div className="space-y-2">
          {broadcasts.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{b.title}</p>
                <p className="text-xs text-muted-foreground">
                  {fmt(b.createdAt)} · {b.total} warga
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openDetail(b.id)}>
                <Users className="mr-1 size-3.5" />
                Siapa yang baca
              </Button>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail ? detail.title : "Detail Pembaca"}</DialogTitle>
            <DialogDescription>
              {detail
                ? `Statistik: ${detail.readCount} baca · ${detail.unreadCount} belum · ${detail.total} total warga`
                : "Mengambil data..."}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {/* Sudah baca */}
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400">
                  <Eye className="size-4" /> Sudah Baca ({detail.readCount})
                </div>
                {detail.read.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada yang membaca.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {detail.read.map((r, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {r.name}{r.house ? ` · ${r.house}` : ""}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Belum baca */}
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <EyeOff className="size-4" /> Belum Baca ({detail.unreadCount})
                </div>
                {detail.unread.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Semua warga sudah membaca.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {detail.unread.map((r, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {r.name}{r.house ? ` · ${r.house}` : ""}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Gagal mengambil data pengumuman.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
