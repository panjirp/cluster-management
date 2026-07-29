"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/user";

export function UpdateProfileForm({ name, phone }: { name: string; phone: string | null }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name, phone: phone ?? "" },
  });

  async function onSubmit(data: UpdateProfileInput) {
    setSubmitting(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, phone: data.phone || null }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal menyimpan perubahan.");
      return;
    }

    toast.success("Profil diperbarui.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nama</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">No. WhatsApp</Label>
        <Input id="phone" type="tel" {...register("phone")} placeholder="0812xxxxxxx" />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Menyimpan..." : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
