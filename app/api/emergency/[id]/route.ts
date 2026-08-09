import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";

// PATCH /api/emergency/[id] — pengurus menandai alert darurat selesai.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireBendahara();
    const { id } = await params;

    const alert = await prisma.emergencyAlert.update({
      where: { id },
      data: { status: "RESOLVED", resolvedBy: session.user.name, resolvedAt: new Date() },
    });
    return NextResponse.json({ alert });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
