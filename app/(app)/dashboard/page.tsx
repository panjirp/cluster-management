import Link from "next/link";
import type { Metadata } from "next";
import {
  MessageSquareWarning,
  FileCheck2,
  Wallet,
  Users,
  PlusCircle,
  CalendarClock,
  History,
  ArrowUpRight,
  LayoutDashboard,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeTotals } from "@/lib/cash";
import GroupChat from "@/components/chat/group-chat";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import PerlintasanKeretaStatus from "@/components/widgets/PerlintasanKeretaStatus";
import KrlScheduleWidget from "@/components/widgets/KrlScheduleWidget";

const activityActionLabels: Record<string, string> = {
  UPDATE_COMPLAINT_STATUS: "Pengaduan",
  UPDATE_PERMIT_STATUS: "Perizinan",
  DELETE_RESIDENT: "Warga",
  DELETE_HOUSE: "Rumah",
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export const metadata: Metadata = { title: "Dashboard" };

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

const chipStyles = {
  amber: "bg-amber-500/15 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  blue: "bg-blue-500/15 text-blue-600 dark:bg-sky-400/10 dark:text-sky-400",
  green: "bg-green-500/15 text-green-600 dark:bg-lime-400/10 dark:text-lime-400",
  violet: "bg-violet-500/15 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400",
} as const;

function StatCard({
  href,
  title,
  value,
  icon: Icon,
  accent,
}: {
  href: string;
  title: string;
  value: string;
  icon: LucideIcon;
  accent: keyof typeof chipStyles;
}) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="relative h-full overflow-hidden transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-[0_8px_28px_-16px_color-mix(in_oklab,var(--primary)_45%,transparent)]">
        <div className="pointer-events-none absolute -top-8 -right-8 size-20 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
        <CardContent className="flex items-center gap-3 px-3.5 py-3">
          <div
            className={`grid size-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset ring-foreground/10 ${chipStyles[accent]}`}
          >
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight tracking-tight tabular-nums transition-colors group-hover:text-primary">
              {value}
            </p>
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{title}</p>
          </div>
          <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-muted-foreground/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardHeader({ name }: { name: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/20">
          <LayoutDashboard className="size-6 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Portal Cluster
            </p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Selamat datang, {name.split(" ")[0]}</h1>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await requireUser();
  const { role, id: userId } = session.user;

  if (role === "WARGA") {
    const duesEnabled = false;
    const now = new Date();
    const [openComplaints, pendingPermits, due] = await Promise.all([
      prisma.complaint.count({ where: { createdById: userId, status: { not: "RESOLVED" } } }),
      prisma.permit.count({ where: { createdById: userId, status: "PENDING" } }),
      session.user.houseId
        ? prisma.monthlyDue.findUnique({
            where: {
              houseId_year_month: {
                houseId: session.user.houseId,
                year: now.getFullYear(),
                month: now.getMonth() + 1,
              },
            },
          })
        : null,
    ]);

    return (
      <div className="space-y-6">
        <DashboardHeader name={session.user.name ?? "Warga"} />
        <WeatherWidget />
        <PerlintasanKeretaStatus />
        <KrlScheduleWidget />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            href="/complaints"
            title="Pengaduan Aktif"
            value={String(openComplaints)}
            icon={MessageSquareWarning}
            accent="amber"
          />
          <StatCard
            href="/permits"
            title="Izin Menunggu"
            value={String(pendingPermits)}
            icon={FileCheck2}
            accent="blue"
          />
          {duesEnabled && (
            <StatCard
              href="/cash/dues"
              title="Iuran Bulan Ini"
              value={due ? (due.isPaid ? "Lunas" : "Belum Bayar") : "Belum Dibuat"}
              icon={Wallet}
              accent="green"
            />
          )}
        </div>

        {duesEnabled && session.user.houseId && due?.isPaid && (
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/20">
                  <CheckCircle2 className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Iuran bulan ini sudah lunas</p>
                  <p className="text-xs text-muted-foreground">
                    {due.paymentProofUrl
                      ? "Bukti pembayaran tersimpan."
                      : "Unggah bukti pembayaran untuk arsip bendahara."}
                  </p>
                </div>
              </div>
              {due.paymentProofUrl ? (
                <a
                  href={due.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
                >
                  Lihat Bukti Pembayaran
                  <ArrowUpRight className="size-4" />
                </a>
              ) : (
                <form
                  action={`/api/cash/dues/proof?id=${due.id}`}
                  method="POST"
                  encType="multipart/form-data"
                  className="flex flex-wrap items-center gap-2"
                >
                  <input
                    type="file"
                    name="file"
                    accept="image/*,.pdf"
                    className="block h-9 w-64 cursor-pointer rounded-lg border px-3 text-sm file:mr-2 file:h-7 file:rounded-md file:border-0 file:bg-primary/10 file:px-2 file:text-sm file:font-medium file:text-primary hover:bg-muted"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Upload Bukti
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/complaints/new">Buat Pengaduan</Link>} />
          <Button variant="outline" render={<Link href="/permits/new">Ajukan Izin</Link>} />
        </div>

        <GroupChat />
      </div>
    );
  }

  if (role === "ADMIN") {
    const [openComplaints, pendingPermits, recentActivity] = await Promise.all([
      prisma.complaint.count({ where: { status: { not: "RESOLVED" } } }),
      prisma.permit.count({ where: { status: "PENDING" } }),
      prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

    return (
      <div className="space-y-6">
        <DashboardHeader name={session.user.name ?? "Admin"} />
        <WeatherWidget />
        <PerlintasanKeretaStatus />
        <KrlScheduleWidget />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            href="/complaints"
            title="Pengaduan Perlu Ditindak"
            value={String(openComplaints)}
            icon={MessageSquareWarning}
            accent="amber"
          />
          <StatCard
            href="/permits"
            title="Izin Menunggu Persetujuan"
            value={String(pendingPermits)}
            icon={FileCheck2}
            accent="blue"
          />
          <StatCard
            href="/admin/residents"
            title="Kelola Warga & Rumah"
            value="Buka"
            icon={Users}
            accent="violet"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="size-5 text-primary" />
              <h2 className="font-semibold tracking-tight">Aktivitas Terbaru</h2>
            </div>
            <Link href="/admin/activity-log" className="text-sm text-primary hover:underline flex items-center gap-1">
              Lihat semua <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((log) => (
                <Card key={log.id} className="transition-colors hover:border-primary/30">
                  <CardContent className="flex items-start gap-3 py-3.5">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">{log.actorName}</span>{" "}
                        <span className="text-muted-foreground">— {log.description}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {activityActionLabels[log.action] ?? log.action} · {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <GroupChat />
      </div>
    );
  }

  // BENDAHARA
  const now = new Date();
  const [transactions, unpaidDues] = await Promise.all([
    prisma.cashTransaction.findMany(),
    prisma.monthlyDue.count({
      where: { year: now.getFullYear(), month: now.getMonth() + 1, isPaid: false },
    }),
  ]);
  const totals = computeTotals(transactions);

  return (
    <div className="space-y-6">
      <DashboardHeader name={session.user.name ?? "Bendahara"} />
      <WeatherWidget />
      <PerlintasanKeretaStatus />
      <KrlScheduleWidget />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          href="/cash"
          title="Saldo Kas Saat Ini"
          value={formatRupiah(totals.balance)}
          icon={Wallet}
          accent="green"
        />
        <StatCard
          href="/cash/dues"
          title="Rumah Belum Bayar Bulan Ini"
          value={String(unpaidDues)}
          icon={CalendarClock}
          accent="amber"
        />
        <StatCard
          href="/cash/transactions/new"
          title="Tambah Transaksi"
          value="Buka"
          icon={PlusCircle}
          accent="blue"
        />
      </div>

      <GroupChat />
    </div>
  );
}
