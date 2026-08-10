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
import { createGuestPassSchema, type CreateGuestPassInput, vehicleTypeLabels, vehicleTypeValues } from "@/lib/validations/guest-pass";

export function GuestPassForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateGuestPassInput>({
    resolver: zodResolver(createGuestPassSchema),
    defaultValues: { guestName: "", guestPhone: "", vehicleType: "MOTOR", plateNumber: "", purpose: "", durationHours: 6 },
  });

  async function onSubmit(data: CreateGuestPassInput) {
    setSubmitting(true);
    const res = await fetch("/api/guest-passes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(body.error ?? "Gagal membuat pass. Coba lagi.");
      return;
    }
    const pass = (await res.json()) as { id: string };
    toast.success("Pass tamu berhasil dibuat.");
    router.push(`/guest-passes/${pass.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="guestName">Nama Tamu</Label>
        <Input id="guestName" {...register("guestName")} placeholder="Contoh: Budi Santoso" />
        {errors.guestName && <p className="text-sm text-destructive">{errors.guestName.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="guestPhone">No. HP Tamu (opsional)</Label>
        <Input id="guestPhone" {...register("guestPhone")} placeholder="08xxxxxxxxxx" inputMode="tel" />
        {errors.guestPhone && <p className="text-sm text-destructive">{errors.guestPhone.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="vehicleType">Kendaraan</Label>
          <Select
            value={watch("vehicleType")}
            onValueChange={(v) => setValue("vehicleType", (v ?? "MOTOR") as CreateGuestPassInput["vehicleType"])}
          >
            <SelectTrigger id="vehicleType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypeValues.map((v) => (
                <SelectItem key={v} value={v}>
                  {vehicleTypeLabels[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.vehicleType && <p className="text-sm text-destructive">{errors.vehicleType.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="plateNumber">Plat Nomor (opsional)</Label>
          <Input id="plateNumber" {...register("plateNumber")} placeholder="B 1234 XYZ" />
          {errors.plateNumber && <p className="text-sm text-destructive">{errors.plateNumber.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="purpose">Keperluan</Label>
        <Input id="purpose" {...register("purpose")} placeholder="Contoh: Mengantar barang / bertamu" />
        {errors.purpose && <p className="text-sm text-destructive">{errors.purpose.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="durationHours">Masa Berlaku (jam)</Label>
        <Select
          value={String(watch("durationHours"))}
          onValueChange={(v) => setValue("durationHours", v ? Number(v) : 6)}
        >
          <SelectTrigger id="durationHours">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 3, 6, 12, 24, 48].map((h) => (
              <SelectItem key={h} value={String(h)}>
                {h} jam
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.durationHours && <p className="text-sm text-destructive">{errors.durationHours.message}</p>}
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Membuat..." : "Buat Pass Tamu"}
      </Button>
    </form>
  );
}
