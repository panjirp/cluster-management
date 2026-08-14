"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NavLinks } from "@/components/layout/nav-links";
import { BrandMark } from "@/components/layout/brand-mark";
import { InstagramLink } from "@/components/layout/instagram-link";
import { SupportContact } from "@/components/layout/support-contact";
import type { Role } from "@/app/generated/prisma/client";

export function MobileNav({
  role,
  badges,
}: {
  role: Role;
  badges?: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);

  // Swipe gesture: layar kiri → kanan untuk buka sidebar
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = Math.abs(touchEndY - touchStartY);

      // Swipe dari kiri (start < 40px dari kiri) ke kanan (> 80px ke kanan)
      if (touchStartX < 40 && deltaX > 80 && deltaY < deltaX * 2) {
        setOpen(true);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

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
