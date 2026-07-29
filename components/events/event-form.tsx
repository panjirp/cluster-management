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
import { createEventSchema, type CreateEventInput } from "@/lib/validations/event";

export function EventForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { title: "", description: "", eventDate: "", location: "" },
  });

  async function onSubmit(data: CreateEventInput) {
    setSubmitting(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      toast.error("Gagal membuat acara.");
      return;
    }

    toast.success("Acara berhasil dibuat.");
    router.push("/events");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Judul Acara</Label>
        <Input id="title" {...register("title")} placeholder="Contoh: Kerja Bakti Bulanan" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventDate">Tanggal & Waktu</Label>
        <Input id="eventDate" type="datetime-local" {...register("eventDate")} />
        {errors.eventDate && <p className="text-sm text-destructive">{errors.eventDate.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lokasi (opsional)</Label>
        <Input id="location" {...register("location")} placeholder="Contoh: Lapangan Cluster" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea id="description" rows={5} {...register("description")} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Menyimpan..." : "Buat Acara"}
      </Button>
    </form>
  );
}
