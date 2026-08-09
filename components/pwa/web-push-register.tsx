"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Url);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/**
 * Daftarkan Web Push subscription (PWA):
 * - iOS Safari 16.4+ → hanya jalan saat app di-add ke Home Screen
 * - Chrome Android / desktop → jalan langsung
 *
 * Jika izin belum diberikan, tampilkan banner kecil dengan tombol
 * "Aktifkan" (requestPermission butuh gesture pengguna).
 */
export function WebPushRegister() {
  const [supported, setSupported] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      Boolean(VAPID_PUBLIC);
    setSupported(ok);
    if (ok) {
      setPerm(Notification.permission);
      if (Notification.permission === "granted") {
        registerSubscription().catch(() => {});
      }
    }
  }, []);

  async function registerSubscription() {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    }
    await fetch("/api/push/web/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
  }

  async function enable() {
    const result = await Notification.requestPermission();
    setPerm(result);
    if (result === "granted") {
      await registerSubscription().catch(() => {});
    }
  }

  if (!supported || perm === "granted" || perm === "denied" || dismissed) return null;

  return (
    <div className="mx-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <BellRing className="size-4.5 shrink-0 text-primary" />
      <p className="min-w-0 flex-1 text-sm text-foreground">
        Aktifkan notifikasi agar pengingat & pengumuman sampai ke HP Anda.
      </p>
      <Button size="sm" onClick={enable}>
        Aktifkan
      </Button>
      <button
        type="button"
        aria-label="Tutup"
        className="text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setDismissed(true)}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
