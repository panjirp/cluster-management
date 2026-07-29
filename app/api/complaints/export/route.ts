import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { complaintCategoryLabels, complaintStatusLabels } from "@/lib/validations/complaint";
import { buildCsv } from "@/lib/csv";

export async function GET() {
  try {
    const session = await requireUser();

    const complaints = await prisma.complaint.findMany({
      where: session.user.role === "WARGA" ? { createdById: session.user.id } : undefined,
      include: { createdBy: { select: { name: true, house: { select: { blockNumber: true } } } } },
      orderBy: { createdAt: "asc" },
    });

    const header = ["Tanggal", "Judul", "Kategori", "Status", "Warga", "Blok", "Deskripsi", "Tanggapan"];
    const rows = complaints.map((c) => [
      new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(c.createdAt),
      c.title,
      complaintCategoryLabels[c.category],
      complaintStatusLabels[c.status],
      c.createdBy.name,
      c.createdBy.house?.blockNumber ?? "",
      c.description,
      c.response ?? "",
    ]);

    const csv = buildCsv(header, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pengaduan-barcelona-cove.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
