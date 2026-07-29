import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { DirectoryList } from "@/components/directory/directory-list";
import type { DirectoryMemberRow } from "@/components/directory/directory-member-card";

export const metadata: Metadata = { title: "Direktori" };

export default async function DirectoryPage() {
  const session = await requireUser();
  const members = await prisma.directoryMember.findMany({
    orderBy: [{ roleType: "asc" }, { position: "asc" }],
  });

  const rows: DirectoryMemberRow[] = members.map((m) => ({
    id: m.id,
    roleType: m.roleType,
    position: m.position,
    fullName: m.fullName,
    phone: m.phone,
    photoUrl: m.photoUrl,
    scheduleShift: m.scheduleShift,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Direktori Pengurus & Satpam</h1>
        <p className="text-sm text-muted-foreground">Kontak cepat pengurus dan petugas keamanan cluster</p>
      </div>

      <DirectoryList members={rows} canManage={session.user.role === "ADMIN"} />
    </div>
  );
}
