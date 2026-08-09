import { prisma } from "@/lib/prisma";
import {
  buildDuesReminderText,
  indonesianMonthName,
  sendWhatsAppMessage,
} from "@/lib/whatsapp";

// Errors thrown by sendHouseDueReminder that should map to HTTP 400.
export class DuesReminderError extends Error {}
export class HouseNoPhoneError extends DuesReminderError {}
export class DueAlreadyPaidError extends DuesReminderError {}

/**
 * Build the reminder text and send it via the Fonnte gateway for one house and
 * month. Uses the recorded MonthlyDue amount when present, otherwise the
 * current dues amount setting.
 */
export async function sendHouseDueReminder(
  houseId: string,
  year: number,
  month: number
): Promise<void> {
  const house = await prisma.house.findUnique({
    where: { id: houseId },
    select: {
      id: true,
      blockNumber: true,
      residentName: true,
      contactPhone: true,
      residents: { select: { name: true } },
    },
  });
  if (!house) throw new Error("Rumah tidak ditemukan.");
  if (!house.contactPhone) {
    throw new HouseNoPhoneError(`Nomor WhatsApp rumah Blok ${house.blockNumber} belum diisi.`);
  }
  // Data WA bisa berisi beberapa nomor dipisah " / " (kebijakan gabung WA).
  // Pecah dulu, lalu kirim ke setiap nomor — jangan dikirim sebagai satu nomor
  // raksasa (bug lama: "0821... / 0857..." jadi 27 digit yang ditolak Fonnte).
  const phones = house.contactPhone
    .split("/")
    .map((p) => p.trim())
    .filter((p) => /^\+?\d{9,15}$/.test(p.replace(/[\s.-]/g, "")));
  if (phones.length === 0) {
    throw new HouseNoPhoneError(`Nomor WhatsApp rumah Blok ${house.blockNumber} tidak valid.`);
  }

  const due = await prisma.monthlyDue.findUnique({
    where: { houseId_year_month: { houseId, year, month } },
    select: { amount: true, isPaid: true },
  });
  if (due?.isPaid) throw new DueAlreadyPaidError("Iuran ini sudah lunas.");

  let amount = due?.amount;
  if (!amount) {
    const setting = await prisma.setting.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    amount = setting.duesAmount;
  }

  const ownerName = house.residents.map((r) => r.name).join(", ") || house.residentName || null;
  const text = buildDuesReminderText(
    house.blockNumber,
    indonesianMonthName(month),
    year,
    amount,
    ownerName
  );

  // Kirim ke setiap nomor (semua kontak). Berhenti jika ada yang gagal.
  for (const phone of phones) {
    await sendWhatsAppMessage(phone, text);
  }
}
