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
import {
  createCameraSchema,
  type CreateCameraInput,
  cameraStreamTypeValues,
  cameraStreamTypeLabels,
} from "@/lib/validations/camera";

export function AddCameraForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCameraInput>({
    resolver: zodResolver(createCameraSchema),
    defaultValues: { name: "", location: "", streamUrl: "", streamType: "IFRAME" },
  });

  async function onSubmit(data: CreateCameraInput) {
    setSubmitting(true);
    const res = await fetch("/api/cameras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal menambah kamera.");
      return;
    }

    toast.success("Kamera berhasil ditambahkan.");
    reset();
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nama Kamera</Label>
        <Input id="name" placeholder="Gerbang Utama" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="location">Lokasi</Label>
        <Input id="location" placeholder="Pos Satpam BC1" {...register("location")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="streamType">Tipe Sumber</Label>
        <Select
          items={cameraStreamTypeLabels}
          value={watch("streamType")}
          onValueChange={(v) => v && setValue("streamType", v as CreateCameraInput["streamType"])}
        >
          <SelectTrigger id="streamType" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cameraStreamTypeValues.map((value) => (
              <SelectItem key={value} value={value}>
                {cameraStreamTypeLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="streamUrl">URL Stream</Label>
        <Input id="streamUrl" placeholder="https://..." {...register("streamUrl")} />
        {errors.streamUrl && <p className="text-sm text-destructive">{errors.streamUrl.message}</p>}
        <p className="text-xs text-muted-foreground">
          Untuk kamera dengan aplikasi/cloud sendiri (Hik-Connect, EZVIZ, dll), pakai link embed dari akun tersebut. Untuk
          stream HLS langsung, pakai URL berakhiran .m3u8.
        </p>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Menambah..." : "Tambah Kamera"}
      </Button>
    </form>
  );
}
