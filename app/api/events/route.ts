import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { createEventSchema } from "@/lib/validations/event";

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

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
