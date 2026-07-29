import { z } from "zod";

export const houseStatusValues = ["DITEMPATI", "KOSONG", "DIKONTRAKKAN"] as const;

export const houseStatusLabels: Record<(typeof houseStatusValues)[number], string> = {
  DITEMPATI: "Ditempati",
  KOSONG: "Kosong",
  DIKONTRAKKAN: "Dikontrakkan",
};

export const createHouseSchema = z.object({
  blockNumber: z.string().min(1, "Nomor blok wajib diisi").max(20),
  contactPhone: z.string().max(20).optional(),
  statusHuni: z.enum(houseStatusValues).optional(),
});

export type CreateHouseInput = z.infer<typeof createHouseSchema>;

export const updateHouseSchema = z.object({
  contactPhone: z.string().max(20).optional(),
  statusHuni: z.enum(houseStatusValues).optional(),
  mapX: z.number().min(0).max(100).nullable().optional(),
  mapY: z.number().min(0).max(100).nullable().optional(),
});
