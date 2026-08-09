import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { DuesReminderError, sendHouseDueReminder } from "@/lib/dues-reminder";
import { WhatsAppNotConfiguredError } from "@/lib/whatsapp";

const reminderSchema = z.object({
  houseId: z.string().min(1),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

// POST /api/whatsapp/dues-reminder
//
// Mengirim pengingat iuran (kas) bulanan ke WhatsApp rumah via gateway Fonnte.
// Hanya bendahara/admin. Body: { houseId, year, month }
export async function POST(req: NextRequest) {
  try {
    await requireBendahara();

    const body = await req.json().catch(() => ({}));
    const parsed = reminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "houseId, year, dan month wajib diisi." }, { status: 400 });
    }

    const { houseId, year, month } = parsed.data;
    await sendHouseDueReminder(houseId, year, month);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error instanceof DuesReminderError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof WhatsAppNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Dues WhatsApp reminder failed:", error);
    return NextResponse.json({ error: "Gagal mengirim pengingat WhatsApp. Coba lagi." }, { status: 502 });
  }
}
