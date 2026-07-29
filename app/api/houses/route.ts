import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { createHouseSchema } from "@/lib/validations/house";
import { compareBlockNumber } from "@/lib/sort";

export async function GET() {
  try {
    await requireAdmin();

    const houses = (
      await prisma.house.findMany({
        include: { residents: { select: { id: true, name: true, role: true } } },
      })
    ).sort((a, b) => compareBlockNumber(a.blockNumber, b.blockNumber));

    return NextResponse.json(houses);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = createHouseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.house.findUnique({ where: { blockNumber: parsed.data.blockNumber } });
    if (existing) {
      return NextResponse.json({ error: "Nomor blok sudah digunakan" }, { status: 409 });
    }

    const house = await prisma.house.create({ data: parsed.data });

    return NextResponse.json(house, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
