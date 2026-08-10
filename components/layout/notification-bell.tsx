"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function fullDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationRow[];
  initialUnreadCount: number;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [detail, setDetail] = useState<NotificationRow | null>(null);

  // The navbar (and this bell) stays mounted across page navigations, but
  // each navigation re-fetches notifications server-side and passes fresh
  // props — sync local state to those on every change, otherwise the first
  // render's data would stick around forever.
  useEffect(() => {
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }, [initialNotifications, initialUnreadCount]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  }

  // Klik item di dropdown → tandai dibaca lalu buka card detail (isi lengkap).
  function openDetail(notification: NotificationRow) {
    if (!notification.read) markRead(notification.id);
    setDetail(notification);
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read-all", { method: "PATCH" });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="icon-sm" aria-label="Notifikasi" className="relative">
              <Bell />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 justify-center rounded-full border-transparent bg-destructive px-1 text-[10px] text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-1.5 py-1">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0">Notifikasi</DropdownMenuLabel>
            </DropdownMenuGroup>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="size-3.5" />
                Tandai semua dibaca
              </button>
            )}
          </div>
          <DropdownMenuSeparator />
          {notifications.length === 0 ? (
            <p className="px-1.5 py-4 text-center text-sm text-muted-foreground">Belum ada notifikasi.</p>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => openDetail(n)}
                className="flex-col items-start gap-0.5 whitespace-normal py-2"
              >
                <span className={`flex w-full items-center gap-1.5 text-sm ${!n.read ? "font-medium" : ""}`}>
                  {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                  {n.title}
                </span>
                <span className="line-clamp-2 whitespace-pre-line break-words text-xs text-muted-foreground">
                  {n.body}
                </span>
                <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push("/notifications")}
            className="justify-center py-2 text-sm font-medium text-primary"
          >
            Lihat Semua Notifikasi
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Card detail notifikasi — isi lengkap, tidak terpotong */}
      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-md">
          {detail && (
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base leading-snug">{detail.title}</CardTitle>
                <DialogDescription className="mt-0.5 text-xs">
                  {fullDate(detail.createdAt)} · {timeAgo(detail.createdAt)}
                </DialogDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="whitespace-pre-line break-words text-sm leading-relaxed text-foreground">
                  {detail.body}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setDetail(null);
                    router.push("/notifications");
                  }}
                >
                  Lihat Semua Notifikasi
                  <ArrowUpRight className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDetail(null)}>
                  Tutup
                </Button>
              </CardFooter>
            </Card>
          )}
          {/* Judul aksesibilitas dialog (screen reader) */}
          <DialogHeader className="sr-only">
            <DialogTitle>{detail?.title ?? "Notifikasi"}</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
