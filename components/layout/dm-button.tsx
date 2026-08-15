"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DmButton() {
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dm");
      if (res.ok) {
        const threads = await res.json();
        setUnread(threads.reduce((acc: number, t: { unread: number }) => acc + t.unread, 0));
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label="Pesan antar warga"
      className="relative"
      render={<Link href="/dm" />}
    >
      <MessageSquare />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Button>
  );
}
