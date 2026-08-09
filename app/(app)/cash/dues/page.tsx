import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { DuesGrid } from "@/components/cash/dues-grid";
import { GenerateDuesButton } from "@/components/cash/generate-dues-button";
import { DuesAmountSetting } from "@/components/cash/dues-amount-setting";
import { ImportDuesSheetDialog } from "@/components/cash/import-dues-sheet-dialog";
import { compareBlockNumber } from "@/lib/sort";
import { countOverdueMonths } from "@/lib/cash";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Iuran Bulanan" };

export default async function DuesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await requireUser();
  // Fitur kas: nonaktif sementara untuk warga (aktif kembali jika diminta)
  if (session.user.role === "WARGA") {
    redirect("/dashboard");
  }
  const isBendahara = session.user.role === "BENDAHARA";
  const params = await searchParams;

  const now = new Date();
  const year = Number(params.year ?? now.getFullYear());
  const month = Number(params.month ?? now.getMonth() + 1);

  const [houses, priorDues] = await Promise.all([
    prisma.house.findMany({
      include: {
        monthlyDues: { where: { year, month } },
        residents: { select: { name: true } },
      },
    }),
    // History up to the viewed month, used to compute how many consecutive
    // months a house has been unpaid (including the viewed month itself).
    prisma.monthlyDue.findMany({
      where: { OR: [{ year: { lt: year } }, { year, month: { lte: month } }] },
      select: { houseId: true, year: true, month: true, isPaid: true },
    }),
  ]);
  houses.sort((a, b) => compareBlockNumber(a.blockNumber, b.blockNumber));

  const duesByHouse = new Map<string, { year: number; month: number; isPaid: boolean }[]>();
  for (const due of priorDues) {
    const list = duesByHouse.get(due.houseId) ?? [];
    list.push(due);
    duesByHouse.set(due.houseId, list);
  }

  const setting = await prisma.setting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  const houseData = houses.map((house) => {
    const hasHistory = (duesByHouse.get(house.id)?.length ?? 0) > 0;
    return {
      id: house.id,
      blockNumber: house.blockNumber,
      ownerName: house.residents.map((r) => r.name).join(", ") || house.residentName || null,
      contactPhone: isBendahara ? house.contactPhone : null,
      due: house.monthlyDues[0]
        ? {
            id: house.monthlyDues[0].id,
            amount: house.monthlyDues[0].amount,
            isPaid: house.monthlyDues[0].isPaid,
            paidAt: house.monthlyDues[0].paidAt?.toISOString() ?? null,
          }
        : null,
      hasHistory,
      overdueMonths: hasHistory ? countOverdueMonths(duesByHouse, house.id, year, month) : 0,
    };
  });

  const allGenerated = houseData.every((h) => h.due !== null);

  return (
    <div className="space-y-6">
      <BackLink href="/cash" label="Kembali ke Uang Kas" />
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Iuran Bulanan</h1>
        <p className="text-sm text-muted-foreground">Rekap status pembayaran iuran per rumah</p>
      </div>

      {isBendahara && <DuesAmountSetting initialAmount={setting.duesAmount} />}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          render={
            <a href={`/api/cash/dues/export?year=${year}&month=${month}`}>
              <Download data-icon="inline-start" />
              Export CSV
            </a>
          }
        />
        {isBendahara && <ImportDuesSheetDialog defaultSheetUrl={setting.duesSheetUrl} />}
        {isBendahara && !allGenerated && <GenerateDuesButton year={year} month={month} />}
      </div>

      <DuesGrid key={`${year}-${month}`} houses={houseData} canManage={isBendahara} year={year} month={month} />
    </div>
  );
}
