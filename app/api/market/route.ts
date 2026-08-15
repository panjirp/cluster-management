import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  throw error;
}

// GET /api/market — daftar listing jual beli
export async function GET() {
  try {
    await requireUser();
    const listings = await prisma.marketListing.findMany({
      orderBy: { createdAt: "desc" },
      include: { seller: { select: { id: true, name: true, house: { select: { blockNumber: true } } } } },
    });
    return NextResponse.json(
      listings.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        price: l.price,
        category: l.category,
        imagePath: l.imagePath,
        status: l.status,
        createdAt: l.createdAt,
        sellerId: l.sellerId,
        sellerName: l.seller.name,
        sellerHouse: l.seller.house?.blockNumber ?? null,
      }))
    );
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  price: z.coerce.number().int().nonnegative().optional(),
  category: z.string().optional(),
  imagePath: z.string().optional(),
});

// POST /api/market — warga buat listing
export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    const body = createSchema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

    const listing = await prisma.marketListing.create({
      data: {
        title: body.data.title.trim(),
        description: body.data.description?.trim() || null,
        price: body.data.price,
        category: body.data.category || "LAINNYA",
        imagePath: body.data.imagePath || null,
        sellerId: session.user.id,
      },
    });
    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
