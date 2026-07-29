import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { updateHouseSchema } from "@/lib/validations/house";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateHouseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.house.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const house = await prisma.house.update({ where: { id }, data: parsed.data });
    return NextResponse.json(house);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const existing = await prisma.house.findUnique({
      where: { id },
      include: { residents: { select: { id: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing.residents.length > 0) {
      return NextResponse.json(
        { error: "Masih ada warga terdaftar di rumah ini. Pindahkan atau hapus warganya dulu." },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.monthlyDue.deleteMany({ where: { houseId: id } }),
      prisma.house.delete({ where: { id } }),
    ]);

    await logActivity(
      session.user.name ?? session.user.email ?? "Admin",
      "DELETE_HOUSE",
      `Menghapus rumah "${existing.blockNumber}"`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
