import Link from "next/link";
import type { Metadata } from "next";
import {
  MessageSquareWarning,
  FileCheck2,
  Wallet,
  Users,
  PlusCircle,
  CalendarClock,
  CalendarDays,
  History,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeTotals } from "@/lib/cash";

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

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(date);
}

async function getUpcomingEvents() {
  const events = await prisma.event.findMany({
    where: { eventDate: { gte: new Date() } },
    orderBy: { eventDate: "asc" },
    take: 3,
    include: { rsvps: { where: { status: "GOING" } } },
  });
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    location: e.location,
    eventDate: e.eventDate,
    goingCount: e.rsvps.length,
  }));
}

function UpcomingEventsSection({ events }: { events: Awaited<ReturnType<typeof getUpcomingEvents>> }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Acara Mendatang</h2>
        <Link href="/events" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <CalendarDays className="size-4" />
          Lihat semua
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada acara mendatang.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} className="group block">
              <Card className="transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-medium group-hover:text-primary">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventDate(event.eventDate)}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {event.goingCount} Akan Hadir
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await requireUser();
  const { role, id: userId } = session.user;

  if (role === "WARGA") {
    const now = new Date();
    const [openComplaints, pendingPermits, due, upcomingEvents] = await Promise.all([
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
      getUpcomingEvents(),
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
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/complaints/new">Buat Pengaduan</Link>} />
          <Button variant="outline" render={<Link href="/permits/new">Ajukan Izin</Link>} />
        </div>

        <UpcomingEventsSection events={upcomingEvents} />
      </div>
    );
  }

  if (role === "ADMIN") {
    const [openComplaints, pendingPermits, recentActivity, upcomingEvents] = await Promise.all([
      prisma.complaint.count({ where: { status: { not: "RESOLVED" } } }),
      prisma.permit.count({ where: { status: "PENDING" } }),
      prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      getUpcomingEvents(),
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Aktivitas Terbaru</h2>
            <Link href="/admin/activity-log" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <History className="size-4" />
              Lihat semua
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((log) => (
                <Card key={log.id}>
                  <CardContent className="py-3">
                    <p className="text-sm">
                      <span className="font-medium">{log.actorName}</span> — {log.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activityActionLabels[log.action] ?? log.action} · {formatDateTime(log.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <UpcomingEventsSection events={upcomingEvents} />
      </div>
    );
  }

  // BENDAHARA
  const now = new Date();
  const [transactions, unpaidDues, upcomingEvents] = await Promise.all([
    prisma.cashTransaction.findMany(),
    prisma.monthlyDue.count({
      where: { year: now.getFullYear(), month: now.getMonth() + 1, isPaid: false },
    }),
    getUpcomingEvents(),
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

      <UpcomingEventsSection events={upcomingEvents} />
    </div>
  );
}
