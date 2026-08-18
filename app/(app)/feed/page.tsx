import type { Metadata } from "next";
import { Rss } from "lucide-react";
import { requireUser } from "@/lib/session";
import { FeedClient } from "@/components/feed/feed-client";

export const metadata: Metadata = { title: "Aktivitas Cluster" };

export default async function FeedPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Rss className="size-6 text-primary" /> Aktivitas Cluster
        </h1>
        <p className="text-sm text-muted-foreground">
          Momen, acara, pengumuman & jual beli terbaru dari warga.
        </p>
      </div>
      <FeedClient />
    </div>
  );
}
