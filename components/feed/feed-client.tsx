"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Flame, CalendarDays, Megaphone, Store, Loader2, Rss } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type FeedItem = {
  id: string;
  type: "fyp" | "event" | "announcement" | "market";
  title: string;
  body: string;
  image?: string | null;
  actor?: string;
  url?: string;
  createdAt: string;
};

const ICON: Record<string, React.ReactNode> = {
  fyp: <Flame className="size-4 text-orange-500" />,
  event: <CalendarDays className="size-4 text-primary" />,
  announcement: <Megaphone className="size-4 text-amber-500" />,
  market: <Store className="size-4 text-purple-500" />,
};

const LABEL: Record<string, string> = {
  fyp: "Momen",
  event: "Acara",
  announcement: "Pengumuman",
  market: "Jual Beli",
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const days = Math.floor(h / 24);
  return `${days} hari lalu`;
}

export function FeedClient() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/feed");
      if (res.ok) setItems(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-14 text-center">
          <p className="font-semibold">Belum ada aktivitas</p>
          <p className="text-sm text-muted-foreground">Aktivitas warga akan muncul di sini.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const inner = (
              <div className="flex gap-3">
                <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-muted">{ICON[it.type]}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{LABEL[it.type]}</span>
                    <span className="text-xs text-muted-foreground/70">· {timeAgo(it.createdAt)}</span>
                  </div>
                  <p className="truncate font-medium">{it.title}</p>
                  {it.body && <p className="truncate text-sm text-muted-foreground">{it.body}</p>}
                  {it.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt="" className="mt-2 h-24 w-full rounded-lg object-cover" />
                  )}
                </div>
              </div>
            );

            return it.url ? (
              <Link key={it.id} href={it.url} className="block rounded-lg border p-3 transition-colors hover:border-primary/40">
                {inner}
              </Link>
            ) : (
              <div key={it.id} className="rounded-lg border p-3">{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
