import { z } from "zod";

export const vehicleTypeValues = ["MOBIL", "MOTOR", "LAINNYA"] as const;

export const vehicleTypeLabels: Record<(typeof vehicleTypeValues)[number], string> = {
  MOBIL: "Mobil",
  MOTOR: "Motor",
  LAINNYA: "Lainnya",
};

export const guestPassStatusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  USED: "Sudah Masuk",
  REVOKED: "Dibatalkan",
};

export const createGuestPassSchema = z.object({
  guestName: z.string().min(2, "Nama tamu minimal 2 karakter").max(80),
  guestPhone: z.string().max(20).optional().or(z.literal("")),
  vehicleType: z.enum(vehicleTypeValues),
  plateNumber: z.string().max(12).optional().or(z.literal("")),
  purpose: z.string().min(3, "Keperluan minimal 3 karakter").max(200),
  durationHours: z.number().int().min(1, "Minimal 1 jam").max(72, "Maksimal 72 jam"),
});

export type CreateGuestPassInput = z.infer<typeof createGuestPassSchema>;

/** Buat kode pass unik, mis. BC-4F7A. Dipanggil ulang kalau bentrok. */
export function generatePassCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa 0/O/1/I yang membingungkan
  let code = "BC-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
