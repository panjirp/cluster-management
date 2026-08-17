import type { Metadata } from "next";
import { requireBendahara } from "@/lib/session";
import { CoveCoinAdmin } from "@/components/admin/covecoin-admin";

export const metadata: Metadata = { title: "Kelola CoveCoin" };

export default async function CoveCoinAdminPage() {
  await requireBendahara();
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kelola CoveCoin 🪙</h1>
        <p className="text-sm text-muted-foreground">
          Beri/potong CoveCoin warga secara manual (1 CoveCoin = Rp 1).
        </p>
      </div>
      <CoveCoinAdmin />
    </div>
  );
}
