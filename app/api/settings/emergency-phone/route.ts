import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";

const phoneSchema = z.object({
  phone: z
    .string()
    .max(20)
    .nullable()
    .refine((v) => !v || /^[0-9+\-\s]{9,16}$/.test(v), "Format nomor tidak valid."),
});

// PATCH /api/settings/emergency-phone — pengurus mengatur nomor WA penerima darurat.
export async function PATCH(req: NextRequest) {
  try {
    await requireBendahara();
    const body = phoneSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.issues[0]?.message ?? "Nomor tidak valid." }, { status: 400 });
    }
    await prisma.setting.upsert({
      where: { id: "singleton" },
      update: { emergencyNotifyPhone: body.data.phone },
      create: { id: "singleton", emergencyNotifyPhone: body.data.phone },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
