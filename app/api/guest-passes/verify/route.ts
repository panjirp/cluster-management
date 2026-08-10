import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const verifySchema = z.object({
  code: z.string().min(4).max(16),
  pin: z.string().min(4).max(6),
});

/**
 * POST /api/guest-passes/verify — verifikasi pass tamu oleh satpam di gerbang.
 * Endpoint ini sengaja TIDAK pakai session login: pos satpam memakai perangkat
 * bersama, otentikasi cukup PIN gate (Setting.gatePin) agar tetap praktis.
 */
export async function POST(req: NextRequest) {
  const body = verifySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const { code, pin } = body.data;

  const setting = await prisma.setting.upsert({
    where: { id: "singleton" },
    update: {},
    create: {},
  });
  const gatePin = setting.gatePin ?? "0000";
  if (pin !== gatePin) {
    return NextResponse.json({ error: "PIN gerbang salah." }, { status: 403 });
  }

  const pass = await prisma.guestPass.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: {
      host: { select: { name: true } },
      house: { select: { blockNumber: true } },
    },
  });

  if (!pass) {
    return NextResponse.json({ error: "Kode pass tidak ditemukan." }, { status: 404 });
  }

  const now = new Date();
  const expired = pass.validUntil < now;
  const usable = pass.status === "ACTIVE" && !expired;

  return NextResponse.json({
    found: true,
    usable,
    reason: !usable
      ? pass.status === "USED"
        ? "Pass sudah pernah dipakai."
        : pass.status === "REVOKED"
          ? "Pass dibatalkan oleh tuan rumah."
          : "Pass sudah kedaluwarsa."
      : null,
    pass: {
      code: pass.code,
      guestName: pass.guestName,
      vehicleType: pass.vehicleType,
      plateNumber: pass.plateNumber,
      purpose: pass.purpose,
      validUntil: pass.validUntil.toISOString(),
      hostName: pass.host.name,
      houseBlock: pass.house?.blockNumber ?? null,
      status: pass.status,
    },
  });
}
