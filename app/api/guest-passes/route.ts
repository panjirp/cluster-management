import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { createGuestPassSchema, generatePassCode } from "@/lib/validations/guest-pass";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  throw error;
}

// GET /api/guest-passes — daftar pass milik warga yang login
export async function GET() {
  try {
    const session = await requireUser();
    const passes = await prisma.guestPass.findMany({
      where: { hostId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json(passes);
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/guest-passes — warga membuat pass tamu baru
export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    const body = createGuestPassSchema.safeParse(await req.json());
    if (!body.success) {
      const message = body.error.issues[0]?.message ?? "Data tidak valid.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { guestName, guestPhone, vehicleType, plateNumber, purpose, durationHours } = body.data;

    // Kode unik — retry kalau bentrok (kemungkinan sangat kecil).
    let code = generatePassCode();
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.guestPass.findUnique({ where: { code } });
      if (!exists) break;
      code = generatePassCode();
    }

    const pass = await prisma.guestPass.create({
      data: {
        code,
        hostId: session.user.id,
        houseId: session.user.houseId ?? null,
        guestName: guestName.trim(),
        guestPhone: guestPhone?.trim() || null,
        vehicleType,
        plateNumber: plateNumber?.trim().toUpperCase() || null,
        purpose: purpose.trim(),
        validUntil: new Date(Date.now() + durationHours * 60 * 60 * 1000),
      },
    });

    return NextResponse.json(pass, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
