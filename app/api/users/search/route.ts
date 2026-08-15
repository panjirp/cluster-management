import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";

// GET /api/users/search?q=... — cari warga (untuk mention & DM)
export async function GET(req: NextRequest) {
  try {
    const session = await requireUser();
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

    const users = await prisma.user.findMany({
      where: {
        role: "WARGA",
        id: { not: session.user.id },
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      take: 20,
      select: { id: true, name: true, house: { select: { blockNumber: true } } },
    });

    return NextResponse.json(users.map((u) => ({ id: u.id, name: u.name, house: u.house?.blockNumber ?? null })));
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
