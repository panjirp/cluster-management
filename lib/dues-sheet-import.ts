import { parseCsv } from "@/lib/sheet-import";

const MONTH_NAMES = [
  "januari", "februari", "maret", "april", "mei", "juni",
  "juli", "agustus", "september", "oktober", "november", "desember",
];

export type ParsedDuesRow = {
  rowId: string;
  houseCode: string; // e.g. "FP-BC/01-001"
  blockNumber: string; // mapped, e.g. "BC1-01"
  residentName: string;
  year: number;
  month: number; // 1-12
  amount: number;
};

export type DuesParseResult = {
  rows: ParsedDuesRow[];
  skippedColumns: string[];
  warnings: string[];
};

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9-]/g, "");
  if (!cleaned) return null;
  const value = parseInt(cleaned, 10);
  if (Number.isNaN(value) || value <= 0) return null;
  return value;
}

function mapHouseCode(code: string): string | null {
  const match = code.trim().match(/^FP-BC\/(\d+)-(\d+)$/i);
  if (!match) return null;
  const block = parseInt(match[1], 10);
  const unit = parseInt(match[2], 10);
  return `BC${block}-${unit.toString().padStart(2, "0")}`;
}

type ColumnMeta = { index: number; year: number; month: number } | null;

function parseColumnHeader(header: string): { year: number; month: number } | null {
  const lower = header.toLowerCase().trim();
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    if (lower.startsWith(MONTH_NAMES[i])) {
      const yearMatch = lower.match(/(\d{4})/);
      return yearMatch ? { year: parseInt(yearMatch[1], 10), month: i + 1 } : { year: 0, month: i + 1 };
    }
  }
  return null;
}

export function parseDuesLedger(csvText: string): DuesParseResult {
  const rows = parseCsv(csvText);
  const warnings: string[] = [];
  const skippedColumns: string[] = [];

  const headerRowIndex = rows.findIndex((r) => (r[0] ?? "").trim().toUpperCase() === "BLOK/NO");
  if (headerRowIndex === -1) {
    warnings.push('Baris header "BLOK/NO" tidak ditemukan — format sheet tidak dikenali.');
    return { rows: [], skippedColumns, warnings };
  }

  const header = rows[headerRowIndex];

  // First pass: find columns with an explicit year, to infer the year for
  // bare month names (e.g. "JANUARI" with no year) that appear before them.
  const rawParsed = header.map((col) => parseColumnHeader(col ?? ""));
  const firstExplicitYear = rawParsed.find((p) => p && p.year > 0)?.year;
  const inferredYear = firstExplicitYear ? firstExplicitYear - 1 : new Date().getFullYear();

  const columns: ColumnMeta[] = header.map((col, index) => {
    const parsed = rawParsed[index];
    if (!parsed) {
      const label = (col ?? "").trim();
      if (label && index >= 2) skippedColumns.push(label);
      return null;
    }
    return { index, year: parsed.year > 0 ? parsed.year : inferredYear, month: parsed.month };
  });

  const parsedRows: ParsedDuesRow[] = [];
  let rowCounter = 0;

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const houseCode = (row[0] ?? "").trim();
    if (!houseCode || !houseCode.toUpperCase().startsWith("FP-BC")) continue;

    const blockNumber = mapHouseCode(houseCode);
    if (!blockNumber) {
      warnings.push(`Kode rumah "${houseCode}" tidak dikenali formatnya — dilewati.`);
      continue;
    }

    const residentName = (row[1] ?? "").trim().replace(/\s+/g, " ");

    for (const col of columns) {
      if (!col) continue;
      const amount = parseAmount(row[col.index] ?? "");
      if (amount === null) continue;

      parsedRows.push({
        rowId: `${blockNumber}-${col.year}-${col.month.toString().padStart(2, "0")}-${rowCounter++}`,
        houseCode,
        blockNumber,
        residentName,
        year: col.year,
        month: col.month,
        amount,
      });
    }
  }

  return { rows: parsedRows, skippedColumns: Array.from(new Set(skippedColumns)), warnings };
}
