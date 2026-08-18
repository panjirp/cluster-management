import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  throw error;
}

// GET /api/vehicles — daftar plat kendaraan terdaftar
export async function GET() {
  try {
    await requireUser();
    const regs = await prisma.vehicleRegistration.findMany({
      orderBy: { createdAt: "desc" },
      include: { house: { select: { blockNumber: true } } },
    });
    return NextResponse.json(
      regs.map((r) => ({
        id: r.id,
        plateNumber: r.plateNumber,
        vehicleType: r.vehicleType,
        ownerName: r.ownerName,
        active: r.active,
        house: r.house.blockNumber,
      }))
    );
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  houseBlock: z.string().min(1),
  plateNumber: z.string().min(3).max(20),
  vehicleType: z.enum(["MOBIL", "MOTOR"]).default("MOBIL"),
  ownerName: z.string().max(100).optional().or(z.literal("")),
});

// POST /api/vehicles — admin daftarkan plat kendaraan warga
export async function POST(req: NextRequest) {
  try {
    await requireBendahara();
    const body = createSchema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

    const plate = body.data.plateNumber.toUpperCase().replace(/\s+/g, " ").trim();
    const house = await prisma.house.findUnique({ where: { blockNumber: body.data.houseBlock } });
    if (!house) return NextResponse.json({ error: `Rumah ${body.data.houseBlock} tidak ditemukan.` }, { status: 404 });

    const exists = await prisma.vehicleRegistration.findUnique({ where: { plateNumber: plate } });
    if (exists) return NextResponse.json({ error: "Plat nomor sudah terdaftar." }, { status: 409 });

    const reg = await prisma.vehicleRegistration.create({
      data: {
        houseId: house.id,
        plateNumber: plate,
        vehicleType: body.data.vehicleType,
        ownerName: body.data.ownerName?.trim() || null,
      },
    });
    return NextResponse.json(reg, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
