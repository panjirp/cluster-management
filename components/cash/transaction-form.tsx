"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import {
  createTransactionSchema,
  type CreateTransactionInput,
  transactionCategoryValues,
  transactionCategoryLabels,
} from "@/lib/validations/cash";

const typeOptions: { value: "INCOME" | "EXPENSE"; label: string }[] = [
  { value: "INCOME", label: "Pemasukan" },
  { value: "EXPENSE", label: "Pengeluaran" },
];

export type TransactionFormInitial = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: CreateTransactionInput["category"];
  amount: number;
  description: string;
  date: string;
};

export function TransactionForm({ transaction }: { transaction?: TransactionFormInitial }) {
  const router = useRouter();
  const isEdit = Boolean(transaction);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof createTransactionSchema>, unknown, CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: transaction
      ? {
          type: transaction.type,
          category: transaction.category,
          description: transaction.description,
          amount: transaction.amount,
          date: transaction.date.slice(0, 10),
        }
      : { type: "INCOME", category: "IURAN_BULANAN", description: "", amount: 0 },
  });

  async function onSubmit(data: CreateTransactionInput) {
    setSubmitting(true);
    const res = await fetch(isEdit ? `/api/cash/transactions/${transaction!.id}` : "/api/cash/transactions", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);

    if (!res.ok) {
      toast.error("Gagal menyimpan transaksi.");
      return;
    }

    toast.success("Transaksi berhasil disimpan.");
    router.push("/cash");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Tipe</Label>
        <Select
          items={{ INCOME: "Pemasukan", EXPENSE: "Pengeluaran" }}
          value={watch("type")}
          onValueChange={(v) => setValue("type", v as CreateTransactionInput["type"])}
        >
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Kategori</Label>
        <Select
          items={transactionCategoryLabels}
          value={watch("category")}
          onValueChange={(v) => setValue("category", v as CreateTransactionInput["category"])}
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {transactionCategoryValues.map((value) => (
              <SelectItem key={value} value={value}>
                {transactionCategoryLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Nominal</Label>
        <CurrencyInput
          id="amount"
          value={Number(watch("amount")) || 0}
          onChange={(v) => setValue("amount", v)}
        />
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="date">Tanggal</Label>
        <Input id="date" type="date" {...register("date")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Keterangan</Label>
        <Input id="description" {...register("description")} placeholder="Contoh: Iuran bulan Juli - Blok A1-01" />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Transaksi"}
      </Button>
    </form>
  );
}
