"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Warga menandai paket sudah diambil dari pos satpam. */
export function PickUpButton({ parcelId }: { parcelId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function pickUp() {
    setBusy(true);
    const res = await fetch(`/api/parcels/${parcelId}`, { method: "PATCH" });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(body.error ?? "Gagal memperbarui status.");
      return;
    }
    toast.success("Paket ditandai sudah diambil.");
    router.refresh();
  }

  return (
    <Button variant="outline" className="w-full" onClick={pickUp} disabled={busy}>
      <PackageCheck className="size-4" /> Sudah Saya Ambil
    </Button>
  );
}
