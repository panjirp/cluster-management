import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parseDuesAccessHouseIds } from "@/lib/cash";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { CopyrightFooter } from "@/components/layout/copyright-footer";
import { GrassBackground } from "@/components/shared/grass-background";
import { FcmPushRegister } from "@/components/shared/fcm-push-register";
import { AssistantBot } from "@/components/shared/assistant-bot";
import { WebPushRegister } from "@/components/pwa/web-push-register";

async function getNavBadges(role: string): Promise<Record<string, number>> {
  if (role === "ADMIN") {
    const [openComplaints, pendingPermits, openEmergency] = await Promise.all([
      prisma.complaint.count({ where: { status: { not: "RESOLVED" } } }),
      prisma.permit.count({ where: { status: "PENDING" } }),
      prisma.emergencyAlert.count({ where: { status: "OPEN" } }),
    ]);
    return { "/complaints": openComplaints, "/permits": pendingPermits, "/admin/emergency": openEmergency };
  }

  if (role === "BENDAHARA") {
    const now = new Date();
    const [openEmergency, unpaidDues] = await Promise.all([
      prisma.emergencyAlert.count({ where: { status: "OPEN" } }),
      prisma.monthlyDue.count({
        where: { year: now.getFullYear(), month: now.getMonth() + 1, isPaid: false },
      }),
    ]);
    return { "/admin/emergency": openEmergency, "/cash": unpaidDues };
  }

  return {};
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const badges = await getNavBadges(session.user.role);

  // Whitelist "Iuran Kas" utk warga: hanya rumah di Setting.duesAccessHouseIds.
  let canViewDues = session.user.role !== "WARGA";
  if (session.user.role === "WARGA" && session.user.houseId) {
    const [setting, house] = await Promise.all([
      prisma.setting.findUnique({ where: { id: "singleton" }, select: { duesAccessHouseIds: true } }),
      prisma.house.findUnique({ where: { id: session.user.houseId }, select: { blockNumber: true } }),
    ]);
    const allowed = parseDuesAccessHouseIds(setting?.duesAccessHouseIds);
    canViewDues = !!house && allowed.includes(house.blockNumber.toUpperCase());
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { userId: session.user.id, read: false } }),
  ]);

  return (
    <>
      <GrassBackground />
      <FcmPushRegister />
      <AssistantBot />
      <div className="flex min-h-screen flex-1">
        <Sidebar role={session.user.role} badges={badges} canViewDues={canViewDues} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar
            name={session.user.name ?? session.user.email ?? ""}
            role={session.user.role}
            badges={badges}
            notifications={notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))}
            unreadCount={unreadCount}
            canViewDues={canViewDues}
          />
          <div className="px-4 pt-4 sm:px-6">
            <WebPushRegister />
          </div>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
          <CopyrightFooter />
        </div>
      </div>
    </>
  );
}
