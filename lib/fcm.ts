import { prisma } from "@/lib/prisma";

/**
 * FCM (Firebase Cloud Messaging) HTTP v1 — SERVER YANG MENGIRIM.
 * Credential: service account JSON (diunduh dari Firebase Console)
 * → env FCM_SERVICE_ACCOUNT_PATH = path absolut file JSON di server.
 *
 * Alur:
 * 1. Service account → JWT RS256 → OAuth2 access token (cache ±50 menit).
 * 2. POST https://fcm.googleapis.com/v1/projects/<projectId>/messages:send
 *    satu pesan per token device.
 */

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
};

let cachedAccount: ServiceAccount | null = null;
let cachedToken: { value: string; expiresAt: number } | null = null;

function getServiceAccount(): ServiceAccount | null {
  if (cachedAccount) return cachedAccount;
  const p = process.env.FCM_SERVICE_ACCOUNT_PATH;
  if (!p) return null;
  try {
    cachedAccount = JSON.parse(require("fs").readFileSync(p, "utf8")) as ServiceAccount;
    return cachedAccount;
  } catch (err) {
    console.error("Gagal membaca FCM service account:", err);
    return null;
  }
}

function base64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Membuat JWT RS256 untuk OAuth2 (tanpa dependency eksternal — pakai crypto node). */
function signJwt(payload: Record<string, unknown>, privateKeyPem: string): string {
  const crypto = require("crypto");
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + 3600 };
  const input = `${base64Url(Buffer.from(JSON.stringify(header)))}.${base64Url(Buffer.from(JSON.stringify(body)))}`;
  const sig = crypto.sign("RSA-SHA256", Buffer.from(input), privateKeyPem);
  return `${input}.${base64Url(sig)}`;
}

/** Access token OAuth2 (cache 50 menit; token FCM valid 1 jam). */
export async function getFcmAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const acc = getServiceAccount();
  if (!acc) return null;

  const jwt = signJwt(
    { iss: acc.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: acc.token_uri ?? "https://oauth2.googleapis.com/token" },
    acc.private_key
  );

  const res = await fetch(acc.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    console.error("FCM token request gagal:", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 10 * 60 * 1000 };
  return cachedToken.value;
}

export type FcmMessage = { title: string; body: string; url?: string; data?: Record<string, string> };

/** Kirim satu pesan ke satu token. Return true jika sukses; "unregistered" jika token mati. */
async function sendToToken(token: string, msg: FcmMessage): Promise<boolean | "unregistered"> {
  const acc = getServiceAccount();
  const accessToken = await getFcmAccessToken();
  if (!acc || !accessToken) return false;

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${acc.project_id}/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: msg.title, body: msg.body },
        data: { url: msg.url ?? "/", ...(msg.data ?? {}) },
        android: { priority: "high", notification: { channelId: "general", clickAction: "OPEN_URL" } },
      },
    }),
  });

  if (res.ok) return true;
  const text = await res.text();
  if (res.status === 404 || text.includes("UNREGISTERED") || text.includes("NOT_FOUND")) {
    return "unregistered";
  }
  console.error(`FCM send gagal (${res.status}):`, text.slice(0, 300));
  return false;
}

/**
 * Kirim pesan ke semua token aktif milik userId tertentu.
 * Token yang sudah mati (unregistered) dihapus dari DB.
 */
export async function sendFcmToUser(userId: string, msg: FcmMessage): Promise<number> {
  if (!getServiceAccount()) return 0; // FCM belum dikonfigurasi → silent skip
  const tokens = await prisma.deviceToken.findMany({ where: { userId }, select: { id: true, token: true } });
  let sent = 0;
  for (const t of tokens) {
    const r = await sendToToken(t.token, msg);
    if (r === true) sent++;
    else if (r === "unregistered") {
      await prisma.deviceToken.delete({ where: { id: t.id } }).catch(() => {});
    }
  }
  return sent;
}

/** Kirim pesan ke banyak user sekaligus (mis. pengumuman untuk semua warga). */
export async function sendFcmToUsers(userIds: string[], msg: FcmMessage): Promise<number> {
  if (!getServiceAccount() || userIds.length === 0) return 0;
  const tokens = await prisma.deviceToken.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, token: true },
  });
  let sent = 0;
  for (const t of tokens) {
    const r = await sendToToken(t.token, msg);
    if (r === true) sent++;
    else if (r === "unregistered") {
      await prisma.deviceToken.delete({ where: { id: t.id } }).catch(() => {});
    }
  }
  return sent;
}

export function isFcmConfigured(): boolean {
  return Boolean(process.env.FCM_SERVICE_ACCOUNT_PATH);
}
