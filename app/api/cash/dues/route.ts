import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { compareBlockNumber } from "@/lib/sort";

export async function GET(req: NextRequest) {
  try {
    await requireUser();

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = Number(searchParams.get("year") ?? now.getFullYear());
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);

    const houses = (
      await prisma.house.findMany({
        include: { monthlyDues: { where: { year, month } } },
      })
    ).sort((a, b) => compareBlockNumber(a.blockNumber, b.blockNumber));

    return NextResponse.json({
      year,
      month,
      houses: houses.map((house) => ({
        id: house.id,
        blockNumber: house.blockNumber,
        contactPhone: house.contactPhone,
        due: house.monthlyDues[0] ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireBendahara();
    const body = await req.json();
    const now = new Date();
    const year = Number(body.year ?? now.getFullYear());
    const month = Number(body.month ?? now.getMonth() + 1);

    const setting = await prisma.setting.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });

    const houses = await prisma.house.findMany();

    await Promise.all(
      houses.map((house) =>
        prisma.monthlyDue.upsert({
          where: { houseId_year_month: { houseId: house.id, year, month } },
          update: {},
          create: { houseId: house.id, year, month, amount: setting.duesAmount },
        })
      )
    );

    return NextResponse.json({ ok: true, year, month, count: houses.length });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
