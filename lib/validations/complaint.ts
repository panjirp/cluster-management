import { z } from "zod";

export const complaintCategoryValues = [
  "FASILITAS",
  "KEAMANAN",
  "KEBISINGAN",
  "KEBERSIHAN",
  "LAINNYA",
] as const;

export const complaintCategoryLabels: Record<(typeof complaintCategoryValues)[number], string> = {
  FASILITAS: "Fasilitas Rusak",
  KEAMANAN: "Keamanan",
  KEBISINGAN: "Kebisingan",
  KEBERSIHAN: "Kebersihan",
  LAINNYA: "Lainnya",
};

export const complaintStatusValues = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

export const complaintStatusLabels: Record<(typeof complaintStatusValues)[number], string> = {
  OPEN: "Pending",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
};

export const createComplaintSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(120),
  description: z.string().min(10, "Deskripsi minimal 10 karakter").max(2000),
  category: z.enum(complaintCategoryValues),
  photoUrl: z.string().optional(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

export const updateComplaintSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
  response: z.string().max(2000).optional(),
});

export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>;
