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
import { PasswordInput } from "@/components/shared/password-input";
import { HouseCombobox } from "@/components/shared/house-combobox";
import {
  createUserSchema,
  type CreateUserInput,
  roleValues,
  roleLabels,
  residencyStatusValues,
  residencyStatusLabels,
} from "@/lib/validations/user";

export function AddResidentForm({
  houses,
  onSuccess,
}: {
  houses: { id: string; blockNumber: string }[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "WARGA", houseId: "" },
  });

  const role = watch("role");

  async function onSubmit(data: CreateUserInput) {
    setSubmitting(true);
    const res = await fetch("/api/residents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal menambah akun.");
      return;
    }

    toast.success("Akun berhasil ditambahkan.");
    reset();
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nama</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password Awal</Label>
        <PasswordInput id="password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="role">Role</Label>
        <Select items={roleLabels} value={role} onValueChange={(v) => setValue("role", v as CreateUserInput["role"])}>
          <SelectTrigger id="role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleValues.map((value) => (
              <SelectItem key={value} value={value}>
                {roleLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {role === "WARGA" && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="houseId">Rumah</Label>
            <HouseCombobox
              id="houseId"
              houses={houses}
              value={watch("houseId")}
              onValueChange={(v) => setValue("houseId", v ?? undefined)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="residencyStatus">Status Huni</Label>
            <Select
              items={residencyStatusLabels}
              value={watch("residencyStatus")}
              onValueChange={(v) => setValue("residencyStatus", v as CreateUserInput["residencyStatus"])}
            >
              <SelectTrigger id="residencyStatus">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                {residencyStatusValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {residencyStatusLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Menambah..." : "Tambah Akun"}
      </Button>
    </form>
  );
}
