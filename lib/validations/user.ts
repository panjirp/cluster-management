import { z } from "zod";

export const roleValues = ["WARGA", "ADMIN", "BENDAHARA"] as const;

export const roleLabels: Record<(typeof roleValues)[number], string> = {
  WARGA: "Warga",
  ADMIN: "Admin/Pengurus",
  BENDAHARA: "Bendahara",
};

export const residencyStatusValues = ["PEMILIK", "KONTRAK"] as const;

export const residencyStatusLabels: Record<(typeof residencyStatusValues)[number], string> = {
  PEMILIK: "Pemilik",
  KONTRAK: "Kontrak",
};

export const createUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(roleValues),
  houseId: z.string().optional(),
  phone: z.string().max(20).optional(),
  residencyStatus: z.enum(residencyStatusValues).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100).optional(),
  role: z.enum(roleValues).optional(),
  houseId: z.string().nullable().optional(),
  phone: z.string().max(20).optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  residencyStatus: z.enum(residencyStatusValues).nullable().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
