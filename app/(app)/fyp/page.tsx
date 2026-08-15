import type { Metadata } from "next";
import { Flame } from "lucide-react";
import { requireUser } from "@/lib/session";
import { FypFeed } from "@/components/fyp/fyp-feed";

export const metadata: Metadata = { title: "FYP Cluster" };

export default async function FypPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Flame className="size-6 text-primary" /> FYP Cluster
        </h1>
        <p className="text-sm text-muted-foreground">
          Unggah momen, like & komentar — feed konten warga Barcelona Cove.
        </p>
      </div>

      <FypFeed />
    </div>
  );
}
