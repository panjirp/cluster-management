import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { TransactionForm } from "@/components/cash/transaction-form";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Tambah Transaksi" };

export default async function NewTransactionPage() {
  const session = await requireUser();
  if (session.user.role !== "BENDAHARA") redirect("/cash");

  return (
    <div className="space-y-6">
      <BackLink href="/cash" label="Kembali ke Uang Kas" />
      <div>
        <h1 className="text-2xl font-semibold">Tambah Transaksi</h1>
        <p className="text-sm text-muted-foreground">Catat pemasukan atau pengeluaran kas cluster</p>
      </div>
      <TransactionForm />
    </div>
  );
}
