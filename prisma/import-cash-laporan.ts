import "dotenv/config";
import { prisma } from "../lib/prisma";
import { parseCsv } from "../lib/sheet-import";

/**
 * IMPORT LAPORAN KAS per BULAN (tab 1 spreadsheet iuran) -> CashTransaction.
 *
 * Sumber: Google Sheets "Laporan Keuangan & Rekap Kas Warga Barcelona Cove"
 * Tab 1 (gid pertama) = "LAPORAN KAS per BULAN" (Feb 2025 – Jul 2026).
 *
 * Setiap blok bulan: section "Penerimaan" (INCOME) & "Pengeluaran" (EXPENSE).
 * Saldo awal "Uang Kas Sebelumnya" (Rp 1.285.000, Feb 2025) diimpor sebagai
 * INCOME kategori LAINNYA supaya saldo akhir = Rp 11.084.483 (sesuai sheet).
 *
 * IDEMPOTEN: importKey = `kas-laporan:v1:<idx>` — jalankan ulang aman.
 * Verifikasi di akhir: total pemasukan/pengeluaran/saldo & selisih rincian
 * terhadap baris "Jumlah Penerimaan"/"Jumlah Pengeluaran" per bulan.
 */

const SHEET_ID = "1j6c0tl9Te_y07LO6shDAn8KWZR5ec1V8z9PtazZHP5w";

const MONTH_NAMES: Record<string, number> = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
};

