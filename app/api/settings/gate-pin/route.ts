import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: (error as UnauthorizedError).message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: (error as ForbiddenError).message }, { status: 403 });
  throw error;
}

// GET /api/settings/gate-pin — admin melihat PIN gerbang
export async function GET() {
  try {
    await requireAdmin();
    const setting = await prisma.setting.upsert({ where: { id: "singleton" }, update: {}, create: {} });
    return NextResponse.json({ gatePin: setting.gatePin ?? "0000" });
  } catch (error) {
    return errorResponse(error);
  }
}

const pinSchema = z.object({
  gatePin: z.string().regex(/^\d{4,6}$/, "PIN harus 4-6 digit angka"),
});

// PATCH /api/settings/gate-pin — admin mengganti PIN gerbang
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = pinSchema.safeParse(await req.json());
    if (!body.success) {
      const message = body.error.issues[0]?.message ?? "Data tidak valid.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    await prisma.setting.upsert({
      where: { id: "singleton" },
      update: { gatePin: body.data.gatePin },
      create: { gatePin: body.data.gatePin },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
