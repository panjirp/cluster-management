"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { EditHouseDialog } from "@/components/admin/edit-house-dialog";
import { houseStatusValues, houseStatusLabels } from "@/lib/validations/house";
import type { HouseStatus } from "@/app/generated/prisma/client";

export function HouseActions({
  houseId,
  blockNumber,
  currentStatus,
  residentName,
  contactPhone,
}: {
  houseId: string;
  blockNumber: string;
  currentStatus: HouseStatus;
  residentName: string | null;
  contactPhone: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function updateStatus(statusHuni: string) {
    setPending(true);
    const res = await fetch(`/api/houses/${houseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusHuni }),
    });
    setPending(false);

    if (!res.ok) {
      toast.error("Gagal mengubah status hunian.");
      return;
    }

    toast.success("Status hunian diperbarui.");
    router.refresh();
  }

  async function handleDelete() {
    const res = await fetch(`/api/houses/${houseId}`, { method: "DELETE" });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal menghapus rumah.");
      return;
    }

    toast.success("Rumah dihapus.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Select items={houseStatusLabels} value={currentStatus} onValueChange={(v) => v && updateStatus(v)}>
        <SelectTrigger size="sm" className="w-36" disabled={pending}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {houseStatusValues.map((value) => (
            <SelectItem key={value} value={value}>
              {houseStatusLabels[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <EditHouseDialog houseId={houseId} blockNumber={blockNumber} residentName={residentName} contactPhone={contactPhone} />
      <ConfirmDeleteButton
        title={`Hapus rumah ${blockNumber}?`}
        description="Data kas bulanan rumah ini juga akan terhapus. Tindakan ini tidak bisa dibatalkan."
        onConfirm={handleDelete}
      />
    </div>
  );
}
