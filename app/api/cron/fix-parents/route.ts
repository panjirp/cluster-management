import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/cron/fix-parents — panggil via CRON_SECRET
export async function POST(request: NextRequest) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { childName, correctParentId } = body;

  if (!childName || !correctParentId) {
    // List semua anak + parent untuk inspeksi
    const all = await prisma.child.findMany({
      include: {
        parent: { select: { id: true, name: true, email: true, house: { select: { blockNumber: true } } } },
      },
    });

    return NextResponse.json({
      children: all.map(c => ({
        id: c.id,
        name: c.name,
        parentId: c.parent.id,
        parentName: c.parent.name,
        parentEmail: c.parent.email,
        house: c.parent.house?.blockNumber ?? "-",
      })),
    });
  }

  // Update parent
  const updated = await prisma.child.update({
    where: { id: (await prisma.child.findFirst({ where: { name: childName } }))?.id ?? childName },
    data: { userId: correctParentId },
    include: { parent: { select: { name: true } } },
  });

  return NextResponse.json({ ok: true, child: updated.name, parent: updated.parent.name });
}
