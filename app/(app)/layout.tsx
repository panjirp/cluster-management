import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

async function getNavBadges(role: string): Promise<Record<string, number>> {
  if (role === "ADMIN") {
    const [openComplaints, pendingPermits] = await Promise.all([
      prisma.complaint.count({ where: { status: { not: "RESOLVED" } } }),
      prisma.permit.count({ where: { status: "PENDING" } }),
    ]);
    return { "/complaints": openComplaints, "/permits": pendingPermits };
  }

  if (role === "BENDAHARA") {
    const now = new Date();
    const unpaidDues = await prisma.monthlyDue.count({
      where: { year: now.getFullYear(), month: now.getMonth() + 1, isPaid: false },
    });
    return { "/cash": unpaidDues };
  }

  return {};
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const badges = await getNavBadges(session.user.role);

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar role={session.user.role} badges={badges} />
      <div className="flex flex-1 flex-col">
        <Navbar name={session.user.name ?? session.user.email ?? ""} role={session.user.role} badges={badges} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
