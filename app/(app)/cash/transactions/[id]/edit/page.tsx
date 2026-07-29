import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { TransactionForm } from "@/components/cash/transaction-form";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Edit Transaksi" };

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  if (session.user.role !== "BENDAHARA") redirect("/cash");

  const { id } = await params;
  const transaction = await prisma.cashTransaction.findUnique({ where: { id } });
  if (!transaction) notFound();

  return (
    <div className="space-y-6">
      <BackLink href="/cash" label="Kembali ke Uang Kas" />
      <div>
        <h1 className="text-2xl font-semibold">Edit Transaksi</h1>
        <p className="text-sm text-muted-foreground">Perbarui detail pemasukan atau pengeluaran kas</p>
      </div>
      <TransactionForm
        transaction={{
          id: transaction.id,
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date.toISOString(),
        }}
      />
    </div>
  );
}
