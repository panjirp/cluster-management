"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ComplaintStatus } from "@/app/generated/prisma/client";

const statusOptions: { value: ComplaintStatus; label: string }[] = [
  { value: "OPEN", label: "Terbuka" },
  { value: "IN_PROGRESS", label: "Diproses" },
  { value: "RESOLVED", label: "Selesai" },
];

export function ComplaintStatusForm({
  complaintId,
  currentStatus,
  currentResponse,
}: {
  complaintId: string;
  currentStatus: ComplaintStatus;
  currentResponse: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ComplaintStatus>(currentStatus);
  const [response, setResponse] = useState(currentResponse ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const res = await fetch(`/api/complaints/${complaintId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, response }),
    });
    setSubmitting(false);

    if (!res.ok) {
      toast.error("Gagal memperbarui pengaduan.");
      return;
    }

    toast.success("Pengaduan diperbarui.");
    router.push("/complaints");
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <p className="text-sm font-medium">Kelola Pengaduan</p>
      <div className="flex flex-col gap-2">
        <Label>Status</Label>
        <Select
          items={Object.fromEntries(statusOptions.map((o) => [o.value, o.label]))}
          value={status}
          onValueChange={(v) => setStatus(v as ComplaintStatus)}
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
        <Label>Tanggapan</Label>
        <Textarea rows={4} value={response} onChange={(e) => setResponse(e.target.value)} />
      </div>
      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Menyimpan..." : "Simpan"}
      </Button>
    </div>
  );
}
