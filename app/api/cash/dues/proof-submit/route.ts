import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { sendPushToUsers } from "@/lib/web-push";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "payment-proofs");

export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file");
    const monthlyDueId = formData.get("monthlyDueId");

    if (!monthlyDueId || typeof monthlyDueId !== "string") {
      return NextResponse.json({ error: "monthlyDueId wajib diisi." }, { status: 400 });
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided. Use form field 'file'." }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File terlalu besar. Maksimal 5 MB." }, { status: 400 });
    }

    // Validate file type: image/* or application/pdf
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      return NextResponse.json({ error: "Tipe file tidak valid. Hanya gambar dan PDF yang diizinkan." }, { status: 400 });
    }

    // Verify MonthlyDue exists and belongs to user's house (WARGA can only submit for their own house)
    const due = await prisma.monthlyDue.findUnique({
      where: { id: monthlyDueId },
      include: { house: { select: { id: true, blockNumber: true } } },
    });
    if (!due) {
      return NextResponse.json({ error: "Data iuran tidak ditemukan." }, { status: 404 });
    }
    if (due.house.id !== session.user.houseId) {
      return NextResponse.json({ error: "Anda hanya dapat mengajukan pembayaran untuk rumah Anda sendiri." }, { status: 403 });
    }

    // Determine extension
    const ext = file.name.split(".").pop()?.toLowerCase() ?? (isPdf ? "pdf" : "jpg");
    const allowedExts = ["jpg", "jpeg", "png", "gif", "webp", "pdf"];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ error: "Ekstensi file tidak diizinkan." }, { status: 400 });
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Create PaymentProof record first to get the ID
    const proof = await prisma.paymentProof.create({
      data: {
        monthlyDueId: due.id,
        submittedById: session.user.id,
        fileName: file.name,
        filePath: "", // will fill after save
        fileSize: file.size,
        mimeType: file.type,
        status: "PENDING",
      },
      select: { id: true },
    });

    // Build file path: submission-<proofId>-<timestamp>.<ext>
    const timestamp = Date.now();
    const filename = `submission-${proof.id}-${timestamp}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Update PaymentProof record with filePath
    // Catatan: pakai /api/uploads/... (route handler dinamis), bukan /uploads/...
    // karena `next start` hanya men-serve folder public yang eksis saat build.
    const publicPath = `/api/uploads/payment-proofs/${filename}`;
    await prisma.paymentProof.update({
      where: { id: proof.id },
      data: { filePath: publicPath },
    });

    // Notifikasi pembayaran → semua admin & bendahara (muncul sebagai push saat app dibuka)
    const pengurus = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "BENDAHARA"] } },
      select: { id: true },
    });
    if (pengurus.length > 0) {
      await prisma.notification.createMany({
        data: pengurus.map((p) => ({
          userId: p.id,
          title: "🧾 Bukti Pembayaran Baru",
          body: `Warga blok ${due.house.blockNumber} (${session.user.name ?? "warga"}) mengajukan bukti pembayaran iuran — menunggu review.`,
          url: "/admin/payment-proofs",
        })),
      });
      // Push: FCM (Android native) + Web Push (PWA iOS/Android/desktop) ke pengurus
      await sendPushToUsers(
        pengurus.map((p) => p.id),
        {
          title: "🧾 Bukti Pembayaran Baru",
          body: `Warga blok ${due.house.blockNumber} (${session.user.name ?? "warga"}) mengajukan bukti pembayaran iuran — menunggu review.`,
          url: "/admin/payment-proofs",
        }
      ).catch(() => {});
    }

    return NextResponse.json({ id: proof.id, status: "PENDING", filePath: publicPath }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error("Proof submission failed:", error);
    return NextResponse.json({ error: "Gagal mengajukan pembayaran. Coba lagi." }, { status: 500 });
  }
}
