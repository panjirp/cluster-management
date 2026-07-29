import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";

export async function GET() {
  try {
    await requireUser();
    const assets = await prisma.asset.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(assets);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
