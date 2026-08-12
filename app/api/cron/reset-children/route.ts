import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Hapus semua anak yang belum verified
  const unverified = await prisma.child.findMany({ where: { isVerified: false } });
  for (const c of unverified) {
    await prisma.childCheckup.deleteMany({ where: { childId: c.id } });
    await prisma.child.delete({ where: { id: c.id } });
  }

  return NextResponse.json({ deleted: unverified.map(c => c.name) });
}
