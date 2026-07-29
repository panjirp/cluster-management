import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const skippedBlocks = new Set([10, 12, 13, 14]);
  const blockNumbers: string[] = [];
  for (let block = 1; block <= 15; block++) {
    if (skippedBlocks.has(block)) continue;
    for (let unit = 1; unit <= 29; unit++) {
      blockNumbers.push(`BC${block}-${String(unit).padStart(2, "0")}`);
    }
  }

  const res = await prisma.house.createMany({
    data: blockNumbers.map((blockNumber) => ({ blockNumber })),
    skipDuplicates: true,
  });
  console.log("houses created:", res.count, "of", blockNumbers.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
