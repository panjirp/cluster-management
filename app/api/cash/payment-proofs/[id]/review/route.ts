import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBendahara();
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const { status, rejectionReason } = body as {
      status: "APPROVED" | "REJECTED";
      rejectionReason?: string;
    };

    if (!status || (status !== "APPROVED" && status !== "REJECTED")) {
      return NextResponse.json(
        { error: "Status harus APPROVED atau REJECTED." },
        { status: 400 }
      );
    }

    if (status === "REJECTED" && (!rejectionReason || rejectionReason.trim() === "")) {
      return NextResponse.json(
        { error: "Alasan penolakan wajib diisi." },
        { status: 400 }
      );
    }

    // Find the PaymentProof with its MonthlyDue
    const proof = await prisma.paymentProof.findUnique({
      where: { id },
      include: {
        monthlyDue: true,
      },
    });

    if (!proof) {
      return NextResponse.json({ error: "Bukti pembayaran tidak ditemukan." }, { status: 404 });
    }

    const session = await requireBendahara();

    // Update the PaymentProof record
    const updatedProof = await prisma.paymentProof.update({
      where: { id },
      data: {
        status,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        ...(status === "REJECTED" && rejectionReason ? { rejectionReason } : {}),
      },
      include: {
        monthlyDue: {
          include: {
            house: {
              select: { blockNumber: true },
            },
          },
        },
        submittedBy: {
          select: { name: true },
        },
        reviewedBy: {
          select: { name: true },
        },
      },
    });

    // If APPROVED, mark the related MonthlyDue as paid
    if (status === "APPROVED") {
      await prisma.monthlyDue.update({
        where: { id: proof.monthlyDueId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          paymentProofUrl: proof.filePath,
        },
      });
    }

    return NextResponse.json(updatedProof, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Review payment proof failed:", error);
    return NextResponse.json(
      { error: "Gagal memproses review. Coba lagi." },
      { status: 500 }
    );
  }
}
