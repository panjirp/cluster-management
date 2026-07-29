import { z } from "zod";

// Accepts 08xxxxxxxxx, 628xxxxxxxxx, or +628xxxxxxxxx — the common Indonesian
// mobile number formats, tolerant of spaces/dashes the user might type.
const PHONE_REGEX = /^(\+62|62|0)8\d{7,12}$/;

function clean(value: string) {
  return value.replace(/[\s-]/g, "");
}

const PHONE_ERROR = "Nomor WhatsApp tidak valid (contoh: 081234567890)";

export const optionalPhoneSchema = z
  .string()
  .transform(clean)
  .refine((v) => v === "" || PHONE_REGEX.test(v), { message: PHONE_ERROR });

export const requiredPhoneSchema = z
  .string()
  .transform(clean)
  .refine((v) => PHONE_REGEX.test(v), { message: PHONE_ERROR });
