import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { sendPushToUser } from "@/lib/web-push";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  throw error;
}

// GET /api/parcels — daftar paket (admin lihat semua, warga lihat miliknya)
export async function GET(req: NextRequest) {
  try {
    const session = await requireUser();
    const status = req.nextUrl.searchParams.get("status");
    const where =
      session.user.role === "ADMIN"
        ? status
          ? { status: status as "WAITING" | "PICKED_UP" }
          : {}
        : {
            OR: [{ residentId: session.user.id }, ...(session.user.houseId ? [{ houseId: session.user.houseId }] : [])],
          };

    const parcels = await prisma.parcel.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { house: { select: { blockNumber: true } } },
    });
    return NextResponse.json(parcels);
  } catch (error) {
    return errorResponse(error);
  }
}

const createParcelSchema = z.object({
  houseId: z.string().min(1, "Pilih rumah tujuan"),
  courierName: z.string().min(2, "Nama kurir wajib diisi").max(80),
  senderName: z.string().max(80).optional().or(z.literal("")),
  description: z.string().max(300).optional().or(z.literal("")),
  photoUrl: z.string().optional().or(z.literal("")),
});

// POST /api/parcels — admin/pengurus mencatat paket yang tiba di pos satpam
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = createParcelSchema.safeParse(await req.json());
    if (!body.success) {
      const message = body.error.issues[0]?.message ?? "Data tidak valid.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { houseId, courierName, senderName, description, photoUrl } = body.data;

    const house = await prisma.house.findUnique({
      where: { id: houseId },
      include: { residents: { where: { role: "WARGA" }, select: { id: true, name: true } } },
    });
    if (!house) return NextResponse.json({ error: "Rumah tidak ditemukan." }, { status: 404 });

    const resident = house.residents[0] ?? null;

    const parcel = await prisma.parcel.create({
      data: {
        houseId,
        residentId: resident?.id ?? null,
        courierName: courierName.trim(),
        senderName: senderName?.trim() || null,
        description: description?.trim() || null,
        photoUrl: photoUrl?.trim() || null,
        loggedByAdminId: session.user.id,
      },
      include: { house: { select: { blockNumber: true } } },
    });

    // Notifikasi + push ke semua warga di rumah tersebut.
    const targets = house.residents;
    if (targets.length > 0) {
      const title = "📦 Paket Anda Tiba";
      const bodyText = `${courierName.trim()} menaruh paket untuk ${house.blockNumber} di pos satpam.`;
      await prisma.notification.createMany({
        data: targets.map((t) => ({ userId: t.id, title, body: bodyText, url: "/parcels" })),
      });
      await sendPushToUser(targets[0].id, { title, body: bodyText, url: "/parcels" }).catch(() => {});
    }

    return NextResponse.json(parcel, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
