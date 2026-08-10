"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";

const parcelSchema = z.object({
  houseId: z.string().min(1, "Pilih rumah tujuan"),
  courierName: z.string().min(2, "Nama kurir wajib diisi").max(80),
  senderName: z.string().max(80).optional(),
  description: z.string().max(300).optional(),
  photoUrl: z.string().optional(),
});

type ParcelInput = z.infer<typeof parcelSchema>;

export function ParcelForm({ houses }: { houses: { id: string; blockNumber: string; residentName: string | null }[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ParcelInput>({
    resolver: zodResolver(parcelSchema),
    defaultValues: { houseId: "", courierName: "", senderName: "", description: "", photoUrl: "" },
  });

  async function onSubmit(data: ParcelInput) {
    setSubmitting(true);
    const res = await fetch("/api/parcels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(body.error ?? "Gagal mencatat paket.");
      return;
    }
    toast.success("Paket tercatat — warga sudah diberi notifikasi.");
    router.back();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="houseId">Rumah Tujuan</Label>
        <Select value={watch("houseId")} onValueChange={(v) => setValue("houseId", v ?? "")}>
          <SelectTrigger id="houseId">
            <SelectValue placeholder="Pilih blok rumah" />
          </SelectTrigger>
          <SelectContent>
            {houses.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                {h.blockNumber}
                {h.residentName ? ` — ${h.residentName}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.houseId && <p className="text-sm text-destructive">{errors.houseId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="courierName">Nama Kurir / Ekspedisi</Label>
          <Input id="courierName" {...register("courierName")} placeholder="JNE / SiCepat / Gojek" />
          {errors.courierName && <p className="text-sm text-destructive">{errors.courierName.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="senderName">Pengirim (opsional)</Label>
          <Input id="senderName" {...register("senderName")} placeholder="Nama pengirim / toko" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Keterangan (opsional)</Label>
        <Textarea id="description" rows={3} {...register("description")} placeholder="Contoh: 2 dus besar" />
      </div>

      <FileUpload
        id="photoUrl"
        label="Foto Paket (opsional)"
        value={watch("photoUrl")}
        onChange={(url) => setValue("photoUrl", url)}
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? "Mencatat..." : "Catat Paket & Notifikasi Warga"}
      </Button>
    </form>
  );
}
