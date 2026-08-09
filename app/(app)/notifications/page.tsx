import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { NotificationsList } from "@/components/notifications/notifications-list";

export const metadata: Metadata = { title: "Notifikasi" };

export default async function NotificationsPage() {
  const session = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifikasi</h1>
          <p className="text-sm text-muted-foreground">Semua pemberitahuan untuk akun kamu</p>
        </div>
      </div>

      <NotificationsList
        initialNotifications={notifications.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          url: n.url,
          read: n.read,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
