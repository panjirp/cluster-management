import { transactionCategoryValues } from "@/lib/validations/cash";

type TransactionCategory = (typeof transactionCategoryValues)[number];

const MONTH_NAMES = [
  "januari", "februari", "maret", "april", "mei", "juni",
  "juli", "agustus", "september", "oktober", "november", "desember",
];

export type ParsedRow = {
  rowId: string;
  importKey: string;
  date: string; // yyyy-mm-dd
  type: "INCOME" | "EXPENSE";
  category: TransactionCategory;
  description: string;
  amount: number;
  confident: boolean;
};

export type ParsedBlock = {
  label: string;
  year: number;
  month: number; // 1-12
  rows: ParsedRow[];
};

export type ParseResult = {
  blocks: ParsedBlock[];
  warnings: string[];
};

export function extractSheetExportUrl(shareUrl: string): string | null {
  const idMatch = shareUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) return null;
  const sheetId = idMatch[1];
  const gidMatch = shareUrl.match(/[?#&]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // skip, \n handles the row break
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9-]/g, "");
  if (!cleaned) return null;
  const value = parseInt(cleaned, 10);
  return Number.isNaN(value) ? null : value;
}

function parseMonthYear(label: string): { year: number; month: number } | null {
  const lower = label.toLowerCase();
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const idx = lower.indexOf(MONTH_NAMES[i]);
    if (idx === -1) continue;
    const yearMatch = lower.slice(idx).match(/(\d{4})/);
    if (!yearMatch) continue;
    return { year: parseInt(yearMatch[1], 10), month: i + 1 };
  }
  return null;
}

const INCOME_KEYWORDS: [RegExp, TransactionCategory][] = [
  [/iuran/i, "IURAN_BULANAN"],
  [/donasi|sumbangan/i, "DONASI"],
];

const EXPENSE_KEYWORDS: [RegExp, TransactionCategory][] = [
  [/security|gardener|satpam|keamanan/i, "KEAMANAN"],
  [/kebersihan|sampah/i, "KEBERSIHAN"],
  [/perbaikan|maintenace|maintenance|material|instalasi|jasa/i, "PERBAIKAN"],
  [/rapat|acara|banner|munggahan|idul fitri/i, "ACARA"],
  [/dana sosial/i, "DONASI"],
];

function suggestCategory(description: string, type: "INCOME" | "EXPENSE"): { category: TransactionCategory; confident: boolean } {
  const rules = type === "INCOME" ? INCOME_KEYWORDS : EXPENSE_KEYWORDS;
  for (const [pattern, category] of rules) {
    if (pattern.test(description)) return { category, confident: true };
  }
  return { category: "LAINNYA", confident: false };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function parseLedger(csvText: string): ParseResult {
  const rows = parseCsv(csvText);
  const blocks: ParsedBlock[] = [];
  const warnings: string[] = [];
  const keyOccurrences = new Map<string, number>();

  let i = 0;
  while (i < rows.length) {
    const row = rows[i];
    const col1 = (row[1] ?? "").trim();

    if (col1 === "LAPORAN KAS per BULAN") {
      const labelRow = rows[i + 1];
      const label = (labelRow?.[1] ?? "").trim();
      const monthYear = parseMonthYear(label);

      if (!monthYear) {
        warnings.push(`Tidak bisa membaca bulan/tahun dari label "${label}" — blok ini dilewati.`);
        i += 1;
        continue;
      }

      const block: ParsedBlock = { label, year: monthYear.year, month: monthYear.month, rows: [] };
      const dateStr = `${block.year}-${pad(block.month)}-01`;
      let section: "INCOME" | "EXPENSE" | null = null;
      let j = i + 2;

      while (j < rows.length) {
        const r = rows[j];
        const c1 = (r[1] ?? "").trim();
        const c2 = (r[2] ?? "").trim();
        const amountRaw = r[5] ?? "";

        if (c1 === "LAPORAN KAS per BULAN") break; // next block starts
        if (c1 === "Penerimaan :") {
          section = "INCOME";
        } else if (c1 === "Pengeluaran :") {
          section = "EXPENSE";
        } else if (c1 === "Jumlah Penerimaan" || c1 === "Jumlah Pengeluaran" || c1 === "Total") {
          // subtotal/total rows — not transactions
        } else if (c2 && parseAmount(amountRaw) !== null) {
          if (!section) {
            warnings.push(`Baris "${c2}" tidak berada di bawah Penerimaan/Pengeluaran yang jelas (blok ${label}) — dilewati.`);
          } else {
            const amount = parseAmount(amountRaw)!;
            const { category, confident } = suggestCategory(c2, section);
            const isOpeningBalance = /uang kas sebelumnya|saldo awal/i.test(c2);
            const baseImportKey = `sheet:${block.year}-${pad(block.month)}:${section}:${c2.trim().toLowerCase()}:${amount}`;
            const occurrence = keyOccurrences.get(baseImportKey) ?? 0;
            keyOccurrences.set(baseImportKey, occurrence + 1);
            const importKey = occurrence === 0 ? baseImportKey : `${baseImportKey}:${occurrence}`;
            block.rows.push({
              rowId: `${block.year}-${pad(block.month)}-${block.rows.length}`,
              importKey,
              date: dateStr,
              type: section,
              category,
              description: c2.trim(),
              amount,
              confident: confident && !isOpeningBalance,
            });
          }
        }

        j += 1;
      }

      blocks.push(block);
      i = j;
      continue;
    }

    i += 1;
  }

  return { blocks, warnings };
}
