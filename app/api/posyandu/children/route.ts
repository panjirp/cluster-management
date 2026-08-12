import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/posyandu/children — daftar anak warga / admin bisa lihat semua
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "BENDAHARA";
  const where = isAdmin ? {} : { userId: session.user.id };

  const children = await prisma.child.findMany({
    where,
    include: {
      checkups: { orderBy: { date: "desc" }, take: 1 },
      parent: { select: { id: true, name: true, house: { select: { blockNumber: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(children);
}

const childSchema = z.object({
  name: z.string().min(1).max(100),
  birthDate: z.string(),
  gender: z.enum(["LAKI_LAKI", "PEREMPUAN"]),
  birthWeight: z.coerce.number().positive().optional(),
  birthLength: z.coerce.number().positive().optional(),
  nik: z.string().optional(),
  allergies: z.string().optional(),
  photoUrl: z.string().optional(),
});

// POST /api/posyandu/children — warga mendaftarkan anak
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = childSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message }, { status: 400 });

  const child = await prisma.child.create({
    data: {
      ...body.data,
      birthDate: new Date(body.data.birthDate),
      userId: session.user.id,
    },
  });

  return NextResponse.json(child, { status: 201 });
}
