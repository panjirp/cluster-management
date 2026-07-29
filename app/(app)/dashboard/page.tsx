import Link from "next/link";
import type { Metadata } from "next";
import {
  MessageSquareWarning,
  FileCheck2,
  Wallet,
  Users,
  PlusCircle,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { computeTotals } from "@/lib/cash";

export const metadata: Metadata = { title: "Dashboard" };

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

const chipStyles = {
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  green: "bg-green-500/15 text-green-600 dark:text-green-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
} as const;

function StatCard({
  href,
  title,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  href: string;
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent: keyof typeof chipStyles;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardContent className="flex items-center gap-4">
          <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${chipStyles[accent]}`}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
            <p className="truncate text-2xl font-semibold group-hover:text-primary">{value}</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await requireUser();
  const { role, id: userId } = session.user;

  if (role === "WARGA") {
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
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Selamat datang, {session.user.name}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <StatCard
            href="/cash/dues"
            title="Iuran Bulan Ini"
            value={due ? (due.isPaid ? "Lunas" : "Belum Bayar") : "Belum Dibuat"}
            icon={Wallet}
            accent="green"
          />
        </div>
      </div>
    );
  }

  if (role === "ADMIN") {
    const [openComplaints, pendingPermits] = await Promise.all([
      prisma.complaint.count({ where: { status: { not: "RESOLVED" } } }),
      prisma.permit.count({ where: { status: "PENDING" } }),
    ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Selamat datang, {session.user.name}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Selamat datang, {session.user.name}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
    </div>
  );
}
