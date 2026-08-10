"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Tombol membatalkan pass tamu yang masih aktif (tuan rumah). */
export function RevokeButton({ code }: { code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function revoke() {
    if (!confirm("Batalkan pass tamu ini? Tamu tidak akan bisa masuk dengan kode ini.")) return;
    setBusy(true);
    const res = await fetch(`/api/guest-passes/${code}/revoke`, { method: "PATCH" });
    setBusy(false);
    if (!res.ok) {
      toast.error("Gagal membatalkan pass.");
      return;
    }
    toast.success("Pass dibatalkan.");
    router.refresh();
  }

  return (
    <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={revoke} disabled={busy}>
      <Ban className="size-4" /> Batalkan Pass Ini
    </Button>
  );
}
