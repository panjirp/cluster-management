import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { sendHouseDueReminder } from "@/lib/dues-reminder";
import { WhatsAppNotConfiguredError } from "@/lib/whatsapp";

const bulkSchema = z.object({
  houseIds: z.array(z.string().min(1)).min(1).max(200),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// POST /api/whatsapp/dues-reminders/bulk
//
// Kirim pengingat iuran (kas) via WhatsApp ke banyak rumah sekaligus.
// Body: { houseIds: string[], year, month }
// Pesan dikirim berurutan dengan jeda 1 detik (rekomendasi Fonnte untuk bulk).
export async function POST(req: NextRequest) {
  try {
    await requireBendahara();

    if (!process.env.FONNTE_TOKEN) {
      return NextResponse.json(
        { error: "Gateway Fonnte belum dikonfigurasi. Set FONNTE_TOKEN di .env (token dari https://fonnte.com)." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }

    const { houseIds, year, month } = parsed.data;

    const results: { houseId: string; ok: boolean; error?: string }[] = [];
    for (let i = 0; i < houseIds.length; i++) {
      const houseId = houseIds[i];
      try {
        await sendHouseDueReminder(houseId, year, month);
        results.push({ houseId, ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal mengirim pengingat.";
        results.push({ houseId, ok: false, error: message });
      }
      // Jeda antar pesan (kecuali pesan terakhir).
      if (i < houseIds.length - 1) await sleep(1000);
    }

    const sent = results.filter((r) => r.ok).length;
    const failed = results.length - sent;
    return NextResponse.json({ ok: true, sent, failed, results });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error instanceof WhatsAppNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Bulk dues WhatsApp reminder failed:", error);
    return NextResponse.json({ error: "Gagal mengirim pengingat massal." }, { status: 500 });
  }
}
