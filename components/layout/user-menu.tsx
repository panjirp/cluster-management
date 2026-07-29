"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { User, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/app/generated/prisma/client";

const roleConfig: Record<Role, { label: string; className: string }> = {
  WARGA: { label: "Warga", className: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  ADMIN: { label: "Admin/Pengurus", className: "border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-400" },
  BENDAHARA: { label: "Bendahara", className: "border-transparent bg-green-500/15 text-green-700 dark:text-green-400" },
};

export function UserMenu({ name, role }: { name: string; role: Role }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            aria-label={`Menu akun ${name}`}
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-muted text-muted-foreground outline-none hover:bg-muted/70"
          >
            <User className="size-4.5" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1 font-normal">
            <span className="truncate text-sm font-medium text-foreground">{name}</span>
            <Badge variant="outline" className={`w-fit ${roleConfig[role].className}`}>
              {roleConfig[role].label}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profile" />}>
          <User data-icon="inline-start" />
          Profil Saya
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut data-icon="inline-start" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
