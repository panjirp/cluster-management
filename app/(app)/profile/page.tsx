import type { Metadata } from "next";
import Link from "next/link";
import { QrCode } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UpdateProfileForm } from "@/components/shared/update-profile-form";
import { ChangePasswordForm } from "@/components/shared/change-password-form";
import { roleLabels } from "@/lib/validations/user";

export const metadata: Metadata = { title: "Profil Saya" };

export default async function ProfilePage() {
  const session = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { house: { select: { blockNumber: true } } },
  });

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Profil Saya</h1>
        <p className="text-sm text-muted-foreground">Kelola data akun kamu sendiri</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>{user.email}</span>
        <Badge variant="outline">{roleLabels[user.role]}</Badge>
        {user.house && <Badge variant="outline">{user.house.blockNumber}</Badge>}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Data Diri</h2>
        <UpdateProfileForm name={user.name} phone={user.phone} />
      </div>

      <div className="space-y-3 border-t pt-6">
        <h2 className="text-lg font-medium">Kartu Warga Digital</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button render={<Link href="/profile/qr">Lihat Kartu Warga (QR)</Link>}>
            <QrCode className="size-4" />
            Lihat Kartu Warga (QR)
          </Button>
          <p className="text-sm text-muted-foreground">
            Tunjukkan QR ke satpam / petugas saat diminta.
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t pt-6">
        <h2 className="text-lg font-medium">Ganti Password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
