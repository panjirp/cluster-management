import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";

const markPaidSchema = z.object({
  houseId: z.string().min(1),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

// Creates the MonthlyDue row on the fly (using the current dues amount
// setting) and marks it paid in one step, for houses that never had a due
// record generated for the viewed month.
export async function POST(req: NextRequest) {
  try {
    await requireBendahara();
    const body = await req.json();
    const parsed = markPaidSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { houseId, year, month } = parsed.data;

    const setting = await prisma.setting.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });

    const due = await prisma.monthlyDue.upsert({
      where: { houseId_year_month: { houseId, year, month } },
      update: { isPaid: true, paidAt: new Date() },
      create: { houseId, year, month, amount: setting.duesAmount, isPaid: true, paidAt: new Date() },
    });

    return NextResponse.json(due, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
