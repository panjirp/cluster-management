"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GenerateDuesButton({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleGenerate() {
    setSubmitting(true);
    const res = await fetch("/api/cash/dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month }),
    });
    setSubmitting(false);

    if (!res.ok) {
      toast.error("Gagal membuat data kas.");
      return;
    }

    toast.success("Data kas bulan ini berhasil dibuat.");
    router.refresh();
  }

  return (
    <Button onClick={handleGenerate} disabled={submitting}>
      {submitting ? "Memproses..." : "Buat Iuran Bulan Ini"}
    </Button>
  );
}
