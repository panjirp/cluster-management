import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { createEventSchema } from "@/lib/validations/event";
import { sendPushToUsers } from "@/lib/web-push";

export async function GET() {
  try {
    await requireUser();
    const events = await prisma.event.findMany({
      include: { rsvps: true, createdBy: { select: { name: true } } },
      orderBy: { eventDate: "asc" },
    });
    return NextResponse.json(events);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { eventDate, ...rest } = parsed.data;

    const event = await prisma.event.create({
      data: { ...rest, eventDate: new Date(eventDate), createdById: session.user.id },
    });

    // Push notifikasi acara baru ke semua warga (FCM + Web Push)
    const warga = await prisma.user.findMany({ where: { role: "WARGA" }, select: { id: true } });
    const badge = "📅 " + (event.title ?? "Acara Baru");
    const dateText = new Date(event.eventDate).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    await sendPushToUsers(
      warga.map((w) => w.id),
      { title: badge, body: `${dateText}\n${event.description ?? ""}`.trim(), url: `/events/${event.id}` }
    ).catch(() => {});

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
