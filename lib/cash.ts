import type { CashTransaction } from "@/app/generated/prisma/client";
import type { MonthlySummary } from "@/components/cash/cash-chart";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/**
 * Daftar blockNumber rumah yang diizinkan WARGA melihat status iurannya sendiri.
 * Whitelist disimpan di Setting.duesAccessHouseIds (JSON array), mis. ["BC3-22"].
 * Kosong/null = belum ada akses utk warga.
 */
export function parseDuesAccessHouseIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((b: unknown) => String(b).trim().toUpperCase()).filter(Boolean);
    return [];
  } catch {
    return [];
  }
}

export function buildMonthlySummary(transactions: CashTransaction[], monthsToShow = 6): MonthlySummary[] {
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

  const byMonth = new Map<string, { year: number; month: number; income: number; expense: number }>();

  for (const tx of sorted) {
    const key = `${tx.date.getFullYear()}-${tx.date.getMonth()}`;
    const entry = byMonth.get(key) ?? { year: tx.date.getFullYear(), month: tx.date.getMonth(), income: 0, expense: 0 };
    if (tx.type === "INCOME") entry.income += tx.amount;
    else entry.expense += tx.amount;
    byMonth.set(key, entry);
  }

  const ordered = Array.from(byMonth.values()).sort((a, b) => a.year - b.year || a.month - b.month);

  let running = 0;
  const withBalance = ordered.map((entry) => {
    running += entry.income - entry.expense;
    return {
      month: `${MONTH_LABELS[entry.month]} ${entry.year}`,
      income: entry.income,
      expense: entry.expense,
      balance: running,
    };
  });

  return withBalance.slice(-monthsToShow);
}

/**
 * Hitung berapa bulan berturut-turut sebuah rumah belum bayar, berjalan
 * mundur dari bulan yang dilihat. Bulan tanpa catatan (tapi rumah punya
 * riwayat) dihitung sebagai belum bayar; bulan lunas menghentikan hitungan.
 */
export function countOverdueMonths(
  duesByHouse: Map<string, { year: number; month: number; isPaid: boolean }[]>,
  houseId: string,
  year: number,
  month: number
): number {
  const list = duesByHouse.get(houseId) ?? [];
  if (list.length === 0) return 0;

  const dueByKey = new Map(list.map((d) => [`${d.year}-${d.month}`, d]));
  const earliest = list.reduce((min, d) =>
    d.year < min.year || (d.year === min.year && d.month < min.month) ? d : min
  );

  let count = 0;
  let cursor = { year, month };
  while (cursor.year > earliest.year || (cursor.year === earliest.year && cursor.month >= earliest.month)) {
    const due = dueByKey.get(`${cursor.year}-${cursor.month}`);
    if (due?.isPaid) break;
    count += 1;
    cursor = cursor.month === 1 ? { year: cursor.year - 1, month: 12 } : { year: cursor.year, month: cursor.month - 1 };
  }
  return count;
}

export function computeTotals(transactions: CashTransaction[]) {
  return transactions.reduce(
    (acc, tx) => {
      if (tx.type === "INCOME") acc.income += tx.amount;
      else acc.expense += tx.amount;
      acc.balance = acc.income - acc.expense;
      return acc;
    },
    { income: 0, expense: 0, balance: 0 }
  );
}

export function getAvailableYears(transactions: CashTransaction[]): number[] {
  const years = new Set(transactions.map((tx) => tx.date.getFullYear()));
  return Array.from(years).sort((a, b) => b - a);
}

export type CategoryBreakdown = {
  category: CashTransaction["category"];
  type: CashTransaction["type"];
  amount: number;
};

export type AnnualCashSummary = ReturnType<typeof buildAnnualSummary>;

export function buildAnnualSummary(transactions: CashTransaction[], year: number) {
  const inYear = transactions.filter((tx) => tx.date.getFullYear() === year);
  const totals = computeTotals(inYear);

  const byCategory = new Map<string, CategoryBreakdown>();
  for (const tx of inYear) {
    const key = `${tx.type}:${tx.category}`;
    const entry = byCategory.get(key) ?? { category: tx.category, type: tx.type, amount: 0 };
    entry.amount += tx.amount;
    byCategory.set(key, entry);
  }

  return {
    year,
    income: totals.income,
    expense: totals.expense,
    balance: totals.balance,
    transactionCount: inYear.length,
    byCategory: Array.from(byCategory.values()).sort((a, b) => b.amount - a.amount),
  };
}
