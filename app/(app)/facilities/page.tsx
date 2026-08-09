import Link from "next/link";
import type { Metadata } from "next";
import { Landmark, Building2, Dumbbell, Trees, CalendarPlus, type LucideIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Fasilitas" };

const assetIcon: Record<string, LucideIcon> = {
  "Casa Club": Building2,
  "Lapangan Olahraga": Dumbbell,
  "Taman Bermain Anak": Trees,
};

function formatDateRange(start: Date, end: Date) {
  const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
  return `${fmt.format(start)} — ${fmt.format(end)}`;
}

const statusBadge: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  APPROVED: "bg-green-500/15 text-green-600 dark:bg-lime-400/10 dark:text-lime-400",
  REJECTED: "bg-red-500/15 text-red-600 dark:bg-red-400/10 dark:text-red-400",
};

const statusLabel: Record<string, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export default async function FacilitiesPage() {
  await requireUser();

  const assets = await prisma.asset.findMany({
    orderBy: { name: "asc" },
    include: {
      bookings: {
        orderBy: { borrowDate: "desc" },
        include: {
          permit: {
            select: {
              id: true,
              title: true,
              status: true,
              createdBy: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6 pb-32">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fasilitas Umum</h1>
          <p className="text-sm text-muted-foreground">
            Aset bersama cluster — lihat jadwal pemakaian & ajukan peminjaman
          </p>
        </div>
        <Button className="w-full sm:w-auto" render={<Link href="/permits/new?type=ACARA">Ajukan Pemakaian</Link>}>
          <CalendarPlus className="size-4" />
          Ajukan Pemakaian
        </Button>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Belum ada fasilitas terdaftar"
          description="Fasilitas bersama akan tampil di sini."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {assets.map((asset) => {
            const Icon = assetIcon[asset.name] ?? Landmark;
            return (
              <Card key={asset.id} className="transition-colors hover:border-primary/40">
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/20">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <h2 className="truncate text-base font-semibold">{asset.name}</h2>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {asset.bookings.length} pemakaian
                    </Badge>
                  </div>

                {asset.bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada jadwal pemakaian.</p>
                ) : (
                  <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                    {asset.bookings.map((b) => (
                      <div
                        key={b.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/permits/${b.permit.id}`}
                            className="block truncate text-sm font-medium hover:text-primary"
                          >
                            {b.permit.title}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {b.permit.createdBy.name} · {formatDateRange(b.borrowDate, b.returnDate)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[b.permit.status] ?? ""}`}
                        >
                          {statusLabel[b.permit.status] ?? b.permit.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
