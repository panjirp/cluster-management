import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { importDuesCommitSchema } from "@/lib/validations/cash";

export async function POST(req: NextRequest) {
  try {
    await requireBendahara();
    const body = await req.json();
    const parsed = importDuesCommitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { houses } = parsed.data;

    const existingHouses = await prisma.house.findMany({ select: { id: true, blockNumber: true } });
    const houseIdByBlock = new Map(existingHouses.map((h) => [h.blockNumber, h.id]));

    const missingBlocks = houses.map((h) => h.blockNumber).filter((b) => !houseIdByBlock.has(b));
    let housesCreated = 0;
    if (missingBlocks.length > 0) {
      const result = await prisma.house.createMany({
        data: Array.from(new Set(missingBlocks)).map((blockNumber) => ({ blockNumber })),
      });
      housesCreated = result.count;
      const refreshed = await prisma.house.findMany({
        where: { blockNumber: { in: missingBlocks } },
        select: { id: true, blockNumber: true },
      });
      for (const h of refreshed) houseIdByBlock.set(h.blockNumber, h.id);
    }

    const existingDues = await prisma.monthlyDue.findMany({
      select: { houseId: true, year: true, month: true, isPaid: true },
    });
    const dueStatusByKey = new Map(existingDues.map((d) => [`${d.houseId}:${d.year}-${d.month}`, d.isPaid]));

    let imported = 0;
    let skipped = 0;

    for (const house of houses) {
      const houseId = houseIdByBlock.get(house.blockNumber);
      if (!houseId) {
        skipped += house.months.length;
        continue;
      }

      for (const m of house.months) {
        const key = `${houseId}:${m.year}-${m.month}`;
        if (dueStatusByKey.get(key) === true) {
          skipped += 1;
          continue;
        }

        await prisma.monthlyDue.upsert({
          where: { houseId_year_month: { houseId, year: m.year, month: m.month } },
          update: { amount: m.amount, isPaid: true, paidAt: new Date(m.year, m.month - 1, 1) },
          create: { houseId, year: m.year, month: m.month, amount: m.amount, isPaid: true, paidAt: new Date(m.year, m.month - 1, 1) },
        });
        imported += 1;
      }
    }

    return NextResponse.json({ imported, skipped, housesCreated });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
