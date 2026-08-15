import type { Metadata } from "next";
import { Store } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { MarketFeed } from "@/components/market/market-feed";

export const metadata: Metadata = { title: "Jual Beli Warga" };

export default async function MarketPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Store className="size-6 text-primary" /> Jual Beli Warga
        </h1>
        <p className="text-sm text-muted-foreground">
          Pasang jualan / jasa kamu, atau cari kebutuhan antar sesama warga.
        </p>
      </div>

      <MarketFeed currentUserId={session.user.id} />
    </div>
  );
}
