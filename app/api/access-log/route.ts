import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, getSession, UnauthorizedError } from "@/lib/session";

// API key khusus untuk device (ZCluster/Hikvision/agent Windows).
// Disimpan di .env dengan nama ACCESS_LOG_DEVICE_TOKEN.
function isDeviceAuthorized(req: NextRequest) {
  const token = process.env.ACCESS_LOG_DEVICE_TOKEN;
  if (!token) return false;
  return req.headers.get("x-device-token") === token;
}

// GET /api/access-log — riwayat akses kendaraan (portal, butuh login admin/bendahara)
export async function GET() {
  try {
    await requireUser();
    const logs = await prisma.vehicleAccess.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { house: { select: { blockNumber: true, residentName: true } } },
    });
    return NextResponse.json(
      logs.map((l) => ({
        id: l.id,
        plateNumber: l.plateNumber,
        direction: l.direction,
        house: l.house?.blockNumber ?? null,
        residentName: l.house?.residentName ?? null,
        isRegistered: l.isRegistered,
        status: l.status,
        gateName: l.gateName,
        createdAt: l.createdAt,
      }))
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}

const logSchema = z.object({
  plateNumber: z.string().min(3).max(20),
  direction: z.enum(["MASUK", "KELUAR"]).default("MASUK"),
  status: z.enum(["DIBUKA", "DITOLAK"]).default("DIBUKA"),
  gateName: z.string().max(50).optional(),
});

// POST /api/access-log — dipanggil agent saat kendaraan terdeteksi.
// Return detail warga (house + nama) supaya agent bisa langsung tampil.
export async function POST(req: NextRequest) {
  try {
    const deviceOk = isDeviceAuthorized(req);
    let session = null;
    if (!deviceOk) {
      session = await getSession();
      const allowRole = session && (session.user.role === "ADMIN" || session.user.role === "BENDAHARA");
      if (!allowRole) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = logSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.issues[0]?.message ?? "Data tidak valid." }, { status: 400 });
    }

    const { plateNumber, direction, status, gateName } = body.data;
    const plate = plateNumber.toUpperCase().replace(/\s+/g, " ").trim();

    // Cocokkan dengan plat terdaftar warga + ambil detail
    const reg = await prisma.vehicleRegistration.findUnique({
      where: { plateNumber: plate },
      include: { house: { select: { blockNumber: true, residentName: true } } },
    });
    const isRegistered = !!reg && reg.active;

    const access = await prisma.vehicleAccess.create({
      data: {
        plateNumber: plate,
        direction,
        status,
        gateName: gateName ?? null,
        isRegistered,
        houseId: reg?.houseId ?? null,
      },
    });

    return NextResponse.json(
      {
        id: access.id,
        plateNumber: access.plateNumber,
        direction: access.direction,
        status: access.status,
        isRegistered: access.isRegistered,
        house: reg?.house?.blockNumber ?? null,
        residentName: reg?.house?.residentName ?? null,
        ownerName: reg?.ownerName ?? null,
        createdAt: access.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
