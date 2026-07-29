import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { createPermitSchema, permitTypeLabels } from "@/lib/validations/permit";
import { notifyAdmins } from "@/lib/notify";

export async function GET() {
  try {
    const session = await requireUser();

    const permits = await prisma.permit.findMany({
      where: session.user.role === "WARGA" ? { createdById: session.user.id } : undefined,
      include: { createdBy: { select: { name: true, house: { select: { blockNumber: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(permits);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    if (session.user.role !== "WARGA") throw new ForbiddenError();
    const body = await req.json();
    const parsed = createPermitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { startDate, endDate, assetIds, ...rest } = parsed.data;
    const borrowDate = startDate ? new Date(startDate) : undefined;
    const returnDate = endDate ? new Date(endDate) : undefined;

    if (assetIds && assetIds.length > 0) {
      if (!borrowDate || !returnDate) {
        return NextResponse.json(
          { error: "Tanggal mulai & selesai wajib diisi untuk peminjaman aset" },
          { status: 400 }
        );
      }

      const overlapping = await prisma.assetBooking.findFirst({
        where: {
          assetId: { in: assetIds },
          borrowDate: { lte: returnDate },
          returnDate: { gte: borrowDate },
        },
        include: { asset: true },
      });

      if (overlapping) {
        return NextResponse.json(
          { error: `Aset "${overlapping.asset.name}" sudah dipinjam pada rentang tanggal tersebut` },
          { status: 409 }
        );
      }
    }

    const permit = await prisma.permit.create({
      data: {
        ...rest,
        startDate: borrowDate,
        endDate: returnDate,
        createdById: session.user.id,
        assetBookings:
          assetIds && assetIds.length > 0 && borrowDate && returnDate
            ? { create: assetIds.map((assetId) => ({ assetId, borrowDate, returnDate })) }
            : undefined,
      },
    });

    await notifyAdmins("Permohonan izin baru", permitTypeLabels[permit.type], `/permits/${permit.id}`);

    return NextResponse.json(permit, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
