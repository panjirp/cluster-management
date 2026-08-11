import "dotenv/config";
import { prisma } from "../lib/prisma";
import { parseCsv } from "../lib/sheet-import";

/**
 * KOREKSI: 31 rumah berlabel "Belum Serah Terima" di kolom MARET 2025 ternyata
 * punya riwayat bayar iuran -> berarti rumah SUDAH diserahterimakan (wajib iuran).
 *
 * Aturan baru:
 *   - Rumah BST yang mulai bayar di bulan X -> wajib iuran mulai bulan X.
 *     Bulan sebelum X TIDAK dibuat record-nya (tidak dihitung tunggakan).
 *   - Rumah BST yang belum bayar sama sekali -> tetap dianggap belum serah terima
 *     (tidak wajib, tanpa record).
 *   - Rumah non-BST (sudah serah terima sejak awal) -> periode tetap Mar 2025 - Jul 2026.
 *
 * Tests: jumlah record per bulan setelah koreksi harus = rumah yang sudah wajib
 * di bulan tsb (non-BST 241 + BST yg mulai bayar <= bulan tsb).
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
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
  console.log(`Mengambil sheet: ${url}`);
  const res = await fetch(url);
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

  // Baca sheet
  const sheet = new Map<string, { name: string; bstAt: number[]; paid: Map<string, number> }>(); // bstAt: idx bulan (1-12) yg berlabel BST
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const code = (r[0] ?? "").trim();
    if (!code.startsWith("FP-BC")) continue;
    const m = code.match(/^FP-BC\/(\d+)-(\d+)$/i);
    if (!m) continue;
    const block = `BC${parseInt(m[1], 10)}-${parseInt(m[2], 10).toString().padStart(2, "0")}`;
    const bstAt: number[] = [];
    const paid = new Map<string, number>();
    for (const cm of colMeta) {
      const v = (r[cm.idx] ?? "").trim();
      const low = v.toLowerCase();
      if (low.includes("belum serah terima")) { bstAt.push(cm.month); continue; }
      const amt = amountOf(v);
      if (amt > 0) paid.set(`${cm.year}-${String(cm.month).padStart(2, "0")}`, amt);
    }
    sheet.set(block, { name: (r[1] ?? "").trim(), bstAt, paid });
  }

  // Rumah BST yg bayar = sudah serah terima. Mulai wajib = bulan pertama bayar
  // (prioritas tahun naik: 2025 lalu 2026).
  const bstHouses = [...sheet.entries()].filter(([, s]) => s.bstAt.length > 0);
  console.log(`Rumah berlabel BST: ${bstHouses.length}`);
  for (const [block, s] of bstHouses) {
    const firstPaidKey = [...s.paid.keys()].sort()[0]; // "2025-MM"
    console.log(`  ${block} ${s.name.slice(0, 30)} | BST di bln ${s.bstAt.join(",")} | mulai bayar: ${firstPaidKey ?? "BELUM PERNAH"}`);
  }

  const bstWithPayment = bstHouses.filter(([, s]) => s.paid.size > 0);
  const bstNoPayment = bstHouses.filter(([, s]) => s.paid.size === 0);
  console.log(`\nBST dengan bayaran (=> serah terima): ${bstWithPayment.length}`);
  console.log(`BST murni tanpa bayar (tetap BST)  : ${bstNoPayment.length}`);

  // Proses koreksi
  const houses = await prisma.house.findMany({ select: { id: true, blockNumber: true } });
  const houseIdByBlock = new Map(houses.map((h) => [h.blockNumber, h.id]));

  let created = 0, updated = 0, skipped = 0;

  for (const [block, s] of bstWithPayment) {
    const houseId = houseIdByBlock.get(block);
    if (!houseId) { console.log(`  ! ${block} tidak ada di DB`); skipped++; continue; }
    // bulan mulai = key pertama yg bayar; buat record utk SEMUA bulan dari mulai..Jul 2026
    const firstPaid = [...s.paid.keys()].sort()[0]; // e.g. "2026-01"
    const [fy, fm] = firstPaid.split("-").map(Number);
    for (let y = fy; y <= 2026; y++) {
      const startM = y === fy ? fm : 1;
      const endM = y === 2026 ? 7 : 12;
      for (let mo = startM; mo <= endM; mo++) {
        const key = `${y}-${String(mo).padStart(2, "0")}`;
        const amt = s.paid.get(key) ?? 20000;
        const isPaid = s.paid.has(key);
        const paidAt = isPaid ? new Date(y, mo - 1, 1) : null;
        const base = { houseId, year: y, month: mo, amount: 20000, isPaid, paidAt };
        await prisma.monthlyDue.upsert({
          where: { houseId_year_month: { houseId, year: y, month: mo } },
          update: { amount: 20000, isPaid, paidAt },
          create: base,
        });
        if (isPaid) updated++; else created++;
      }
    }
    console.log(`  ✓ ${block} ${s.name.slice(0, 28)}: dibuat dari ${fy}-${String(fm).padStart(2, "0")} (${s.paid.size} lunas + ${(2026 - fy) * 12 + (7 - fm) + 1 - s.paid.size} belum)`);
  }

  // BST murni tanpa bayar: hapus record periode yang mungkin tersisa dari sync sebelumnya?
  // Sync sebelumnya TIDAK membuat record utk BST (skip), jadi tidak ada yg perlu dihapus.
  // Tapi AGUSTUS 2026 record 272 (termasuk BST) sudah ada — biarkan (bulan berjalan, semua belum bayar).

  console.log(`\n=== HASIL KOREKSI BST ===`);
  console.log(`Record lunas ditambah/update: ${updated}`);
  console.log(`Record belum bayar dibuat    : ${created}`);
  console.log(`Rumah BST tetap (tanpa bayar): ${bstNoPayment.length} ` + bstNoPayment.map(([b]) => b).join(", "));

  // Verifikasi: total record per bulan periode
  const totals = await prisma.monthlyDue.groupBy({
    by: ["year", "month"],
    _count: { _all: true },
  });
  console.log("\nTotal record per bulan (perlu dicek: 2025-03 s/d 2026-07):");
  const period = [];
  for (let m = 3; m <= 12; m++) period.push({ year: 2025, month: m });
  for (let m = 1; m <= 7; m++) period.push({ year: 2026, month: m });
  for (const t of totals.filter((t) => t.year === 2025 || t.year === 2026).sort((a, b) => a.year - b.year || a.month - b.month)) {
    console.log(`  ${t.year}-${String(t.month).padStart(2, "0")}: ${t._count._all}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());