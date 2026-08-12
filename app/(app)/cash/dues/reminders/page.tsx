import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ReminderSender, type ReminderHouse } from "@/components/cash/reminder-sender";
import { BackLink } from "@/components/shared/back-link";
import { Button } from "@/components/ui/button";
import { buildDuesReminderText, indonesianMonthName } from "@/lib/whatsapp";
import { compareBlockNumber } from "@/lib/sort";
import { countOverdueMonths } from "@/lib/cash";

export const metadata: Metadata = { title: "Kirim Pengingat WA" };

const MONTH_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function monthHref(year: number, month: number) {
  return `/cash/dues/reminders?year=${year}&month=${month}`;
}

export default async function DuesRemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await requireUser();
  if (session.user.role !== "BENDAHARA" && session.user.role !== "ADMIN") {
    redirect("/cash/dues");
  }

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

  const monthLabel = indonesianMonthName(month);

  const rows: ReminderHouse[] = houses
    .map((house) => {
      const hasHistory = (duesByHouse.get(house.id)?.length ?? 0) > 0;
      const due = house.monthlyDues[0];
      const ownerName = house.residents.map((r) => r.name).join(", ") || house.residentName || null;
      const amount = due?.amount ?? setting.duesAmount;
      return {
        houseId: house.id,
        blockNumber: house.blockNumber,
        ownerName,
        contactPhone: house.contactPhone,
        amount,
        overdueMonths: hasHistory ? countOverdueMonths(duesByHouse, house.id, year, month) : 0,
        preview: buildDuesReminderText(house.blockNumber, monthLabel, year, amount, ownerName),
        unpaid: (due && !due.isPaid) || (!due && hasHistory),
      };
    })
    .filter((h) => h.unpaid);

  const prevMonth = shiftMonth(year, month, -1);
  const nextMonth = shiftMonth(year, month, 1);

  return (
    <div className="space-y-6">
      <BackLink href="/cash/dues" label="Kembali ke Iuran Bulanan" />
      <div>
        <h1 className="text-2xl font-semibold">Kirim Pengingat WA</h1>
        <p className="text-sm text-muted-foreground">
          Kirim pengingat kas bulanan ke WhatsApp rumah yang belum bayar (via gateway Fonnte)
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" render={<Link href={monthHref(prevMonth.year, prevMonth.month)}>&larr; Sebelumnya</Link>} />
        <span className="text-sm font-medium">
          {MONTH_LABELS[month - 1]} {year}
        </span>
        <Button variant="outline" size="sm" render={<Link href={monthHref(nextMonth.year, nextMonth.month)}>Berikutnya &rarr;</Link>} />
      </div>

      <ReminderSender key={`${year}-${month}`} rows={rows} year={year} month={month} monthLabel={monthLabel} />
    </div>
  );
}
