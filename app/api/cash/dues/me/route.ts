import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";

/**
 * GET /api/cash/dues/me
 * Status iuran kas bulan berjalan untuk warga yang login.
 * Dipakai app Android untuk memutuskan: jadwalkan pengingat tgl 1/10/25
 * (belum bayar) atau batalkan semua pengingat (sudah bayar).
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await requireUser();
    if (!session.user.houseId) {
      return NextResponse.json({ error: "Akun tidak terhubung ke rumah." }, { status: 400 });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const due = await prisma.monthlyDue.findFirst({
      where: { houseId: session.user.houseId, year, month },
      select: { id: true, isPaid: true, amount: true },
    });

    return NextResponse.json({
      year,
      month,
      paid: due?.isPaid ?? false,
      hasDue: Boolean(due),
      dueId: due?.id ?? null,
      amount: due?.amount ?? 0,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("GET /api/cash/dues/me failed:", error);
    return NextResponse.json({ error: "Gagal memuat status iuran." }, { status: 500 });
  }
}
