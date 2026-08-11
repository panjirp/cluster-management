import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { wargaCanViewCash } from "@/lib/cash-access";
import { BackLink } from "@/components/shared/back-link";
import { AnnualCashSummary } from "@/components/cash/annual-cash-summary";

export const metadata: Metadata = { title: "Rekap Tahunan Kas" };

export default async function AnnualCashPage() {
  const session = await requireUser();
  // WARGA: hanya jika rumahnya masuk whitelist (Setting.duesAccessHouseIds).
  if (!(await wargaCanViewCash(session.user.role, session.user.houseId))) {
    redirect("/dashboard");
  }
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
