import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { buildAnnualSummary } from "@/lib/cash";
import { generateAnnualCashReportPdf } from "@/lib/pdf";

export async function GET(req: NextRequest) {
  try {
    await requireUser();

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year") ?? new Date().getFullYear());

    const transactions = await prisma.cashTransaction.findMany({ orderBy: { date: "asc" } });
    const summary = buildAnnualSummary(transactions, year);

    const pdfBuffer = await generateAnnualCashReportPdf(summary);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rekap-tahunan-kas-${year}-barcelona-cove.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
