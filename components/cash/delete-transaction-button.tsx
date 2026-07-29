"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";

export function DeleteTransactionButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    const res = await fetch(`/api/cash/transactions/${id}`, { method: "DELETE" });

    if (!res.ok) {
      toast.error("Gagal menghapus transaksi.");
      return;
    }

    toast.success("Transaksi dihapus.");
    router.refresh();
  }

  return (
    <ConfirmDeleteButton
      title="Hapus transaksi ini?"
      description="Transaksi yang dihapus tidak bisa dikembalikan."
      onConfirm={handleDelete}
    />
  );
}
