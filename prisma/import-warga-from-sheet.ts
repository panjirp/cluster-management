import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { extractSheetExportUrl, parseCsv } from "../lib/sheet-import";

/**
 * Import akun login warga per rumah langsung dari Google Sheet kas iuran.
 *
 * Format sheet (tab "REKAP IURAN" / gid 111987793):
 *   BLOK/NO        | NAMA WARGA | JANUARI | FEBRUARI | ...
 *   FP-BC/01-001   | SRI ATIN   | 20,000  | ...
 *
 * Untuk setiap rumah dibuat akun WARGA:
 *   - Email   : bc{block:02}{unit:02}@barcelona.cove  (mis. bc0101@barcelona.cove)
 *   - Password: WARGA_PASSWORD ?? "barcelona123"
 *   - Nama    : nama warga dari sheet
 *   - houseId : dikaitkan ke rumah yang sesuai (BC{block}-{unit:02})
 * Nama warga juga disinkronkan ke kolom House.residentName.
 *
 * Idempotent: user yang sudah ada hanya diperbarui relasinya, password
 * tidak direset ulang bila sudah terisi.
 */

const SHEET_URL =
  process.env.WARGA_SHEET_URL ??
  "https://docs.google.com/spreadsheets/d/1j6c0tl9Te_y07LO6shDAn8KWZR5ec1V8z9PtazZHP5w/edit?gid=111987793#gid=111987793";

const WARGA_PASSWORD = process.env.WARGA_PASSWORD ?? "barcelona123";

function mapHouseCode(code: string): string | null {
  const m = code.trim().match(/^FP-BC\/(\d+)-(\d+)$/i);
  if (!m) return null;
  const block = parseInt(m[1], 10);
  const unit = parseInt(m[2], 10);
  return `BC${block}-${unit.toString().padStart(2, "0")}`;
}

function wargaEmail(blockNumber: string): string | null {
  const m = blockNumber.match(/^BC(\d+)-(\d+)$/);
  if (!m) return null;
  const block = parseInt(m[1], 10);
  const unit = parseInt(m[2], 10);
  return `bc${block.toString().padStart(2, "0")}${unit.toString().padStart(2, "0")}@barcelona.cove`;
}

async function main() {
  const exportUrl = extractSheetExportUrl(SHEET_URL);
  if (!exportUrl) throw new Error("URL Google Sheets tidak dikenali.");

  const res = await fetch(exportUrl);
  if (!res.ok) throw new Error(`Gagal mengambil sheet: ${res.status}`);
  const csvText = await res.text();
  const rows = parseCsv(csvText);

  const headerIndex = rows.findIndex((r) => (r[0] ?? "").trim().toUpperCase() === "BLOK/NO");
  if (headerIndex === -1) throw new Error('Baris header "BLOK/NO" tidak ditemukan — format sheet tidak dikenali.');

  const records: { blockNumber: string; residentName: string }[] = [];
  const seen = new Set<string>();
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const code = (row[0] ?? "").trim();
    if (!code || !code.toUpperCase().startsWith("FP-BC")) continue;
    const blockNumber = mapHouseCode(code);
    if (!blockNumber || seen.has(blockNumber)) continue;
    const residentName = (row[1] ?? "").trim().replace(/\s+/g, " ");
    if (!residentName) continue;
    seen.add(blockNumber);
    records.push({ blockNumber, residentName });
  }
  console.log(`Warga ditemukan di sheet: ${records.length}`);

  const houses = await prisma.house.findMany({ select: { id: true, blockNumber: true } });
  const houseMap = new Map(houses.map((h) => [h.blockNumber, h.id]));

  const passwordHash = await bcrypt.hash(WARGA_PASSWORD, 10);

  let created = 0;
  let updated = 0;
  let houseMissing = 0;
  let nameUpdated = 0;

  for (const rec of records) {
    const houseId = houseMap.get(rec.blockNumber) ?? null;
    if (!houseId) {
      houseMissing++;
      console.log(`  ! Rumah tidak ditemukan: ${rec.blockNumber} — dilewati.`);
      continue;
    }

    const email = wargaEmail(rec.blockNumber);
    if (!email) {
      houseMissing++;
      console.log(`  ! Email tidak bisa dibuat untuk ${rec.blockNumber} — dilewati.`);
      continue;
    }

    const prev = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (prev) {
      await prisma.user.update({
        where: { id: prev.id },
        data: {
          name: rec.residentName,
          role: "WARGA",
          houseId,
          ...(prev.passwordHash ? {} : { passwordHash }),
        },
      });
      updated++;
    } else {
      await prisma.user.create({
        data: {
          name: rec.residentName,
          email,
          passwordHash,
          role: "WARGA",
          houseId,
        },
      });
      created++;
    }

    await prisma.house.update({
      where: { id: houseId },
      data: { residentName: rec.residentName },
    });
    nameUpdated++;
  }

  console.log("\n=== HASIL IMPORT WARGA ===");
  console.log(`Dibuat baru (created)      : ${created}`);
  console.log(`Sudah ada  (updated)       : ${updated}`);
  console.log(`Nama warga disinkronkan    : ${nameUpdated}`);
  console.log(`Rumah tidak ditemukan      : ${houseMissing}`);
  console.log(`Password default           : ${WARGA_PASSWORD}`);
  console.log(`Contoh email               : bc0101@barcelona.cove (BC1-01)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
