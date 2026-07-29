import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { updateSettingSchema } from "@/lib/validations/cash";

export async function GET() {
  try {
    await requireUser();

    const setting = await prisma.setting.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });

    return NextResponse.json(setting);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireBendahara();
    const body = await req.json();
    const parsed = updateSettingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const setting = await prisma.setting.upsert({
      where: { id: "singleton" },
      update: { duesAmount: parsed.data.duesAmount },
      create: { id: "singleton", duesAmount: parsed.data.duesAmount },
    });

    return NextResponse.json(setting);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
