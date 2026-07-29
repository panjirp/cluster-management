import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // Blok BC1 s/d BC15 (tanpa BC10, BC12, BC13, BC14), unit 01 s/d 29 per blok
  const skippedBlocks = new Set([10, 12, 13, 14]);
  const blockNumbers: string[] = [];
  for (let block = 1; block <= 15; block++) {
    if (skippedBlocks.has(block)) continue;
    for (let unit = 1; unit <= 29; unit++) {
      blockNumbers.push(`BC${block}-${String(unit).padStart(2, "0")}`);
    }
  }

  const existing = await prisma.house.findMany({ select: { blockNumber: true } });
  const existingSet = new Set(existing.map((h) => h.blockNumber));
  const toCreate = blockNumbers.filter((b) => !existingSet.has(b));
  if (toCreate.length > 0) {
    await prisma.house.createMany({ data: toCreate.map((blockNumber) => ({ blockNumber })) });
  }

  const houseA = await prisma.house.update({
    where: { blockNumber: "BC1-01" },
    data: { contactPhone: "081234567001" },
  });
  const houseB = await prisma.house.update({
    where: { blockNumber: "BC1-02" },
    data: { contactPhone: "081234567002" },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@barcelonacove.local" },
    update: {},
    create: {
      name: "Admin Barcelona Cove",
      email: "admin@barcelonacove.local",
      passwordHash,
      role: "ADMIN",
    },
  });

  const bendahara = await prisma.user.upsert({
    where: { email: "bendahara@barcelonacove.local" },
    update: {},
    create: {
      name: "Bendahara Barcelona Cove",
      email: "bendahara@barcelonacove.local",
      passwordHash,
      role: "BENDAHARA",
    },
  });

  const resident = await prisma.user.upsert({
    where: { email: "budi@barcelonacove.local" },
    update: { houseId: houseA.id },
    create: {
      name: "Budi Santoso",
      email: "budi@barcelonacove.local",
      passwordHash,
      role: "WARGA",
      houseId: houseA.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "siti@barcelonacove.local" },
    update: { houseId: houseB.id },
    create: {
      name: "Siti Aminah",
      email: "siti@barcelonacove.local",
      passwordHash,
      role: "WARGA",
      houseId: houseB.id,
    },
  });

  await prisma.setting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", duesAmount: 150000 },
  });

  const assets = await Promise.all(
    ["Tenda RT", "Kursi", "Sound System"].map((name) =>
      prisma.asset.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  await prisma.directoryMember.deleteMany();
  await prisma.directoryMember.createMany({
    data: [
      { roleType: "PENGURUS", position: "Ketua RT", fullName: "Hendra Wijaya", phone: "081234500001" },
      { roleType: "PENGURUS", position: "Bendahara", fullName: "Bendahara Barcelona Cove", phone: "081234500002" },
      { roleType: "SATPAM", position: "Danru Satpam", fullName: "Agus Salim", phone: "081234500010", scheduleShift: "PAGI" },
      { roleType: "SATPAM", position: "Anggota Satpam", fullName: "Joko Prasetyo", phone: "081234500011", scheduleShift: "SIANG" },
      { roleType: "SATPAM", position: "Anggota Satpam", fullName: "Rudi Hartono", phone: "081234500012", scheduleShift: "MALAM" },
    ],
  });

  console.log({
    admin: admin.email,
    bendahara: bendahara.email,
    resident: resident.email,
    houses: blockNumbers.length,
    assets: assets.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
