import Link from "next/link";
import type { Metadata } from "next";
import { FileText, ExternalLink, ImageIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Surat Edaran" };

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

function isImage(path: string) {
  return /\.(jpe?g|png|webp)$/i.test(path);
}

export default async function LettersPage() {
  await requireUser();

  const letters = await prisma.suratEdaran.findMany({
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Surat Edaran</h1>
        <p className="text-sm text-muted-foreground">
          Arsip surat edaran & pengumuman resmi pengurus Barcelona Cove
        </p>
      </div>

      {letters.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum ada surat edaran"
          description="Surat edaran resmi akan diarsipkan di sini."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {letters.map((letter) => (
            <Card key={letter.id} className="transition-all duration-200 hover:border-primary/40 hover:shadow-md">
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/20">
                    {isImage(letter.filePath) ? (
                      <ImageIcon className="size-5 text-primary" />
                    ) : (
                      <FileText className="size-5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{letter.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(letter.publishedAt)}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  render={
                    <a href={letter.filePath} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" />
                      {isImage(letter.filePath) ? "Lihat" : "Buka PDF"}
                    </a>
                  }
                />
              </CardContent>
              {isImage(letter.filePath) && (
                <a href={letter.filePath} target="_blank" rel="noopener noreferrer">
                  <img
                    src={letter.filePath}
                    alt={letter.title}
                    className="max-h-56 w-full border-t object-contain bg-black/5"
                  />
                </a>
              )}
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Butuh surat lama? Hubungi pengurus melalui menu <Link href="/directory" className="text-primary hover:underline">Direktori</Link>.
      </p>
    </div>
  );
}
