import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { LetterForm } from "@/components/admin/letter-form";
import { LettersAdminList } from "@/components/admin/letters-admin-list";

export const metadata: Metadata = { title: "Surat Edaran" };

export default async function AdminLettersPage() {
  await requireAdmin();

  const letters = await prisma.suratEdaran.findMany({
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Surat Edaran</h1>
        <p className="text-sm text-muted-foreground">
          Kelola arsip surat edaran / pengumuman resmi yang bisa diunduh warga
        </p>
      </div>

      <LetterForm />

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Arsip ({letters.length})</h2>
        <LettersAdminList
          initialLetters={letters.map((l) => ({
            id: l.id,
            title: l.title,
            filePath: l.filePath,
            publishedAt: l.publishedAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
