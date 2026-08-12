import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/posyandu/schedules
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schedules = await prisma.posyanduSchedule.findMany({
    where: { isActive: true },
    orderBy: { date: "asc" },
    include: {
      checkups: { select: { id: true, childId: true } },
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(schedules);
}

const scheduleSchema = z.object({
  date: z.string(),
  time: z.string(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/posyandu/schedules — admin buat jadwal
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "BENDAHARA")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = scheduleSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message }, { status: 400 });

  const schedule = await prisma.posyanduSchedule.create({
    data: {
      date: new Date(body.data.date),
      time: body.data.time,
      location: body.data.location ?? "Posko Barcelona Cove",
      notes: body.data.notes,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(schedule, { status: 201 });
}
