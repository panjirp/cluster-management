import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { DuesGrid } from "@/components/cash/dues-grid";
import { GenerateDuesButton } from "@/components/cash/generate-dues-button";
import { DuesAmountSetting } from "@/components/cash/dues-amount-setting";
import { ImportDuesSheetDialog } from "@/components/cash/import-dues-sheet-dialog";
import { compareBlockNumber } from "@/lib/sort";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Iuran Bulanan" };

const MONTH_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export default async function DuesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await requireUser();
  const isBendahara = session.user.role === "BENDAHARA";
  const params = await searchParams;

  const now = new Date();
  const year = Number(params.year ?? now.getFullYear());
  const month = Number(params.month ?? now.getMonth() + 1);

  const houses = (
    await prisma.house.findMany({
      include: {
        monthlyDues: { where: { year, month } },
        residents: { select: { name: true } },
      },
    })
  ).sort((a, b) => compareBlockNumber(a.blockNumber, b.blockNumber));

  const setting = await prisma.setting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  const houseData = houses.map((house) => ({
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
  }));

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const allGenerated = houseData.every((h) => h.due !== null);

  return (
    <div className="space-y-6">
      <BackLink href="/cash" label="Kembali ke Uang Kas" />
      <div>
        <h1 className="text-2xl font-semibold">Iuran Bulanan</h1>
        <p className="text-sm text-muted-foreground">Rekap status pembayaran iuran per rumah</p>
      </div>

      {isBendahara && <DuesAmountSetting initialAmount={setting.duesAmount} />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/cash/dues?year=${prev.year}&month=${prev.month}`}>&larr; Sebelumnya</Link>}
          />
          <span className="text-sm font-medium">
            {MONTH_LABELS[month - 1]} {year}
          </span>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/cash/dues?year=${next.year}&month=${next.month}`}>Berikutnya &rarr;</Link>}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<a href={`/api/cash/dues/export?year=${year}&month=${month}`}>Export CSV</a>}
          />
          {isBendahara && <ImportDuesSheetDialog defaultSheetUrl={setting.duesSheetUrl} />}
          {isBendahara && !allGenerated && <GenerateDuesButton year={year} month={month} />}
        </div>
      </div>

      <DuesGrid houses={houseData} canManage={isBendahara} year={year} month={month} />
    </div>
  );
}
