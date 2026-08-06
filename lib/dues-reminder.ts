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

  await sendWhatsAppMessage(house.contactPhone, text);
}
