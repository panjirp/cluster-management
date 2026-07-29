import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Riwayat Iuran" };

const MONTH_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

export default async function HouseDuesHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ houseId: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await requireUser();
  const { houseId } = await params;
  const search = await searchParams;

  if (session.user.role === "WARGA" && session.user.houseId !== houseId) {
    redirect("/cash/dues");
  }

  const house = await prisma.house.findUnique({
    where: { id: houseId },
    include: { residents: { select: { name: true } } },
  });
  if (!house) notFound();

  const dues = await prisma.monthlyDue.findMany({
    where: { houseId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 24,
  });

  const backHref = search.year && search.month ? `/cash/dues?year=${search.year}&month=${search.month}` : "/cash/dues";

  const ownerName = house.residents.map((r) => r.name).join(", ") || house.residentName;
  const paidCount = dues.filter((d) => d.isPaid).length;
  const unpaidCount = dues.filter((d) => !d.isPaid).length;

  return (
    <div className="max-w-2xl space-y-6">
      <BackLink href={backHref} label="Kembali ke Iuran Bulanan" />
      <div>
        <h1 className="text-2xl font-semibold">Riwayat Iuran — {house.blockNumber}</h1>
        <p className="text-sm text-muted-foreground">{ownerName ?? "Belum ada nama warga tercatat"}</p>
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{paidCount} bulan lunas</span>
        <span>{unpaidCount} bulan belum bayar</span>
        <span>{dues.length} catatan (maks. 24 bulan terakhir)</span>
      </div>

      {dues.length === 0 ? (
        <div className="rounded-lg border py-8 text-center text-sm text-muted-foreground">
          Belum ada catatan iuran untuk rumah ini.
        </div>
      ) : (
        <div className="space-y-2">
          {dues.map((due) => (
            <div key={due.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">
                  {MONTH_LABELS[due.month - 1]} {due.year}
                </p>
                {due.paidAt && <p className="text-xs text-muted-foreground">Dibayar {formatDate(due.paidAt)}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">{formatRupiah(due.amount)}</span>
                <Badge
                  variant="outline"
                  className={
                    due.isPaid
                      ? "border-transparent bg-green-500/15 text-green-700 dark:text-green-400"
                      : "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  }
                >
                  {due.isPaid ? "Lunas" : "Belum Bayar"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
