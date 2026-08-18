import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  throw error;
}

// GET /api/my-vehicles — daftar kendaraan terdaftar untuk rumah warga yang login
export async function GET() {
  try {
    const session = await requireUser();
    if (!session.user.houseId) {
      return NextResponse.json({ error: "Akun kamu belum terhubung ke rumah." }, { status: 400 });
    }
    const regs = await prisma.vehicleRegistration.findMany({
      where: { houseId: session.user.houseId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      regs.map((r) => ({
        id: r.id,
        plateNumber: r.plateNumber,
        vehicleType: r.vehicleType,
        ownerName: r.ownerName,
        active: r.active,
      }))
    );
  } catch (error) {
    return errorResponse(error);
  }
}

const schema = z.object({
  plateNumber: z.string().min(3).max(20),
  vehicleType: z.enum(["MOBIL", "MOTOR"]).default("MOBIL"),
  ownerName: z.string().max(100).optional().or(z.literal("")),
});

// POST /api/my-vehicles — warga daftarkan plat kendaraan miliknya
export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    if (!session.user.houseId) {
      return NextResponse.json({ error: "Akun kamu belum terhubung ke rumah." }, { status: 400 });
    }
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

    const plate = body.data.plateNumber.toUpperCase().replace(/\s+/g, " ").trim();
    const exists = await prisma.vehicleRegistration.findUnique({ where: { plateNumber: plate } });
    if (exists) return NextResponse.json({ error: "Plat nomor sudah terdaftar." }, { status: 409 });

    const reg = await prisma.vehicleRegistration.create({
      data: {
        houseId: session.user.houseId,
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
