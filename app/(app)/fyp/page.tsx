import type { Metadata } from "next";
import { Flame } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { FypFeed } from "@/components/fyp/fyp-feed";

export const metadata: Metadata = { title: "FYP Cluster" };

export default async function FypPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "BENDAHARA";

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

      <FypFeed currentUserId={session.user.id} isAdmin={isAdmin} />
    </div>
  );
}
