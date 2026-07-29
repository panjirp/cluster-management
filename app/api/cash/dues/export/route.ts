import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { buildCsv } from "@/lib/csv";
import { compareBlockNumber } from "@/lib/sort";

const MONTH_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export async function GET(req: NextRequest) {
  try {
    await requireUser();

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = Number(searchParams.get("year") ?? now.getFullYear());
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);

    const houses = (
      await prisma.house.findMany({
        include: {
          monthlyDues: { where: { year, month } },
          residents: { select: { name: true } },
        },
      })
    ).sort((a, b) => compareBlockNumber(a.blockNumber, b.blockNumber));

    const header = ["Rumah", "Pemilik", "Nominal", "Status"];
    const rows = houses.map((house) => {
      const due = house.monthlyDues[0];
      return [
        house.blockNumber,
        house.residents.map((r) => r.name).join(", "),
        due ? String(due.amount) : "",
        due ? (due.isPaid ? "Lunas" : "Belum Bayar") : "Belum Dibuat",
      ];
    });

    const csv = buildCsv(header, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="iuran-${MONTH_LABELS[month - 1].toLowerCase()}-${year}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
