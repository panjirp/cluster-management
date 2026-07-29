import { SignOutButton } from "@/components/layout/sign-out-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/app/generated/prisma/client";

const roleConfig: Record<Role, { label: string; className: string }> = {
  WARGA: { label: "Warga", className: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  ADMIN: { label: "Admin/Pengurus", className: "border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-400" },
  BENDAHARA: { label: "Bendahara", className: "border-transparent bg-green-500/15 text-green-700 dark:text-green-400" },
};

export function Navbar({
  name,
  role,
  badges,
}: {
  name: string;
  role: Role;
  badges?: Record<string, number>;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <MobileNav role={role} badges={badges} />
        <span className="truncate text-sm font-medium">{name}</span>
        <Badge variant="outline" className={`hidden shrink-0 sm:inline-flex ${roleConfig[role].className}`}>
          {roleConfig[role].label}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
