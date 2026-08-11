"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/app/generated/prisma/client";
import { mainNavItems, bendaharaNavItems, adminNavItems, type NavItem } from "@/components/layout/nav-items";
import { Upload, Wallet } from "lucide-react";

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
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
  canViewDues,
  onNavigate,
}: {
  role: Role;
  badges?: Record<string, number>;
  canViewDues?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  // Item aktif hanya jika path cocok persis atau berada di bawahnya.
  // Pengecualian: "Uang Kas" (/cash) tidak ikut aktif saat di halaman "Pembayaran Kas".
  function isActive(href: string): boolean {
    if (pathname === href) return true;
    if (!pathname.startsWith(href + "/")) return false;
    if (href === "/cash" && pathname.startsWith("/cash/dues/proof-submit")) return false;
    return true;
  }

  // "Pembayaran Kas": untuk bendahara/admin arahkan ke Review Bukti (bukan halaman warga)
  const paymentNavItem: NavItem =
    role === "ADMIN" || role === "BENDAHARA"
      ? { href: "/admin/payment-proofs", label: "Pembayaran Kas", icon: Upload }
      : { href: "/cash/dues/proof-submit", label: "Pembayaran Kas", icon: Upload };

  // "Iuran Kas" untuk warga: arahkan ke /cash/dues (auto-redirect ke riwayat rumah sendiri).
  const duesNavItem: NavItem = { href: "/cash/dues", label: "Iuran Kas", icon: Wallet };

  return (
    <>
      {mainNavItems.map((item) => {
        if (role === "WARGA") {
          // "Iuran Kas": hanya muncul utk warga yg rumahnya masuk whitelist (Setting.duesAccessHouseIds).
          if (item.href === "/cash") {
            if (!canViewDues) return null;
            return <NavLink key="warga-dues" item={duesNavItem} active={isActive("/cash/dues")} onNavigate={onNavigate} />;
          }
          if (item.href === "/cash/dues/proof-submit") {
            return null;
          }
        }
        const resolved = item.href === "/cash/dues/proof-submit" ? paymentNavItem : item;
        return (
          <NavLink
            key={resolved.href}
            item={resolved}
            active={isActive(resolved.href)}
            badgeCount={badges?.[resolved.href]}
            onNavigate={onNavigate}
          />
        );
      })}

      {(role === "ADMIN" || role === "BENDAHARA") && (
        <>
          <p className="mt-4 mb-1 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Pengurus
          </p>
          {bendaharaNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              badgeCount={badges?.[item.href]}
              onNavigate={onNavigate}
            />
          ))}
        </>
      )}

      {role === "ADMIN" && (
        <>
          <p className="mt-4 mb-1 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Admin
          </p>
          {adminNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              badgeCount={badges?.[item.href]}
              onNavigate={onNavigate}
            />
          ))}
        </>
      )}
    </>
  );
}
