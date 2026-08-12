import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendPushToUsers } from "@/lib/web-push";

// GET /api/posyandu/checkups?childId=xxx
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "BENDAHARA";

  const where: any = {};
  if (childId) where.childId = childId;
  if (!isAdmin) {
    // Warga hanya bisa lihat anak sendiri
    const children = await prisma.child.findMany({ where: { userId: session.user.id }, select: { id: true } });
    where.childId = { in: children.map((c) => c.id) };
  }

  const checkups = await prisma.childCheckup.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      child: { select: { name: true, birthDate: true } },
      recordedBy: { select: { name: true } },
    },
  });

  return NextResponse.json(checkups);
}

const checkupSchema = z.object({
  childId: z.string(),
  scheduleId: z.string().optional(),
  date: z.string().optional(),
  weight: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  headCircumference: z.coerce.number().positive().optional(),
  nutritionalStatus: z.string().optional(),
  immunizationGiven: z.array(z.string()).optional(),
  vitaminA: z.boolean().optional(),
  notes: z.string().optional(),
});

// POST /api/posyandu/checkups — admin input hasil pemeriksaan
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "BENDAHARA")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = checkupSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message }, { status: 400 });

  const checkup = await prisma.childCheckup.create({
    data: {
      childId: body.data.childId,
      scheduleId: body.data.scheduleId ?? null,
      date: body.data.date ? new Date(body.data.date) : new Date(),
      weight: body.data.weight,
      height: body.data.height,
      headCircumference: body.data.headCircumference,
      nutritionalStatus: body.data.nutritionalStatus,
      immunizationGiven: body.data.immunizationGiven ?? [],
      vitaminA: body.data.vitaminA,
      notes: body.data.notes,
      recordedById: session.user.id,
    },
    include: {
      child: { select: { name: true, userId: true } },
    },
  });

  // Push notifikasi ke orang tua
  if (checkup.child.userId) {
    const childName = checkup.child.name;
    const immunText = (body.data.immunizationGiven ?? []).length > 0
      ? ` Imunisasi: ${(body.data.immunizationGiven ?? []).join(", ")}.`
      : "";
    await sendPushToUsers([checkup.child.userId], {
      title: `Hasil Posyandu ${childName}`,
      body: `Pemeriksaan ${childName} telah dicatat. BB: ${body.data.weight ?? "-"} kg, TB: ${body.data.height ?? "-"} cm.${immunText}`,
      url: `/posyandu/${body.data.childId}`,
    }).catch(() => {});
  }

  return NextResponse.json(checkup, { status: 201 });
}
