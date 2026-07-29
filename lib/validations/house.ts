import { z } from "zod";
import { optionalPhoneSchema } from "@/lib/validations/phone";

export const houseStatusValues = ["DITEMPATI", "KOSONG", "DIKONTRAKKAN"] as const;

export const houseStatusLabels: Record<(typeof houseStatusValues)[number], string> = {
  DITEMPATI: "Ditempati",
  KOSONG: "Kosong",
  DIKONTRAKKAN: "Dikontrakkan",
};

export const createHouseSchema = z.object({
  blockNumber: z.string().min(1, "Nomor blok wajib diisi").max(20),
  contactPhone: optionalPhoneSchema.optional(),
  statusHuni: z.enum(houseStatusValues).optional(),
});

export type CreateHouseInput = z.infer<typeof createHouseSchema>;

export const updateHouseSchema = z.object({
  contactPhone: optionalPhoneSchema.nullable().optional(),
  residentName: z.string().max(100).nullable().optional(),
  statusHuni: z.enum(houseStatusValues).optional(),
  mapX: z.number().min(0).max(100).nullable().optional(),
  mapY: z.number().min(0).max(100).nullable().optional(),
});
