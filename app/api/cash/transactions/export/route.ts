import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { transactionCategoryLabels } from "@/lib/validations/cash";
import { buildCsv } from "@/lib/csv";

export async function GET() {
  try {
    await requireUser();

    const transactions = await prisma.cashTransaction.findMany({ orderBy: { date: "asc" } });

    const header = ["Tanggal", "Tipe", "Kategori", "Keterangan", "Nominal"];
    const rows = transactions.map((tx) => [
      new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(tx.date),
      tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
      transactionCategoryLabels[tx.category],
      tx.description,
      String(tx.amount),
    ]);

    const csv = buildCsv(header, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rekap-kas-barcelona-cove.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
