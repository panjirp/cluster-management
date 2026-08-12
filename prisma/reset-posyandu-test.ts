import { prisma } from "../lib/prisma";

async function main() {
  // Hapus semua data test posyandu milik Sahl Khaleev
  const sahlChild = await prisma.child.findFirst({
    where: { name: { contains: "sahl", mode: "insensitive" } },
  });
  
  if (sahlChild) {
    await prisma.childCheckup.deleteMany({ where: { childId: sahlChild.id } });
    await prisma.child.delete({ where: { id: sahlChild.id } });
    console.log("Deleted child & checkups:", sahlChild.name);
  }

  // Hapus semua child yang belum verified
  const unverified = await prisma.child.findMany({ where: { isVerified: false } });
  for (const c of unverified) {
    await prisma.childCheckup.deleteMany({ where: { childId: c.id } });
    await prisma.child.delete({ where: { id: c.id } });
    console.log("Deleted:", c.name);
  }

  // Hapus jadwal posyandu test
  await prisma.posyanduSchedule.deleteMany({});
  console.log("All schedules deleted");

  await prisma.$disconnect();
  console.log("Done!");
}
main();
