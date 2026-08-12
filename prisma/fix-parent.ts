import { prisma } from "../lib/prisma";

async function main() {
  // Cek anak yang terdaftar + parent-nya siapa
  const children = await prisma.child.findMany({
    include: { parent: { select: { id: true, name: true, email: true, house: { select: { blockNumber: true } } } } },
  });

  console.log("Current children:");
  for (const c of children) {
    console.log(`  ${c.name} → parent: ${c.parent.name} (${c.parent.email}) | house: ${c.parent.house?.blockNumber ?? "none"}`);
  }

  await prisma.$disconnect();
}
main();
