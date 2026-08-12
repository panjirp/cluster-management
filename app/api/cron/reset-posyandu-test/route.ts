import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/cron/reset-posyandu-test — panggil via CRON_SECRET
export async function POST(request: NextRequest) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Hapus semua data posyandu test
  const result: string[] = [];

  // Hapus semua checkups + child yang belum verified
  const unverified = await prisma.child.findMany({ where: { isVerified: false } });
  for (const c of unverified) {
    await prisma.childCheckup.deleteMany({ where: { childId: c.id } });
    await prisma.child.delete({ where: { id: c.id } });
    result.push(`Deleted: ${c.name}`);
  }

  // Hapus jadwal + semua checkups
  await prisma.posyanduSchedule.deleteMany({});
  result.push("All schedules deleted");

  return NextResponse.json({ result });
}
