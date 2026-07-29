"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/app/generated/prisma/client";
import { mainNavItems, adminNavItems, type NavItem } from "@/components/layout/nav-items";

function NavLink({
  item,
  active,
  badgeCount,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  badgeCount?: number;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {!!badgeCount && (
        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-destructive px-1 text-xs font-semibold text-white">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </Link>
  );
}

export function NavLinks({
  role,
  badges,
  onNavigate,
}: {
  role: Role;
  badges?: Record<string, number>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mainNavItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={pathname.startsWith(item.href)}
          badgeCount={badges?.[item.href]}
          onNavigate={onNavigate}
        />
      ))}

      {role === "ADMIN" && (
        <>
          <p className="mt-4 mb-1 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Admin
          </p>
          {adminNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
              badgeCount={badges?.[item.href]}
              onNavigate={onNavigate}
            />
          ))}
        </>
      )}
    </>
  );
}
