"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkifiedText } from "@/components/shared/linkified-text";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string;
};

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "unread", label: "Belum Dibaca" },
] as const;

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(iso));
}

export function NotificationsList({
  initialNotifications,
}: {
  initialNotifications: NotificationRow[];
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.read) : notifications),
    [filter, notifications]
  );
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  async function markRead(n: NotificationRow) {
    if (n.read) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    try {
      await fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" });
    } catch {
      // silent
    }
  }

  function markAllRead() {
    startTransition(async () => {
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      try {
        await fetch("/api/notifications/read-all", { method: "PATCH" });
        router.refresh();
      } catch {
        // silent
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-lg border bg-card p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
              {f.value === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 text-xs">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={isPending}>
            <CheckCheck className="size-4" />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={filter === "unread" ? BellOff : Bell}
          title={filter === "unread" ? "Tidak ada notifikasi belum dibaca" : "Belum ada notifikasi"}
          description="Notifikasi pengumuman & aktivitas akan muncul di sini."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const content = (
              <Card
                className={`transition-all duration-200 hover:border-primary/40 ${
                  n.read ? "opacity-70" : "border-primary/30"
                }`}
              >
                <CardContent className="flex items-start gap-3 py-3.5">
                  <div className="mt-0.5 flex shrink-0 items-center">
                    {!n.read && <span className="size-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className={`text-sm font-semibold ${n.read ? "text-muted-foreground" : ""}`}>{n.title}</p>
                      {!n.read && <Badge className="text-[10px]">Baru</Badge>}
                    </div>
                    <p className="mt-0.5 whitespace-pre-line break-words text-sm text-muted-foreground">
                      <LinkifiedText text={n.body} />
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            );

            // Klik card hanya menandai dibaca — tidak redirect ke halaman lain.
            return (
              <div key={n.id} onClick={() => markRead(n)} className="cursor-pointer">
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
