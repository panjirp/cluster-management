import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { createTransactionSchema } from "@/lib/validations/cash";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireBendahara();
    const { id } = await params;
    const body = await req.json();
    const parsed = createTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.cashTransaction.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { date, ...rest } = parsed.data;

    const transaction = await prisma.cashTransaction.update({
      where: { id },
      data: { ...rest, date: date ? new Date(date) : undefined },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireBendahara();
    const { id } = await params;

    const existing = await prisma.cashTransaction.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.cashTransaction.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
