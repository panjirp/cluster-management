import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { ChangePasswordForm } from "@/components/shared/change-password-form";

export const metadata: Metadata = { title: "Ganti Password" };

export default async function ChangePasswordPage() {
  const session = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ganti Password</h1>
        <p className="text-sm text-muted-foreground">Perbarui password akun kamu</p>
      </div>

      <ChangePasswordForm forced={session.user.mustChangePassword} />
    </div>
  );
}
