"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/shared/currency-input";

export function DuesAmountSetting({ initialAmount }: { initialAmount: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(initialAmount);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    const res = await fetch("/api/cash/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duesAmount: amount }),
    });
    setSubmitting(false);

    if (!res.ok) {
      toast.error("Gagal menyimpan nominal iuran.");
      return;
    }

    toast.success("Nominal iuran diperbarui.");
    router.refresh();
  }

  return (
    <div className="flex items-end gap-2 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="duesAmount">Nominal Iuran Bulanan</Label>
        <CurrencyInput id="duesAmount" value={amount} onChange={setAmount} className="w-48" />
      </div>
      <Button onClick={handleSave} disabled={submitting}>
        {submitting ? "Menyimpan..." : "Simpan"}
      </Button>
    </div>
  );
}
