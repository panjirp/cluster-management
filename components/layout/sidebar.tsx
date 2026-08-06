import type { Role } from "@/app/generated/prisma/client";
import { NavLinks } from "@/components/layout/nav-links";
import { BrandMark } from "@/components/layout/brand-mark";

export function Sidebar({ role, badges }: { role: Role; badges?: Record<string, number> }) {
  return (
    <nav className="hidden w-60 shrink-0 flex-col gap-1 border-r border-border bg-sidebar p-4 md:flex">
      <BrandMark />
      <NavLinks role={role} badges={badges} />
    </nav>
  );
}
