import { z } from "zod";

export const permitTypeValues = ["RENOVASI", "ACARA", "TAMU_KENDARAAN", "SURAT_PENGANTAR", "LAINNYA"] as const;

export const permitTypeLabels: Record<(typeof permitTypeValues)[number], string> = {
  RENOVASI: "Izin Renovasi",
  ACARA: "Izin Kegiatan",
  TAMU_KENDARAAN: "Tamu/Kendaraan",
  SURAT_PENGANTAR: "Surat Pengantar RT/RW",
  LAINNYA: "Lainnya",
};

export const permitStatusValues = ["PENDING", "APPROVED", "REJECTED"] as const;

export const permitStatusLabels: Record<(typeof permitStatusValues)[number], string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export const createPermitSchema = z
  .object({
    type: z.enum(permitTypeValues),
    title: z.string().min(3, "Judul minimal 3 karakter").max(120),
    description: z.string().min(10, "Deskripsi minimal 10 karakter").max(2000),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    supportingDocUrl: z.string().optional(),
    neighborConsentUrl: z.string().optional(),
    assetIds: z.array(z.string()).optional(),
  })
  .refine((data) => data.type !== "RENOVASI" || !!data.neighborConsentUrl, {
    message: "Foto izin tetangga wajib diunggah untuk izin renovasi",
    path: ["neighborConsentUrl"],
  });

export type CreatePermitInput = z.infer<typeof createPermitSchema>;

export const updatePermitSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  adminNotes: z.string().max(2000).optional(),
});

export type UpdatePermitInput = z.infer<typeof updatePermitSchema>;
