"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PermitStatus } from "@/app/generated/prisma/client";

const statusOptions: { value: PermitStatus; label: string }[] = [
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
];

export function PermitStatusForm({
  permitId,
  currentStatus,
  currentNotes,
}: {
  permitId: string;
  currentStatus: PermitStatus;
  currentNotes: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<PermitStatus>(currentStatus);
  const [adminNotes, setAdminNotes] = useState(currentNotes ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const res = await fetch(`/api/permits/${permitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes }),
    });
    setSubmitting(false);

    if (!res.ok) {
      toast.error("Gagal memperbarui permohonan.");
      return;
    }

    toast.success("Permohonan izin diperbarui.");
    router.push("/permits");
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <p className="text-sm font-medium">Kelola Permohonan</p>
      <div className="flex flex-col gap-2">
        <Label>Status</Label>
        <Select
          items={Object.fromEntries(statusOptions.map((o) => [o.value, o.label]))}
          value={status}
          onValueChange={(v) => setStatus(v as PermitStatus)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Catatan Admin</Label>
        <Textarea rows={4} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
      </div>
      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Menyimpan..." : "Simpan"}
      </Button>
    </div>
  );
}
