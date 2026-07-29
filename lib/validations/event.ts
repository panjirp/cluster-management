import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(120),
  description: z.string().min(10, "Deskripsi minimal 10 karakter").max(2000),
  eventDate: z.string().min(1, "Tanggal acara wajib diisi"),
  location: z.string().max(200).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const rsvpSchema = z.object({
  status: z.enum(["GOING", "NOT_GOING"]),
});
