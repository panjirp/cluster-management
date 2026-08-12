import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const bodySchema = z.object({
  id: z.string(),
  isPaid: z.boolean(),
  months: z.number().min(1).max(12).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "BENDAHARA")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const raw = await request.json().catch(() => null);
  const body = bodySchema.safeParse(raw);
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }

  const { id, isPaid, months: totalMonths = 1 } = body.data;

  const due = await prisma.monthlyDue.findUnique({ where: { id } });
  if (!due) {
    return NextResponse.json({ error: "Data iuran tidak ditemukan" }, { status: 404 });
  }

  if (totalMonths === 1) {
    await prisma.monthlyDue.update({
      where: { id },
      data: { isPaid, paidAt: isPaid ? new Date() : null },
    });
    return NextResponse.json({ success: true, affected: 1 });
  }

  let y = due.year;
  let m = due.month;
  let affected = 0;

  for (let i = 0; i < totalMonths; i++) {
    const existing = await prisma.monthlyDue.findFirst({
      where: { houseId: due.houseId, year: y, month: m },
    });

    if (existing) {
      await prisma.monthlyDue.update({
        where: { id: existing.id },
        data: { isPaid, paidAt: isPaid ? new Date() : null },
      });
      affected++;
    } else if (isPaid) {
      await prisma.monthlyDue.create({
        data: {
          houseId: due.houseId,
          year: y,
          month: m,
          amount: due.amount,
          isPaid: true,
          paidAt: new Date(),
        },
      });
      affected++;
    }

    m++;
    if (m > 12) { m = 1; y++; }
  }

  return NextResponse.json({
    success: true,
    affected,
    message: isPaid ? `${affected} bulan ditandai lunas` : `${affected} bulan dibatalkan`,
  });
}
