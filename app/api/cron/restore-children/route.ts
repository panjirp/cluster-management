import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/cron/restore-children — panggil via CRON_SECRET
export async function POST(request: NextRequest) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Kembalikan Sahl Khaleev & Niscala yang terhapus
  // Data asli dari input admin sebelumnya:
  const restored: string[] = [];

  // Sahl Khaleev Vin Rylie Muhammad — belum verified
  let sahl = await prisma.child.findFirst({
    where: { name: "Sahl Khaleev Vin Rylie Muhammad" },
  });
  if (!sahl) {
    // Cari user untuk parent-nya
    const user = await prisma.user.findFirst({
      where: { house: { blockNumber: { startsWith: "BC" } } },
      orderBy: { createdAt: "desc" },
    });

    if (user) {
      sahl = await prisma.child.create({
        data: {
          userId: user.id,
          name: "Sahl Khaleev Vin Rylie Muhammad",
          birthDate: new Date("2025-07-15"),
          gender: "LAKI_LAKI",
          isVerified: false,
        },
      });
      restored.push("Sahl Khaleev Vin Rylie Muhammad");
    }
  }

  // Niscala Putragana Migunani — belum verified
  let niscala = await prisma.child.findFirst({
    where: { name: "Niscala Putragana Migunani" },
  });
  if (!niscala) {
    const user = await prisma.user.findFirst({
      where: { house: { blockNumber: { startsWith: "BC" } } },
      orderBy: { createdAt: "desc" },
    });
    // Cari user yang berbeda dari yang dipakai Sahl
    const user2 = await prisma.user.findFirst({
      where: { house: { blockNumber: { startsWith: "BC" } }, id: { not: user?.id } },
    });

    if (user2) {
      niscala = await prisma.child.create({
        data: {
          userId: user2.id,
          name: "Niscala Putragana Migunani",
          birthDate: new Date("2026-01-20"),
          gender: "PEREMPUAN",
          isVerified: false,
        },
      });
      restored.push("Niscala Putragana Migunani");
    }
  }

  // Hapus hanya checkup (bukan child)
  await prisma.childCheckup.deleteMany({});
  restored.push("All checkups cleared");

  return NextResponse.json({ restored });
}
