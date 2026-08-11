import "dotenv/config";
import { prisma } from "../lib/prisma";
import { parseCsv } from "../lib/sheet-import";

/**
 * SYNC PENUH iuran kas dari sheet "Laporan Keuangan & Rekap Kas Warga Barcelona Cove"
 * (tab "Iuran Kas", gid 111987793) ke tabel MonthlyDue.
 *
 * Berbeda dari import sebelumnya (hanya catat yg lunas), script ini membuat
 * record utk SEMUA rumah aktif utk SEMUA bulan periode Maret 2025 – Juli 2026:
 *   - Bulan lunas  -> isPaid=true,  paidAt = tgl 1 bulan tsb, amount 20.000
 *   - Bulan belum  -> isPaid=false, paidAt = null,             amount 20.000
 * Rumah "Belum Serah Terima" (31) -> TIDAK dibuat (tidak wajib iuran).
 * Agustus 2026 (bulan berjalan, sudah ada record isPaid=false amount=0) -> amount dikoreksi jadi 20.000.
 * Setting.duesAmount -> 20.000 (agar GenerateDuesButton bulan berikutnya benar).
 */

const SHEET_ID = "1j6c0tl9Te_y07LO6shDAn8KWZR5ec1V8z9PtazZHP5w";
const GID = "111987793";

// Periode: Mar 2025 (3) s/d Des 2025 (12), lalu Jan 2026 (1) s/d Jul 2026 (7)
function buildPeriod(): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = [];
  for (let m = 3; m <= 12; m++) out.push({ year: 2025, month: m });
  for (let m = 1; m <= 7; m++) out.push({ year: 2026, month: m });
  return out;
}

function amountOf(v: string): number {
  const s = (v ?? "").trim();
  if (!s) return 0;
  const m = s.replace(/[^0-9-]/g, "");
  const n = parseInt(m, 10);
  return Number.isNaN(n) || n <= 0 ? 0 : n;
}

async function main() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
  console.log(`Mengambil sheet: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Gagal ambil sheet (HTTP ${res.status})`);
    process.exit(1);
  }
  const rows = parseCsv(await res.text());

  const headerIdx = rows.findIndex((r) => (r[0] ?? "").trim().toUpperCase() === "BLOK/NO");
  if (headerIdx === -1) {
    console.error("Header BLOK/NO tidak ditemukan");
    process.exit(1);
  }
  const header = rows[headerIdx];
  // Kolom bulan: JANUARI..DESEMBER (no year => 2025), JANUARI 2026..JULI 2026
  const MONTHS = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
  const colMeta: { idx: number; year: number; month: number }[] = [];
  for (let c = 2; c < header.length; c++) {
    const h = (header[c] ?? "").toLowerCase().trim();
    for (let i = 0; i < MONTHS.length; i++) {
      if (h.startsWith(MONTHS[i])) {
        const yMatch = h.match(/(\d{4})/);
        colMeta.push({ idx: c, year: yMatch ? parseInt(yMatch[1], 10) : 0, month: i + 1 });
        break;
      }
    }
  }
  // Tahun kolom tanpa tahun eksplisit: 2025 (krn ada JANUARI 2026 setelahnya)
  const firstExplicit = colMeta.find((x) => x.year !== 0);
  const inferred = firstExplicit ? firstExplicit.year - 1 : 2025;
  colMeta.forEach((x) => { if (x.year === 0) x.year = inferred; });
  console.log("Kolom bulan:", colMeta.map((c) => `${c.year}-${String(c.month).padStart(2, "0")}(${c.idx})`).join(", "));

  // Baca data sheet per rumah
  const sheet = new Map<string, { name: string; bst: boolean; paid: Set<string> }>();
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const code = (r[0] ?? "").trim();
    if (!code.startsWith("FP-BC")) continue;
    const m = code.match(/^FP-BC\/(\d+)-(\d+)$/i);
    if (!m) continue;
    const block = `BC${parseInt(m[1], 10)}-${parseInt(m[2], 10).toString().padStart(2, "0")}`;
    const name = (r[1] ?? "").trim();
    let bst = false;
    const paid = new Set<string>();
    for (const cm of colMeta) {
      const v = (r[cm.idx] ?? "").trim();
      const lower = v.toLowerCase();
      if (lower.includes("belum serah terima")) { bst = true; continue; }
      if (amountOf(v) > 0) paid.add(`${cm.year}-${String(cm.month).padStart(2, "0")}`);
    }
    sheet.set(block, { name, bst, paid });
  }
  console.log(`Rumah di sheet: ${sheet.size}, BST: ${[...sheet.values()].filter((s) => s.bst).length}`);

  const houses = await prisma.house.findMany({ select: { id: true, blockNumber: true } });
  const houseIdByBlock = new Map(houses.map((h) => [h.blockNumber, h.id]));

  const period = buildPeriod();
  const PERIOD_KEY = new Set(period.map((p) => `${p.year}-${String(p.month).padStart(2, "0")}`));

  let created = 0, updated = 0, skippedBst = 0, noHouse = 0;
  const ops: Promise<unknown>[] = [];

  for (const [block, s] of sheet) {
    if (s.bst) { skippedBst++; continue; }
    const houseId = houseIdByBlock.get(block);
    if (!houseId) { noHouse++; console.log(`  ! ${block} tidak ada di DB`); continue; }
    for (const p of period) {
      const key = `${p.year}-${String(p.month).padStart(2, "0")}`;
      const isPaid = s.paid.has(key);
      const paidAt = isPaid ? new Date(p.year, p.month - 1, 1) : null;
      ops.push(
        prisma.monthlyDue.upsert({
          where: { houseId_year_month: { houseId, year: p.year, month: p.month } },
          update: { amount: 20000, isPaid, paidAt },
          create: { houseId, year: p.year, month: p.month, amount: 20000, isPaid, paidAt },
        }).then(() => { if (isPaid) updated++; else created++; })
      );
    }
  }

  // Agustus 2026: koreksi amount (bulan berjalan, semua belum bayar)
  const aug = await prisma.monthlyDue.findMany({ where: { year: 2026, month: 8, amount: 0 }, select: { id: true } });
  for (const a of aug) {
    ops.push(prisma.monthlyDue.update({ where: { id: a.id }, data: { amount: 20000 } }));
  }

  // Setting duesAmount = 20000
  ops.push(
    prisma.setting.upsert({
      where: { id: "singleton" },
      update: { duesAmount: 20000, duesSheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=${GID}#gid=${GID}` },
      create: { id: "singleton", duesAmount: 20000, duesSheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=${GID}#gid=${GID}` },
    })
  );

  await Promise.all(ops);
  console.log("\n=== HASIL SYNC IURAN KAS ===");
  console.log(`Record dibuat (belum bayar): ${created}`);
  console.log(`Record diupdate (lunas)     : ${updated}`);
  console.log(`Rumah BST dilewati          : ${skippedBst}`);
  console.log(`Rumah tak ada di DB         : ${noHouse}`);
  console.log(`Agustus 2026 dikoreksi      : ${aug.length} record -> Rp 20.000`);

  const totals = await prisma.monthlyDue.groupBy({
    by: ["year", "month"],
    _count: { _all: true },
    where: { OR: period.map((p) => ({ year: p.year, month: p.month })) },
  });
  console.log("\nTotal record per bulan (periode):");
  for (const t of totals.sort((a, b) => a.year - b.year || a.month - b.month)) {
    console.log(`  ${t.year}-${String(t.month).padStart(2, "0")}: ${t._count._all}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());