"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createHouseSchema, type CreateHouseInput, houseStatusValues, houseStatusLabels } from "@/lib/validations/house";

export function AddHouseForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateHouseInput>({
    resolver: zodResolver(createHouseSchema),
    defaultValues: { blockNumber: "", contactPhone: "", statusHuni: "DITEMPATI" },
  });

  async function onSubmit(data: CreateHouseInput) {
    setSubmitting(true);
    const res = await fetch("/api/houses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal menambah rumah.");
      return;
    }

    toast.success("Rumah berhasil ditambahkan.");
    reset();
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="blockNumber">Nomor Blok</Label>
        <Input id="blockNumber" {...register("blockNumber")} placeholder="Contoh: A1-06" />
        {errors.blockNumber && <p className="text-sm text-destructive">{errors.blockNumber.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contactPhone">No. WA (opsional)</Label>
        <Input id="contactPhone" {...register("contactPhone")} placeholder="0812xxxxxxx" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="statusHuni">Status Hunian</Label>
        <Select
          items={houseStatusLabels}
          value={watch("statusHuni")}
          onValueChange={(v) => setValue("statusHuni", v as CreateHouseInput["statusHuni"])}
        >
          <SelectTrigger id="statusHuni" className="w-full">
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
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Menambah..." : "Tambah Rumah"}
      </Button>
    </form>
  );
}
