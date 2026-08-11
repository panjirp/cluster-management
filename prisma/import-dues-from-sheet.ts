import "dotenv/config";
import { prisma } from "../lib/prisma";
import { parseDuesLedger } from "../lib/dues-sheet-import";

/**
 * Import status iuran kas dari spreadsheet "Laporan Keuangan & Rekap Kas
 * Warga Barcelona Cove" (tab "Iuran Kas", gid 111987793) ke tabel MonthlyDue.
 *
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1j6c0tl9Te_y07LO6shDAn8KWZR5ec1V8z9PtazZHP5w
 *   gid 111987793 -> tab "Iuran Kas" (matriks BLOK/NO x bulan, nominal @20.000/bulan)
 *
 * Format tab (sama seperti yang didukung parseDuesLedger):
 *   Baris header "BLOK/NO" dengan kolom bulan: JANUARI..DESEMBER (2025, tanpa tahun
 *   eksplisit -> di-infer 2025), JANUARI 2026..JULI 2026 (tahun eksplisit).
 *   Nilai sel = nominal dibayar (20.000) -> LUNAS. Sel kosong / "Belum Serah
 *   Terima" / teks bukan angka -> tidak dicatat (artinya belum bayar / tidak wajib).
 *
 * Logika upsert sama dengan API /api/cash/dues/import/commit:
 *   - Bulan dengan nominal -> MonthlyDue.isPaid = true, paidAt = tgl 1 bulan tsb.
 *   - Bulan yang sudah isPaid=true di DB -> dilewati (tidak menimpa).
 *   - Rumah yang tercatat bayar tapi tidak ada di DB -> dibuatkan House baru
 *     (hanya blockNumber) supaya data tidak hilang.
 */

const SHEET_ID = "1j6c0tl9Te_y07LO6shDAn8KWZR5ec1V8z9PtazZHP5w";
const GID = "111987793"; // tab "Iuran Kas"

async function main() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
  console.log(`Mengambil sheet... ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Gagal ambil sheet (HTTP ${res.status}). Pastikan akses publik.`);
    process.exit(1);
  }
  const csvText = await res.text();
  const { rows, skippedColumns, warnings } = parseDuesLedger(csvText);
  console.log(`Baris iuran terbaca: ${rows.length}`);
  if (skippedColumns.length) console.log("Kolom dilewati (bukan bulan):", skippedColumns.join(", "));
  for (const w of warnings) console.log("WARN:", w);
  if (rows.length === 0) {
    console.error("Tidak ada data bisa dibaca.");
    process.exit(1);
  }

  // Kumpulkan per rumah
  const houseGroups = new Map<
    string,
    { blockNumber: string; houseCode: string; residentName: string; months: { year: number; month: number; amount: number }[] }
  >();
  for (const row of rows) {
    let g = houseGroups.get(row.blockNumber);
    if (!g) {
      g = { blockNumber: row.blockNumber, houseCode: row.houseCode, residentName: row.residentName, months: [] };
      houseGroups.set(row.blockNumber, g);
    }
    g.months.push({ year: row.year, month: row.month, amount: row.amount });
  }
  console.log(`Rumah unik di sheet: ${houseGroups.size}\n`);

  const existingHouses = await prisma.house.findMany({ select: { id: true, blockNumber: true } });
  const houseIdByBlock = new Map(existingHouses.map((h) => [h.blockNumber, h.id]));

  const missingBlocks = [...houseGroups.keys()].filter((b) => !houseIdByBlock.has(b));
  let housesCreated = 0;
  if (missingBlocks.length > 0) {
    const res2 = await prisma.house.createMany({
      data: missingBlocks.map((blockNumber) => ({ blockNumber })),
    });
    housesCreated = res2.count;
    const refreshed = await prisma.house.findMany({
      where: { blockNumber: { in: missingBlocks } },
      select: { id: true, blockNumber: true },
    });
    for (const h of refreshed) houseIdByBlock.set(h.blockNumber, h.id);
  }

  const existingDues = await prisma.monthlyDue.findMany({
    select: { houseId: true, year: true, month: true, isPaid: true },
  });
  const dueStatusByKey = new Map(existingDues.map((d) => [`${d.houseId}:${d.year}-${d.month}`, d.isPaid]));

  let imported = 0;
  let skipped = 0;
  let noHouse = 0;
  const noHouseList: string[] = [];

  for (const [blockNumber, group] of houseGroups) {
    const houseId = houseIdByBlock.get(blockNumber);
    if (!houseId) {
      noHouse += group.months.length;
      noHouseList.push(blockNumber);
      continue;
    }
    for (const m of group.months) {
      const key = `${houseId}:${m.year}-${m.month}`;
      if (dueStatusByKey.get(key) === true) {
        skipped += 1;
        continue;
      }
      await prisma.monthlyDue.upsert({
        where: { houseId_year_month: { houseId, year: m.year, month: m.month } },
        update: { amount: m.amount, isPaid: true, paidAt: new Date(m.year, m.month - 1, 1) },
        create: { houseId, year: m.year, month: m.month, amount: m.amount, isPaid: true, paidAt: new Date(m.year, m.month - 1, 1) },
      });
      imported += 1;
    }
  }

  console.log("\n=== HASIL IMPORT IURAN KAS ===");
  console.log(`Rumah di sheet        : ${houseGroups.size}`);
  console.log(`House baru dibuat     : ${housesCreated}`);
  console.log(`Catatan iuran masuk   : ${imported}`);
  console.log(`Sudah lunas (skip)    : ${skipped}`);
  console.log(`Rumah tak ada di DB   : ${noHouse} ${noHouseList.length ? "(" + noHouseList.slice(0, 10).join(", ") + "...)" : ""}`);

  // Verifikasi singkat
  const totals = await prisma.monthlyDue.groupBy({
    by: ["year", "month"],
    where: { isPaid: true },
    _count: { _all: true },
  });
  console.log("\nLunas per bulan (di DB):");
  for (const t of totals.sort((a, b) => a.year - b.year || a.month - b.month)) {
    console.log(`  ${t.year}-${String(t.month).padStart(2, "0")}: ${t._count._all} rumah`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());