import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isDeviceAuthorized(req: NextRequest) {
  const token = process.env.ACCESS_LOG_DEVICE_TOKEN;
  if (!token) return false;
  return req.headers.get("x-device-token") === token;
}

// GET /api/access-log/whitelist — daftar plat terdaftar (untuk agent Windows/PC satpam)
export async function GET(req: NextRequest) {
  if (!isDeviceAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const regs = await prisma.vehicleRegistration.findMany({
    where: { active: true },
    include: { house: { select: { blockNumber: true, residentName: true } } },
  });

  return NextResponse.json(
    regs.map((r) => ({
      plateNumber: r.plateNumber,
      vehicleType: r.vehicleType,
      ownerName: r.ownerName,
      house: r.house.blockNumber,
      residentName: r.house.residentName,
    }))
  );
}
