import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { rsvpSchema } from "@/lib/validations/event";
import { awardCoveCoin } from "@/lib/covecoin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const parsed = rsvpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const rsvp = await prisma.eventRSVP.upsert({
      where: { eventId_userId: { eventId: id, userId: session.user.id } },
      update: { status: parsed.data.status },
      create: { eventId: id, userId: session.user.id, status: parsed.data.status },
    });

    // Award CoveCoin saat warga menyatakan hadir
    if (parsed.data.status === "GOING") {
      await awardCoveCoin(session.user.id, 500, `CoveCoin hadir acara: ${event.title}`).catch(() => {});
    }

    return NextResponse.json(rsvp);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
