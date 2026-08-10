import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const checkInSchema = z.object({
  pin: z.string().min(4).max(6),
});

/**
 * PATCH /api/guest-passes/[code]/check-in — satpam menandai tamu sudah masuk
 * (status USED). Butuh PIN gate, sama seperti verifikasi.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = checkInSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const setting = await prisma.setting.upsert({ where: { id: "singleton" }, update: {}, create: {} });
  if (body.data.pin !== (setting.gatePin ?? "0000")) {
    return NextResponse.json({ error: "PIN gerbang salah." }, { status: 403 });
  }

  const pass = await prisma.guestPass.findUnique({ where: { code: code.toUpperCase() } });
  if (!pass) return NextResponse.json({ error: "Pass tidak ditemukan." }, { status: 404 });
  if (pass.status !== "ACTIVE") {
    return NextResponse.json({ error: "Pass ini sudah tidak aktif." }, { status: 409 });
  }
  if (pass.validUntil < new Date()) {
    return NextResponse.json({ error: "Pass sudah kedaluwarsa." }, { status: 409 });
  }

  const updated = await prisma.guestPass.update({
    where: { id: pass.id },
    data: { status: "USED", scannedAt: new Date(), scannedBy: "Pos Satpam" },
  });
  return NextResponse.json(updated);
}
