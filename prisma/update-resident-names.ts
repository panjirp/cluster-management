import "dotenv/config";
import { prisma } from "../lib/prisma";
import { extractSheetExportUrl } from "../lib/sheet-import";
import { parseDuesLedger } from "../lib/dues-sheet-import";

const SHEET_URL =
  process.argv[2] ??
  "https://docs.google.com/spreadsheets/d/1j6c0tl9Te_y07LO6shDAn8KWZR5ec1V8z9PtazZHP5w/edit?gid=111987793#gid=111987793";

async function main() {
  const exportUrl = extractSheetExportUrl(SHEET_URL);
  if (!exportUrl) throw new Error("URL Google Sheets tidak dikenali.");

  const res = await fetch(exportUrl);
  if (!res.ok) throw new Error(`Gagal mengambil sheet: ${res.status}`);
  const csvText = await res.text();

  const { rows, warnings } = parseDuesLedger(csvText);
  for (const w of warnings) console.warn("WARNING:", w);

  const nameByBlock = new Map<string, string>();
  for (const row of rows) {
    if (row.residentName && !nameByBlock.has(row.blockNumber)) {
      nameByBlock.set(row.blockNumber, row.residentName);
    }
  }

  const houses = await prisma.house.findMany({ select: { id: true, blockNumber: true } });
  const houseIdByBlock = new Map(houses.map((h) => [h.blockNumber, h.id]));

  let updated = 0;
  let notFound = 0;
  for (const [blockNumber, residentName] of nameByBlock) {
    const houseId = houseIdByBlock.get(blockNumber);
    if (!houseId) {
      notFound++;
      console.warn(`Rumah ${blockNumber} tidak ditemukan di database — dilewati.`);
      continue;
    }
    await prisma.house.update({ where: { id: houseId }, data: { residentName } });
    updated++;
  }

  console.log(`Selesai. ${updated} rumah diperbarui, ${notFound} tidak ditemukan.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
