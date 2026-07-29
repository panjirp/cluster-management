import { z } from "zod";
import { requiredPhoneSchema } from "@/lib/validations/phone";

export const directoryRoleValues = ["PENGURUS", "SATPAM"] as const;
export const shiftStatusValues = ["PAGI", "SIANG", "MALAM", "OFF"] as const;
export type ShiftStatusValue = (typeof shiftStatusValues)[number];

export const directoryRoleLabels: Record<(typeof directoryRoleValues)[number], string> = {
  PENGURUS: "Pengurus",
  SATPAM: "Satpam",
};

export const shiftStatusLabels: Record<(typeof shiftStatusValues)[number], string> = {
  PAGI: "Shift Pagi",
  SIANG: "Shift Siang",
  MALAM: "Shift Malam",
  OFF: "Libur",
};

export const createDirectoryMemberSchema = z.object({
  roleType: z.enum(directoryRoleValues),
  position: z.string().min(2, "Jabatan minimal 2 karakter").max(80),
  fullName: z.string().min(2, "Nama minimal 2 karakter").max(100),
  phone: requiredPhoneSchema,
  photoUrl: z.string().optional(),
  scheduleShift: z.enum(shiftStatusValues).optional(),
});

export type CreateDirectoryMemberInput = z.infer<typeof createDirectoryMemberSchema>;

export const updateDirectoryMemberSchema = z.object({
  roleType: z.enum(directoryRoleValues).optional(),
  position: z.string().min(2, "Jabatan minimal 2 karakter").max(80).optional(),
  fullName: z.string().min(2, "Nama minimal 2 karakter").max(100).optional(),
  phone: requiredPhoneSchema.optional(),
  photoUrl: z.string().optional(),
  scheduleShift: z.enum(shiftStatusValues).nullable().optional(),
});

export type UpdateDirectoryMemberInput = z.infer<typeof updateDirectoryMemberSchema>;
