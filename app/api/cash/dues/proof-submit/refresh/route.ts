import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await requireUser();

    if (!session.user.houseId) {
      return NextResponse.json({ dues: [] });
    }

    const dues = await prisma.monthlyDue.findMany({
      where: { houseId: session.user.houseId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        paymentProofs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            fileName: true,
            filePath: true,
            createdAt: true,
            rejectionReason: true,
          },
        },
      },
    });

    return NextResponse.json({
      dues: dues.map((d) => ({
        id: d.id,
        year: d.year,
        month: d.month,
        amount: d.amount,
        isPaid: d.isPaid,
        proof: d.paymentProofs[0] ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}
