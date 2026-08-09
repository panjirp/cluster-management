import type { Role } from "@/app/generated/prisma/client";
import { NavLinks } from "@/components/layout/nav-links";
import { BrandMark } from "@/components/layout/brand-mark";
import { InstagramLink } from "@/components/layout/instagram-link";

export function Sidebar({ role, badges }: { role: Role; badges?: Record<string, number> }) {
  return (
    <nav className="hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar p-4 md:flex">
      <BrandMark />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavLinks role={role} badges={badges} />
      </div>
      <div className="shrink-0 pt-4">
        <InstagramLink />
      </div>
    </nav>
  );
}
