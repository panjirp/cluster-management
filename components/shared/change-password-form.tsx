"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/shared/password-input";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/user";

export function ChangePasswordForm({
  forced,
  onSuccess,
}: {
  forced?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(data: ChangePasswordInput) {
    setSubmitting(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal mengubah password.");
      return;
    }

    toast.success("Password berhasil diubah.");
    reset();
    await update({ mustChangePassword: false });

    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4">
      {forced && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          Demi keamanan, silakan ganti password default kamu sebelum melanjutkan.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">Password Saat Ini</Label>
        <PasswordInput id="currentPassword" {...register("currentPassword")} />
        {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">Password Baru</Label>
        <PasswordInput id="newPassword" {...register("newPassword")} />
        {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
        <PasswordInput id="confirmPassword" {...register("confirmPassword")} />
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Menyimpan..." : "Ganti Password"}
      </Button>
    </form>
  );
}
