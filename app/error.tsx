"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary/15 via-background to-background p-4 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Terjadi Kesalahan</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Maaf, ada yang tidak berjalan semestinya. Coba muat ulang halaman ini, atau kembali ke dashboard.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => reset()}>
          Coba Lagi
        </Button>
        <Button render={<Link href="/dashboard">Kembali ke Dashboard</Link>} />
      </div>
    </div>
  );
}
