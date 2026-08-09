import webpush from "web-push";
import { prisma } from "@/lib/prisma";

/**
 * Web Push (RFC 8030) — push notification untuk PWA:
 * - iOS Safari 16.4+ (app di-add ke Home Screen)
 * - Chrome Android / desktop (PWA)
 * - Edge / Firefox (desktop)
 *
 * VAPID keys di env: WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY / WEB_PUSH_SUBJECT.
 * Subscription disimpan di tabel WebPushSubscription (per user).
 */

export type PushMessage = { title: string; body: string; url?: string };

let vapidConfigured = false;

function ensureConfigured(): boolean {
  const pub = process.env.WEB_PUSH_PUBLIC_KEY;
  const priv = process.env.WEB_PUSH_PRIVATE_KEY;
  if (vapidConfigured || !pub || !priv) return vapidConfigured;
  webpush.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT ?? "mailto:admin@barcelonacove.web.id",
    pub,
    priv
  );
  vapidConfigured = true;
  return true;
}

export function isWebPushConfigured(): boolean {
  return Boolean(process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY);
}

type Row = { id: string; endpoint: string; p256dh: string; auth: string };

async function sendToSubscription(row: Row, msg: PushMessage): Promise<boolean | "unregistered"> {
  try {
    await webpush.sendNotification(
      { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
      JSON.stringify({ title: msg.title, body: msg.body, url: msg.url ?? "/" })
    );
    return true;
  } catch (err) {
    const e = err as { statusCode?: number; body?: string };
    // 404/410 = subscription sudah mati → bersihkan dari DB
    if (e.statusCode === 404 || e.statusCode === 410) return "unregistered";
    console.error(`Web push gagal (${e.statusCode ?? "?"}):`, String(e.body ?? e).slice(0, 200));
    return false;
  }
}

async function deliver(rows: Row[], msg: PushMessage): Promise<number> {
  if (!ensureConfigured() || rows.length === 0) return 0;
  let sent = 0;
  for (const row of rows) {
    const r = await sendToSubscription(row, msg);
    if (r === true) sent++;
    else if (r === "unregistered") {
      await prisma.webPushSubscription.delete({ where: { id: row.id } }).catch(() => {});
    }
  }
  return sent;
}

/** Kirim pesan ke semua web push subscription milik satu user. */
export async function sendWebPushToUser(userId: string, msg: PushMessage): Promise<number> {
  const rows = await prisma.webPushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  return deliver(rows, msg);
}

/** Kirim pesan ke semua web push subscription dari banyak user. */
export async function sendWebPushToUsers(userIds: string[], msg: PushMessage): Promise<number> {
  if (userIds.length === 0) return 0;
  const rows = await prisma.webPushSubscription.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  return deliver(rows, msg);
}

/** Gabungan FCM (Android native) + Web Push (PWA iOS/Android/desktop) — satu helper. */
export async function sendPushToUser(
  userId: string,
  msg: PushMessage
): Promise<{ fcm: number; web: number }> {
  const { sendFcmToUser } = await import("@/lib/fcm");
  const [fcm, web] = await Promise.all([
    sendFcmToUser(userId, msg).catch(() => 0),
    sendWebPushToUser(userId, msg).catch(() => 0),
  ]);
  return { fcm, web };
}

export async function sendPushToUsers(
  userIds: string[],
  msg: PushMessage
): Promise<{ fcm: number; web: number }> {
  const { sendFcmToUsers } = await import("@/lib/fcm");
  const [fcm, web] = await Promise.all([
    sendFcmToUsers(userIds, msg).catch(() => 0),
    sendWebPushToUsers(userIds, msg).catch(() => 0),
  ]);
  return { fcm, web };
}
