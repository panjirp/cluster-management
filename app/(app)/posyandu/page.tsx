import Link from "next/link";
import type { Metadata } from "next";
import { Baby, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RegisterChildDialog } from "@/components/posyandu/register-child-dialog";

export const metadata: Metadata = { title: "Posyandu Anak" };

function formatGender(gender: string): string {
  return gender === "LAKI_LAKI" ? "Laki-laki" : "Perempuan";
}

function calcAge(birthDate: Date): string {
  const now = new Date();
  const birth = new Date(birthDate);
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 1) {
    const days = Math.floor(
      (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${days} hari`;
  }
  if (months < 24) return `${months} bulan`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} tahun ${rem} bulan` : `${years} tahun`;
}

export default async function PosyanduPage() {
  const session = await requireUser();
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "BENDAHARA";

  const children = await prisma.child.findMany({
    where: isAdmin ? {} : { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      parent: { select: { id: true, name: true, house: { select: { blockNumber: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Posyandu Anak</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Data anak warga yang terdaftar di Posyandu"
              : "Data anak Anda yang terdaftar di Posyandu"}
          </p>
        </div>
        <RegisterChildDialog>
          <Badge variant="default" className="cursor-pointer">
            <Plus className="mr-1 size-3" /> Daftarkan Anak
          </Badge>
        </RegisterChildDialog>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/20">
              <Baby className="size-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Belum ada anak terdaftar."
                : "Belum ada anak terdaftar. Daftarkan anak Anda melalui tombol di atas."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Card key={child.id} className="overflow-hidden">
              <CardContent className="space-y-3 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{child.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatGender(child.gender)} · {calcAge(child.birthDate)}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-muted-foreground">
                        Wali: {child.parent.name}
                        {child.parent.house ? ` (${child.parent.house.blockNumber})` : ""}
                      </p>
                    )}
                  </div>
                  {child.isVerified ? (
                    <Badge variant="default">Terverifikasi</Badge>
                  ) : (
                    <Badge variant="secondary">Belum Verifikasi</Badge>
                  )}
                </div>

                <Link href={`/posyandu/${child.id}`}>
                  <Badge variant="outline" className="cursor-pointer">
                    Lihat Detail
                  </Badge>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
