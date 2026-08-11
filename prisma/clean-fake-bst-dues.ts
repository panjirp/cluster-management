import "dotenv/config";
import { prisma } from "../lib/prisma";
import { parseCsv } from "../lib/sheet-import";

/**
 * HAPUS record iuran PALSU untuk 31 rumah "Belum Serah Terima" yang sudah dikoreksi:
 * record isPaid=false pada bulan SEBELUM bulan pertama mereka bayar (belum wajib iuran).
 * Bulan mulai bayar = bulan pertama ada nominal di sheet (start termasuk).
 * Record dari bulan mulai dst. dipertahankan (sudah dibuat fix-bst-dues.ts).
 *
 * Run file ini SETELAH fix-bst-dues.ts.
 */

const SHEET_ID = "1j6c0tl9Te_y07LO6shDAn8KWZR5ec1V8z9PtazZHP5w";
const GID = "111987793";
const MONTHS = ["januari","februari","maret","april","mei","juni","juli","agustus","september","oktober","november","desember"];

function amountOf(v: string): number {
  const s = (v ?? "").trim();
  if (!s) return 0;
  const n = parseInt(s.replace(/[^0-9-]/g, ""), 10);
  return Number.isNaN(n) || n <= 0 ? 0 : n;
}

async function main() {
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`);
  if (!res.ok) { console.error(`Gagal (HTTP ${res.status})`); process.exit(1); }
  const rows = parseCsv(await res.text());
  const headerIdx = rows.findIndex((r) => (r[0] ?? "").trim().toUpperCase() === "BLOK/NO");
  const header = rows[headerIdx];

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
  const firstExplicit = colMeta.find((x) => x.year !== 0);
  const inferred = firstExplicit ? firstExplicit.year - 1 : 2025;
  colMeta.forEach((x) => { if (x.year === 0) x.year = inferred; });
  colMeta.sort((a, b) => a.year - b.year || a.month - b.month);

  // Kumpulkan: rumah BST (label apa pun) + bulan pertama bayar
  const startByBlock = new Map<string, { year: number; month: number }>();
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const code = (r[0] ?? "").trim();
    if (!code.startsWith("FP-BC")) continue;
    const m = code.match(/^FP-BC\/(\d+)-(\d+)$/i);
    if (!m) continue;
    const block = `BC${parseInt(m[1], 10)}-${parseInt(m[2], 10).toString().padStart(2, "0")}`;
    let isBst = false;
    let firstPaid: { year: number; month: number } | null = null;
    for (const cm of colMeta) {
      const v = (r[cm.idx] ?? "").trim();
      const low = v.toLowerCase();
      if (low.includes("belum serah terima")) { isBst = true; continue; }
      if (!firstPaid && amountOf(v) > 0) firstPaid = { year: cm.year, month: cm.month };
    }
    if (isBst && firstPaid) startByBlock.set(block, firstPaid);
  }
  console.log(`Rumah BST dgn titik mulai bayar: ${startByBlock.size}`);

  const houses = await prisma.house.findMany({
    where: { blockNumber: { in: [...startByBlock.keys()] } },
    select: { id: true, blockNumber: true },
  });
  const idByBlock = new Map(houses.map((h) => [h.blockNumber, h.id]));

  let deleted = 0;
  for (const [block, start] of startByBlock) {
    const houseId = idByBlock.get(block);
    if (!houseId) { console.log(`  ! ${block} tak ada di DB`); continue; }
    // Hapus record sebelum (exclusive) bulan mulai: isPaid=false (palsu) ATAU isPaid=true (tidak mungkin, tapi aman hapus semua)
    const before = await prisma.monthlyDue.findMany({
      where: {
        houseId,
        OR: [
          { year: { lt: start.year } },
          { year: start.year, month: { lt: start.month } },
        ],
      },
      select: { id: true, year: true, month: true, isPaid: true },
    });
    if (before.length > 0) {
      await prisma.monthlyDue.deleteMany({ where: { id: { in: before.map((b) => b.id) } } });
      deleted += before.length;
    }
    console.log(`  ✓ ${block}: hapus ${before.length} record sebelum ${start.year}-${String(start.month).padStart(2, "0")}`);
  }
  console.log(`\nTotal record palsu dihapus: ${deleted}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());