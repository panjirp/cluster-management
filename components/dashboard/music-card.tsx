"use client";

import { Music2, ExternalLink, Headphones } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// URL pemutar musik Barcelona Cove (deploy Vercel). Ubah sesuai URL final.
const MUSIC_URL =
  process.env.NEXT_PUBLIC_MUSIC_URL ?? "https://barcelona-cove-music.vercel.app";

export function MusicCard() {
  function openPlayer() {
    // Buka di tab baru supaya musik tetap jalan saat navigasi/portal ditutup.
    window.open(MUSIC_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <Music2 className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">
              Barcelona Cove Music
            </p>
            <p className="text-xs text-muted-foreground">
              Dengerin musik gratis — buka di tab baru supaya tetap nyala saat keliling portal.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={openPlayer}>
          <Headphones className="mr-2 size-4" /> Putar Musik
        </Button>
      </CardContent>
    </Card>
  );
}
