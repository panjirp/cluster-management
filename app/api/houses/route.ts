import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

// GET /api/houses — list all houses with id and blockNumber
export async function GET() {
  try {
    const session = await requireUser();
    const houses = await prisma.house.findMany({
      select: { id: true, blockNumber: true },
      orderBy: { blockNumber: "asc" },
    });
    return NextResponse.json(houses);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
