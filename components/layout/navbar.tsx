import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { GlobalSearch } from "@/components/layout/global-search";
import { Button } from "@/components/ui/button";
import type { Role } from "@/app/generated/prisma/client";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string;
};

export function Navbar({
  name,
  role,
  badges,
  notifications,
  unreadCount,
}: {
  name: string;
  role: Role;
  badges?: Record<string, number>;
  notifications: NotificationRow[];
  unreadCount: number;
}) {
  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <div className="flex items-center gap-2">
        <MobileNav role={role} badges={badges} />
      </div>
      <div className="flex items-center gap-2">
        <GlobalSearch />
        <Button variant="outline" size="icon-sm" aria-label="Bantuan" render={<Link href="/help" />}>
          <HelpCircle />
        </Button>
        <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} />
        <ThemeToggle />
        <UserMenu name={name} role={role} />
      </div>
    </header>
  );
}
