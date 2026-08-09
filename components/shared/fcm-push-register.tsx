"use client";

import { useEffect } from "react";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { useRouter } from "next/navigation";

/**
 * FCM (Firebase Cloud Messaging) — SERVER YANG MENGIRIM.
 * Komponen ini hanya berfungsi di APK Android (native):
 * 1. Minta izin notifikasi
 * 2. Daftarkan token FCM perangkat ke server (POST /api/push/register)
 *    → server simpan di tabel DeviceToken & pakai untuk mengirim push
 *    (pengingat iuran tgl 1/10/25, bukti pembayaran, pengumuman).
 * 3. Saat notif diketuk → buka halaman terkait (url dari data notif).
 * 4. Token berubah (refresh) → daftarkan ulang otomatis.
 */
export function FcmPushRegister() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let registered = false;
    let tokenListener: PluginListenerHandle | null = null;
    let actionListener: PluginListenerHandle | null = null;

    const registerToken = async (token: string) => {
      try {
        await fetch("/api/push/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, platform: "android" }),
        });
      } catch (err) {
        console.error("Register token FCM gagal:", err);
      }
    };

    (async () => {
      try {
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== "granted") return;

        await PushNotifications.register();

        tokenListener = await PushNotifications.addListener(
          "registration",
          async ({ value: token }) => {
            if (!registered) {
              registered = true;
              await registerToken(token);
            }
          }
        );

        // Token FCM bisa berubah (expired/refresh) → daftarkan ulang
        await PushNotifications.addListener("registrationError", (err) => {
          console.error("Registrasi FCM error:", err);
        });

        // Notif diketuk → buka halaman tujuan
        actionListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (event) => {
            const url = event.notification.data?.url;
            if (typeof url === "string" && url.startsWith("/")) {
              router.push(url);
            }
          }
        );
      } catch (err) {
        console.error("FCM init gagal:", err);
      }
    })();

    return () => {
      tokenListener?.remove();
      actionListener?.remove();
    };
  }, [router]);

  return null;
}
