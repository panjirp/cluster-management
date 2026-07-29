import { z } from "zod";

export const cameraStreamTypeValues = ["IFRAME", "HLS"] as const;

export const cameraStreamTypeLabels: Record<(typeof cameraStreamTypeValues)[number], string> = {
  IFRAME: "Embed (link dari aplikasi/cloud kamera)",
  HLS: "Stream HLS (.m3u8)",
};

export const createCameraSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  location: z.string().max(100).optional(),
  streamUrl: z.string().url("URL tidak valid"),
  streamType: z.enum(cameraStreamTypeValues),
});

export type CreateCameraInput = z.infer<typeof createCameraSchema>;

export const updateCameraSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100).optional(),
  location: z.string().max(100).nullable().optional(),
  streamUrl: z.string().url("URL tidak valid").optional(),
  streamType: z.enum(cameraStreamTypeValues).optional(),
});

export type UpdateCameraInput = z.infer<typeof updateCameraSchema>;
