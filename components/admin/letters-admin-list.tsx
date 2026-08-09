"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";

type LetterRow = {
  id: string;
  title: string;
  filePath: string;
  publishedAt: string;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(iso));
}

export function LettersAdminList({ initialLetters }: { initialLetters: LetterRow[] }) {
  const router = useRouter();
  const [letters, setLetters] = useState(initialLetters);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/letters/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Gagal menghapus surat.");
      return;
    }
    setLetters((prev) => prev.filter((l) => l.id !== id));
    toast.success("Surat dihapus.");
    router.refresh();
  }

  if (letters.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada surat edaran.</p>;
  }

  return (
    <div className="space-y-2">
      {letters.map((letter) => (
        <Card key={letter.id} className="transition-colors hover:border-primary/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{letter.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(letter.publishedAt)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" render={<a href={letter.filePath} target="_blank" rel="noopener noreferrer">Buka PDF</a>}>
                <ExternalLink className="size-4" />
                Buka PDF
              </Button>
              <ConfirmDeleteButton
                title="Hapus surat ini?"
                description={`"${letter.title}" akan dihapus permanen dari arsip.`}
                onConfirm={() => handleDelete(letter.id)}
                label="Hapus surat"
                triggerVariant="outline"
                triggerSize="sm"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
