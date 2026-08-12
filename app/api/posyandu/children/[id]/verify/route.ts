import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// PATCH /api/posyandu/children/[id]/verify — admin verifikasi anak
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "BENDAHARA")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const child = await prisma.child.update({
    where: { id },
    data: { isVerified: true, verifiedById: session.user.id },
  });

  return NextResponse.json(child);
}
