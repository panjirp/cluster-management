"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import {
  createComplaintSchema,
  type CreateComplaintInput,
  complaintCategoryValues,
  complaintCategoryLabels,
} from "@/lib/validations/complaint";

export function ComplaintForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateComplaintInput>({
    resolver: zodResolver(createComplaintSchema),
    defaultValues: { title: "", description: "", category: "LAINNYA" },
  });

  async function onSubmit(data: CreateComplaintInput) {
    setSubmitting(true);
    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      toast.error("Gagal mengirim pengaduan. Coba lagi.");
      return;
    }

    toast.success("Pengaduan berhasil dikirim.");
    router.back();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Judul</Label>
        <Input id="title" {...register("title")} placeholder="Contoh: Lampu jalan mati" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Kategori</Label>
        <Select
          items={complaintCategoryLabels}
          value={watch("category")}
          onValueChange={(v) => setValue("category", v as CreateComplaintInput["category"])}
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {complaintCategoryValues.map((value) => (
              <SelectItem key={value} value={value}>
                {complaintCategoryLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea id="description" rows={5} {...register("description")} placeholder="Jelaskan detail keluhan Anda" />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <FileUpload
        id="photoUrl"
        label="Foto Bukti (opsional)"
        value={watch("photoUrl")}
        onChange={(url) => setValue("photoUrl", url)}
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? "Mengirim..." : "Kirim Pengaduan"}
      </Button>
    </form>
  );
}
