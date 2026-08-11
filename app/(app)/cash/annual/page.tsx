import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { BackLink } from "@/components/shared/back-link";
import { AnnualCashSummary } from "@/components/cash/annual-cash-summary";

export const metadata: Metadata = { title: "Rekap Tahunan Kas" };

export default async function AnnualCashPage() {
  const session = await requireUser();
  const transactions = await prisma.cashTransaction.findMany({ orderBy: { date: "desc" } });

  return (
    <div className="space-y-6">
      <BackLink href="/cash" label="Kembali ke Uang Kas" />
      <div>
        <h1 className="text-2xl font-semibold">Rekap Tahunan Kas</h1>
        <p className="text-sm text-muted-foreground">Ringkasan keuangan per tahun untuk laporan pertanggungjawaban</p>
      </div>

      <AnnualCashSummary transactions={transactions} />
    </div>
  );
}
