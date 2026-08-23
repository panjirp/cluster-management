import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint khusus asisten suara SAHL (Shield TV).
// Auth: header x-device-token == ACCESS_LOG_DEVICE_TOKEN (.env)
function isDeviceAuthorized(req: NextRequest) {
  const token = process.env.ACCESS_LOG_DEVICE_TOKEN;
  if (!token) return false;
  return req.headers.get("x-device-token") === token;
}

// GET /api/assistant/portal?house=BC3-22
// Ringkasan data cluster untuk konteks asisten suara.
export async function GET(req: NextRequest) {
  if (!isDeviceAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const houseParam = req.nextUrl.searchParams.get("house");

  // Data paralel biar cepat
  const [announcements, events, lastVehicles] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { title: true, body: true, createdAt: true },
    }),
    prisma.event.findMany({
      where: { eventDate: { gte: now } },
      orderBy: { eventDate: "asc" },
      take: 3,
      select: { title: true, eventDate: true, location: true },
    }),
    prisma.vehicleAccess.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { house: { select: { blockNumber: true, residentName: true } } },
    }),
  ]);

  // Status kas rumah (kalau ada param house)
  let dues = null;
  if (houseParam) {
    const house = await prisma.house.findUnique({ where: { blockNumber: houseParam } });
    if (house) {
      const md = await prisma.monthlyDue.findUnique({
        where: { houseId_year_month: { houseId: house.id, year, month } },
      });
      dues = {
        house: house.blockNumber,
        month,
        year,
        isPaid: md?.isPaid ?? false,
        amount: null as number | null,
      };
      const setting = await prisma.setting.findUnique({ where: { id: "singleton" } });
      if (setting?.duesAmount) dues.amount = setting.duesAmount;
    }
  }

  return NextResponse.json({
    announcements: announcements.map((a) => ({
      title: a.title,
      body: a.body?.slice(0, 150),
      date: a.createdAt.toISOString().slice(0, 10),
    })),
    events: events.map((e) => ({
      title: e.title,
      date: e.eventDate.toISOString(),
      location: e.location,
    })),
    vehicles: lastVehicles.map((v) => ({
      plate: v.plateNumber,
      direction: v.direction,
      status: v.status,
      house: v.house?.blockNumber ?? null,
      resident: v.house?.residentName ?? null,
      at: v.createdAt.toISOString(),
    })),
    dues,
  });
}
