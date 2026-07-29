import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { permitTypeLabels, permitStatusLabels } from "@/lib/validations/permit";
import { buildCsv } from "@/lib/csv";

export async function GET() {
  try {
    const session = await requireUser();

    const permits = await prisma.permit.findMany({
      where: session.user.role === "WARGA" ? { createdById: session.user.id } : undefined,
      include: { createdBy: { select: { name: true, house: { select: { blockNumber: true } } } } },
      orderBy: { createdAt: "asc" },
    });

    const header = ["Tanggal", "Judul", "Tipe", "Status", "Warga", "Blok", "Deskripsi", "Catatan Admin"];
    const rows = permits.map((p) => [
      new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(p.createdAt),
      p.title,
      permitTypeLabels[p.type],
      permitStatusLabels[p.status],
      p.createdBy.name,
      p.createdBy.house?.blockNumber ?? "",
      p.description,
      p.adminNotes ?? "",
    ]);

    const csv = buildCsv(header, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="perizinan-barcelona-cove.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
