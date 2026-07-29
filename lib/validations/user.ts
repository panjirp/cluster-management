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
  email: z.string().email("Email tidak valid").optional(),
  role: z.enum(roleValues).optional(),
  houseId: z.string().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  residencyStatus: z.enum(residencyStatusValues).nullable().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
