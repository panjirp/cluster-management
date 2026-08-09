import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { sendPushToUser } from "@/lib/web-push";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBendahara();
    const { id } = await params;

    const contentType = req.headers.get("content-type") ?? "";
    let status: string | undefined;
    let rejectionReason: string | undefined;

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      status = body.status;
      rejectionReason = body.rejectionReason;
    } else {
      // Form POST (dari halaman Review Bukti: form action + input hidden)
      const fd = await req.formData().catch(() => new FormData());
      status = (fd.get("status") as string) ?? undefined;
      rejectionReason = (fd.get("rejectionReason") as string) ?? undefined;
    }

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
    await prisma.paymentProof.update({
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

    // Notifikasi pembayaran → warga pengaju (muncul sebagai push saat app dibuka)
    const reviewerName = session.user.name ?? "Pengurus";
    await prisma.notification.create({
      data: {
        userId: proof.submittedById,
        title: status === "APPROVED" ? "✅ Bukti Pembayaran Disetujui" : "❌ Bukti Pembayaran Ditolak",
        body:
          status === "APPROVED"
            ? `Bukti iuran Anda disetujui oleh ${reviewerName}. Iuran tercatat lunas — terima kasih! 🙏`
            : `Bukti iuran Anda ditolak oleh ${reviewerName}. Alasan: ${rejectionReason ?? "-"}`,
        url: "/cash/dues/proof-submit",
      },
    });
    // Push: FCM (Android native) + Web Push (PWA iOS/Android/desktop) ke perangkat warga
    await sendPushToUser(proof.submittedById, {
      title: status === "APPROVED" ? "✅ Bukti Pembayaran Disetujui" : "❌ Bukti Pembayaran Ditolak",
      body:
        status === "APPROVED"
          ? `Bukti iuran Anda disetujui oleh ${reviewerName}. Iuran tercatat lunas — terima kasih! 🙏`
          : `Bukti iuran Anda ditolak oleh ${reviewerName}. Alasan: ${rejectionReason ?? "-"}`,
      url: "/cash/dues/proof-submit",
    }).catch(() => {});

    // Refresh halaman review setelah review selesai (form POST → redirect ke halaman)
    revalidatePath("/admin/payment-proofs", "page");
    redirect("/admin/payment-proofs");
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    // redirect() dari next/navigation melempar NEXT_REDIRECT — biarkan Next.js yang menangani
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("Review payment proof failed:", error);
    return NextResponse.json(
      { error: "Gagal memproses review. Coba lagi." },
      { status: 500 }
    );
  }
}
