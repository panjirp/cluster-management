import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

/**
 * Daftarkan subscription Web Push (PWA — iOS Add to Home Screen, dll).
 * POST: PushSubscriptionJSON — { endpoint, expirationTime, keys: { p256dh, auth } }
 *   (format asli dari sub.toJSON()) ATAU flat { endpoint, p256dh, auth }.
 * DELETE: { endpoint }              → hapus (unregister)
 */
export async function POST(req: NextRequest) {
  const session = await requireUser();
  const body = (await req.json().catch(() => null)) as {
    endpoint?: string;
    p256dh?: string;
    auth?: string;
    keys?: { p256dh?: string; auth?: string };
  } | null;

  const p256dh = body?.p256dh ?? body?.keys?.p256dh;
  const auth = body?.auth ?? body?.keys?.auth;

  if (!body?.endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "endpoint, p256dh, dan auth wajib diisi" }, { status: 400 });
  }
  if (!body.endpoint.startsWith("https://")) {
    return NextResponse.json({ error: "endpoint harus https" }, { status: 400 });
  }

  await prisma.webPushSubscription.upsert({
    where: { endpoint: body.endpoint },
    create: {
      userId: session.user.id,
      endpoint: body.endpoint,
      p256dh,
      auth,
    },
    update: {
      userId: session.user.id,
      p256dh,
      auth,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await requireUser();
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) {
    return NextResponse.json({ error: "endpoint wajib diisi" }, { status: 400 });
  }

  await prisma.webPushSubscription
    .deleteMany({ where: { endpoint: body.endpoint, userId: session.user.id } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
