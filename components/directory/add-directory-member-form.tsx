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
import { FileUpload } from "@/components/shared/file-upload";
import {
  createDirectoryMemberSchema,
  type CreateDirectoryMemberInput,
  directoryRoleValues,
  directoryRoleLabels,
  shiftStatusValues,
  shiftStatusLabels,
} from "@/lib/validations/directory";

export function AddDirectoryMemberForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateDirectoryMemberInput>({
    resolver: zodResolver(createDirectoryMemberSchema),
    defaultValues: { roleType: "PENGURUS", position: "", fullName: "", phone: "" },
  });

  const roleType = watch("roleType");

  async function onSubmit(data: CreateDirectoryMemberInput) {
    setSubmitting(true);
    const res = await fetch("/api/directory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      toast.error("Gagal menambah anggota direktori.");
      return;
    }

    toast.success("Anggota direktori ditambahkan.");
    reset();
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="roleType">Tipe</Label>
        <Select
          items={directoryRoleLabels}
          value={roleType}
          onValueChange={(v) => setValue("roleType", v as CreateDirectoryMemberInput["roleType"])}
        >
          <SelectTrigger id="roleType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {directoryRoleValues.map((value) => (
              <SelectItem key={value} value={value}>
                {directoryRoleLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="position">Jabatan</Label>
        <Input id="position" {...register("position")} placeholder="Contoh: Ketua RT / Danru Satpam" />
        {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Nama Lengkap</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">No. WhatsApp</Label>
        <Input id="phone" {...register("phone")} placeholder="0812xxxxxxx" />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      {roleType === "SATPAM" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="scheduleShift">Shift Saat Ini</Label>
          <Select
            items={shiftStatusLabels}
            value={watch("scheduleShift") ?? null}
            onValueChange={(v) => setValue("scheduleShift", v ?? undefined)}
          >
            <SelectTrigger id="scheduleShift">
              <SelectValue placeholder="Pilih shift" />
            </SelectTrigger>
            <SelectContent>
              {shiftStatusValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {shiftStatusLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <FileUpload id="photoUrl" label="Foto (opsional)" value={watch("photoUrl")} onChange={(url) => setValue("photoUrl", url)} />

      <Button type="submit" disabled={submitting}>
        {submitting ? "Menambah..." : "Tambah Anggota"}
      </Button>
    </form>
  );
}
