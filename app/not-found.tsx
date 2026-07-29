import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary/15 via-background to-background p-4 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <MapPinOff className="size-7" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Halaman Tidak Ditemukan</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan. Coba kembali ke dashboard.
        </p>
      </div>
      <Button render={<Link href="/dashboard">Kembali ke Dashboard</Link>} />
    </div>
  );
}
