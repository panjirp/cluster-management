"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NavLinks } from "@/components/layout/nav-links";
import { BrandMark } from "@/components/layout/brand-mark";
import { InstagramLink } from "@/components/layout/instagram-link";
import { SupportContact } from "@/components/layout/support-contact";
import type { Role } from "@/app/generated/prisma/client";

export function MobileNav({ role, badges }: { role: Role; badges?: Record<string, number> }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Buka menu">
        <Menu className="size-5" />
      </Button>
      <SheetContent side="left" className="flex w-64 flex-col p-4">
        <SheetHeader className="p-0">
          <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
          <BrandMark />
        </SheetHeader>
        <nav className="min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          <NavLinks role={role} badges={badges} onNavigate={() => setOpen(false)} />
        </nav>
        <div className="flex shrink-0 items-center gap-1 pt-4">
          <InstagramLink />
          <SupportContact />
        </div>
      </SheetContent>
    </Sheet>
  );
}