/** Parse " 1,500,000 " / "- 496,600 " / "  11,084,483 " -> number */
function parseAmount(v: string | undefined): number {
  const s = (v ?? "").trim().replace(/"/g, "").replace(/\s+/g, "");
  if (!s) return 0;
  const isNeg = s.startsWith("-");
  const digits = s.replace(/[^0-9]/g, "");
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return 0;
  return isNeg ? -n : n;
}

function classify(desc: string): "IURAN_BULANAN" | "DONASI" | "KEAMANAN" | "KEBERSIHAN" | "PERBAIKAN" | "ACARA" | "LAINNYA" {
  const d = desc.toLowerCase();
  // Cetak kartu iuran dsb = pengeluaran operasional, bukan iuran
  if (d.includes("iuran kas") && !d.includes("cetak")) return "IURAN_BULANAN";
  if (d.includes("dana sosial") || d.includes("donatur") || d.includes("infaq") || d.includes("kotak amal") || d.includes("giveaway")) return "DONASI";
  if (d.includes("security") || d.includes("cctv") || d.includes("camera") || d.includes("boomgate") || d.includes("baterai bom")) return "KEAMANAN";
  if (d.includes("kebersihan") || d.includes("gardener") || d.includes("fogging") || d.includes("kerja bakti") || d.includes("toilet") || d.includes("wipol") || d.includes("porstex")) return "KEBERSIHAN";
  if (d.includes("perbaikan") || d.includes("material") || d.includes("instalasi") || d.includes("monitor") || d.includes("pemasangan") || d.includes("alat ")) return "PERBAIKAN";
  if (d.includes("rapat") || d.includes("gorengan") || d.includes("cemilan") || d.includes("air mineral") || d.includes("kopi") || d.includes("makan") || d.includes("minum") || d.includes("snack") || d.includes("lomba") || d.includes("17 agustus") || d.includes("doorprize") || d.includes("bendera") || d.includes("umbul") || d.includes("tarawih") || d.includes("kajian") || d.includes("bukber") || d.includes("pormeta") || d.includes("karate")) return "ACARA";
  return "LAINNYA";
}

type Tx = {
  type: "INCOME" | "EXPENSE";
  category: "IURAN_BULANAN" | "DONASI" | "KEAMANAN" | "KEBERSIHAN" | "PERBAIKAN" | "ACARA" | "LAINNYA";
  amount: number;
  description: string;
  date: Date;
  importKey: string;
};

async function main() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
  console.log(`Mengambil tab 1 (Laporan Kas per Bulan): ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Gagal ambil sheet (HTTP ${res.status})`);
    process.exit(1);
  }
  const rows = parseCsv(await res.text());

  // ---- Parse blok bulan ----
  const txList: Tx[] = [];
  let idx = 0;
  let curYear = 0;
  let curMonth = 0;
  let section: "none" | "income" | "expense" = "none";
  let expectMonth = false; // baris berikutnya setelah "LAPORAN KAS per BULAN" = label bulan
  // Ringkasan per bulan utk verifikasi
  const monthlyCheck = new Map<string, { monthLabel: string; lines: { desc: string; amt: number; role: "income" | "expense" }[]; declaredIncome?: number; declaredExpense?: number }>();

  const monthRe = /([A-Za-z]+)\s+(\d{4})/;

  for (const r of rows) {
    const c1 = (r[1] ?? "").trim();
    const c2 = (r[2] ?? "").trim();
    const c5raw = (r[5] ?? "").trim();

    // Marker blok bulan baru
    if (c1.startsWith("LAPORAN KAS per BULAN")) {
      section = "none";
      expectMonth = true;
      continue;
    }
    if (expectMonth && c1) {
      const m = c1.match(monthRe);
      if (m && MONTH_NAMES[m[1].toLowerCase()]) {
        curYear = parseInt(m[2], 10);
        curMonth = MONTH_NAMES[m[1].toLowerCase()];
        section = "income";
        expectMonth = false;
        if (!monthlyCheck.has(`${curYear}-${curMonth}`)) {
          monthlyCheck.set(`${curYear}-${curMonth}`, { monthLabel: c1, lines: [] });
        }
        continue;
      }
      expectMonth = false; // bukan label bulan yg valid
    }
    // Baris section boundary (presisi: label "Penerimaan :" / "Pengeluaran :")
    if (c1 === "Penerimaan :" || c1 === "Penerimaan:") {
      section = "income";
      continue;
    }
    if (c1 === "Pengeluaran :" || c1 === "Pengeluaran:") {
      section = "expense";
      continue;
    }

    // Baris transaksi & total
    const amt = parseAmount(c5raw);
    const blob = monthlyCheck.get(`${curYear}-${curMonth}`);
    if (c1.startsWith("Jumlah Penerimaan")) {
      if (blob) blob.declaredIncome = amt;
      continue;
    }
    if (c1.startsWith("Jumlah Pengeluaran")) {
      if (blob) blob.declaredExpense = amt;
      continue;
    }
    if (c1.startsWith("Total") || c1 === "-" || c1.includes("Total Saldo")) continue;

    // Transaksi detail: deskripsi di kolom 2, jumlah di kolom 5
    if (c2 && amt > 0 && (section === "income" || section === "expense")) {
      blob?.lines.push({ desc: c2, amt, role: section });
    }
  }

  // ---- Sesuaikan dgn angka yg DEKLARASIKAN sheet (sumber kebenaran) ----
  // Jika rincian != "Jumlah Penerimaan"/"Jumlah Pengeluaran" di sheet (mis. ada
  // baris yg lupa dijumlahkan bendahara), drop baris dgn amount == selisih &
  // laporkan. Saldo akhir harus = Rp 11.084.483 persis seperti sheet.
  for (const [key, b] of monthlyCheck) {
    const incomeLines = b.lines.filter((l) => l.role === "income");
    const expenseLines = b.lines.filter((l) => l.role === "expense");
    const incDiff = (b.declaredIncome ?? 0) - incomeLines.reduce((a, l) => a + l.amt, 0);
    const expDiff = (b.declaredExpense ?? 0) - expenseLines.reduce((a, l) => a + l.amt, 0);

    const fix = (diff: number, lines: { desc: string; amt: number; role: "income" | "expense" }[], role: "income" | "expense") => {
      if (diff === 0) return;
      const target = lines.find((l) => Math.abs(l.amt) === Math.abs(diff));
      if (target) {
        const l = b.lines.splice(b.lines.indexOf(target), 1)[0];
        console.log(`⚠️  ${key}: baris "${l.desc}" (${l.amt.toLocaleString("id-ID")}) TIDAK dihitung di Jumlah ${role === "income" ? "Penerimaan" : "Pengeluaran"} sheet → dilewati utk menyesuaikan saldo`);
      } else {
        console.log(`⚠️  ${key}: selisih ${role} ${diff.toLocaleString("id-ID")} — TIDAK ada baris tunggal yg cocok, pakai angka sheet (abaikan rincian selisih)`);
      }
    };
    fix(incDiff, incomeLines, "income");
    fix(expDiff, expenseLines, "expense");
  }

  // ---- Bangun daftar transaksi final ----
  for (const [key, b] of monthlyCheck) {
    const [year, month] = key.split("-").map(Number);
    for (const l of b.lines) {
      idx += 1;
      const type = l.role === "income" ? "INCOME" : "EXPENSE";
      // Tanggal transaksi: tgl 5 bulan bersangkutan (konsisten "Per Tgl 5")
      const date = new Date(year, month - 1, 5, 12, 0, 0);
      txList.push({ type, category: classify(l.desc), amount: l.amt, description: l.desc, date, importKey: `kas-laporan:v1:${idx}` });
    }
  }

  // ---- Ringkasan verifikasi per bulan ----
  console.log("\n=== VERIFIKASI PER BULAN (rincian vs jumlah yg dideklarasikan di sheet) ===");
  let sumIncome = 0;
  let sumExpense = 0;
  for (const [key, b] of monthlyCheck) {
    const linesIn = b.lines.filter((l) => l.role === "income").reduce((a, l) => a + l.amt, 0);
    const linesOut = b.lines.filter((l) => l.role === "expense").reduce((a, l) => a + l.amt, 0);
    sumIncome += linesIn;
    sumExpense += linesOut;
    const incDiff = b.declaredIncome !== undefined ? linesIn - b.declaredIncome : 0;
    const expDiff = b.declaredExpense !== undefined ? linesOut - b.declaredExpense : 0;
    const flags: string[] = [];
    if (incDiff !== 0) flags.push(`Pemasukan diff ${incDiff}`);
    if (expDiff !== 0) flags.push(`Pengeluaran diff ${expDiff}`);
    console.log(`${key} (${b.monthLabel}) | masuk ${linesIn.toLocaleString("id-ID")} / keluar ${linesIn ? "" : ""}${linesOut.toLocaleString("id-ID")}${flags.length ? " ⚠️ " + flags.join(", ") : ""}`);
  }
  console.log(`\nTOTAL rincian: pemasukan ${sumIncome.toLocaleString("id-ID")}, pengeluaran ${sumExpense.toLocaleString("id-ID")}, saldo ${(sumIncome - sumExpense).toLocaleString("id-ID")}`);
  console.log(`Jumlah transaksi akan diimpor: ${txList.length}`);

  // ---- Tulis ke DB (idempoten) ----
  await prisma.cashTransaction.deleteMany({ where: { importKey: { startsWith: "kas-laporan:v1:" } } });
  await prisma.cashTransaction.createMany({ data: txList });
  console.log(`\nImpor selesai: ${txList.length} transaksi (importKey kas-laporan:v1:*).`);
  console.log("Saldo target sheet (Jul 2026): 11.084.483");

  const total = await prisma.cashTransaction.aggregate({
    _sum: { amount: true },
    where: { type: "INCOME" },
  });
  console.log("Verifikasi DB -> total pemasukan:", (total._sum.amount ?? 0).toLocaleString("id-ID"));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());