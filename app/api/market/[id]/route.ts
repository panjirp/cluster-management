import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  throw error;
}

async function getOwnListing(id: string, userId: string) {
  const listing = await prisma.marketListing.findUnique({ where: { id } });
  if (!listing) return null;
  const isOwner = listing.sellerId === userId;
  const isAdmin = false;
  return { listing, isOwner, isAdmin };
}

// PATCH /api/market/[id] — toggle status (AKTIF <-> TERJUAL), hanya pemilik
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const r = await getOwnListing(id, session.user.id);
    if (!r) return NextResponse.json({ error: "Listing tidak ditemukan." }, { status: 404 });
    if (!r.isOwner) return NextResponse.json({ error: "Hanya pemilik yang bisa mengubah." }, { status: 403 });

    const next = r.listing.status === "TERJUAL" ? "AKTIF" : "TERJUAL";
    const updated = await prisma.marketListing.update({ where: { id }, data: { status: next } });
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/market/[id] — hapus listing, hanya pemilik
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const r = await getOwnListing(id, session.user.id);
    if (!r) return NextResponse.json({ error: "Listing tidak ditemukan." }, { status: 404 });
    if (!r.isOwner) return NextResponse.json({ error: "Hanya pemilik yang bisa menghapus." }, { status: 403 });

    await prisma.marketListing.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
