import type { CashTransaction } from "@/app/generated/prisma/client";
import type { MonthlySummary } from "@/components/cash/cash-chart";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

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
