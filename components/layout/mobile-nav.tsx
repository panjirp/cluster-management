"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NavLinks } from "@/components/layout/nav-links";
import { BrandMark } from "@/components/layout/brand-mark";
import type { Role } from "@/app/generated/prisma/client";

export function MobileNav({ role, badges }: { role: Role; badges?: Record<string, number> }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Buka menu">
        <Menu className="size-5" />
      </Button>
      <SheetContent side="left" className="w-64 p-4">
        <SheetHeader className="p-0">
          <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
          <BrandMark />
        </SheetHeader>
        <nav className="flex flex-col gap-1">
          <NavLinks role={role} badges={badges} onNavigate={() => setOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
