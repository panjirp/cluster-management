import { z } from "zod";

export const transactionCategoryValues = [
  "IURAN_BULANAN",
  "DONASI",
  "KEAMANAN",
  "KEBERSIHAN",
  "PERBAIKAN",
  "ACARA",
  "LAINNYA",
] as const;

export const transactionCategoryLabels: Record<(typeof transactionCategoryValues)[number], string> = {
  IURAN_BULANAN: "Iuran Bulanan",
  DONASI: "Donasi",
  KEAMANAN: "Keamanan",
  KEBERSIHAN: "Kebersihan",
  PERBAIKAN: "Perbaikan",
  ACARA: "Acara",
  LAINNYA: "Lainnya",
};

export const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.enum(transactionCategoryValues),
  amount: z.coerce.number().int().positive("Nominal harus lebih dari 0"),
  description: z.string().min(3, "Keterangan minimal 3 karakter").max(500),
  date: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const markDuePaidSchema = z.object({
  isPaid: z.boolean(),
});

export const updateSettingSchema = z.object({
  duesAmount: z.coerce.number().int().positive("Nominal harus lebih dari 0"),
});

export const importPreviewSchema = z.object({
  sheetUrl: z.string().url("URL tidak valid"),
});

export const importCommitSchema = z.object({
  rows: z
    .array(
      z.object({
        importKey: z.string().min(1),
        type: z.enum(["INCOME", "EXPENSE"]),
        category: z.enum(transactionCategoryValues),
        amount: z.coerce.number().int().positive("Nominal harus lebih dari 0"),
        description: z.string().min(1).max(500),
        date: z.string(),
      })
    )
    .min(1, "Pilih minimal satu baris untuk diimpor"),
});

export type ImportCommitInput = z.infer<typeof importCommitSchema>;

export const importDuesCommitSchema = z.object({
  houses: z
    .array(
      z.object({
        blockNumber: z.string().min(1),
        months: z
          .array(
            z.object({
              year: z.coerce.number().int().min(2000).max(2100),
              month: z.coerce.number().int().min(1).max(12),
              amount: z.coerce.number().int().positive("Nominal harus lebih dari 0"),
            })
          )
          .min(1),
      })
    )
    .min(1, "Pilih minimal satu rumah untuk diimpor"),
});

export type ImportDuesCommitInput = z.infer<typeof importDuesCommitSchema>;
