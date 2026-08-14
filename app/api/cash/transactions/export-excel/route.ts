import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { transactionCategoryLabels } from "@/lib/validations/cash";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  try {
    await requireUser();

    const transactions = await prisma.cashTransaction.findMany({ orderBy: { date: "asc" } });

    let income = 0;
    let expense = 0;
    const rows = transactions.map((tx) => {
      if (tx.type === "INCOME") income += tx.amount;
      else expense += tx.amount;
      return {
        date: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(tx.date),
        type: tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
        category: transactionCategoryLabels[tx.category],
        desc: tx.description ?? "",
        amount: tx.amount,
      };
    });
    const balance = income - expense;

    // SpreadsheetML (Excel/Google Sheets compatible, tanpa library eksternal)
    const cell = (v: string, bold = false) =>
      `<Cell ss:StyleID="${bold ? "Bold" : "Normal"}"><Data ss:Type="String">${esc(v)}</Data></Cell>`;
    const num = (v: number, bold = false) =>
      `<Cell ss:StyleID="${bold ? "Bold" : "Normal"}"><Data ss:Type="Number">${v}</Data></Cell>`;

    const trs = [
      `<Row>${cell("Rekap Kas Barcelona Cove")}</Row>`,
      `<Row>${cell("Diperbarui: " + new Date().toLocaleString("id-ID"))}</Row>`,
      `<Row></Row>`,
      `<Row>${cell("Tanggal")}${cell("Tipe")}${cell("Kategori")}${cell("Keterangan")}${cell("Nominal")}</Row>`,
      ...rows.map(
        (r) =>
          `<Row>${cell(r.date)}${cell(r.type)}${cell(r.category)}${cell(r.desc)}${num(r.amount)}</Row>`
      ),
      `<Row></Row>`,
      `<Row>${cell("TOTAL PEMASUKAN")}${num(income, true)}</Row>`,
      `<Row>${cell("TOTAL PENGELUARAN")}${num(expense, true)}</Row>`,
      `<Row>${cell("SALDO")}${num(balance, true)}</Row>`,
    ].join("");

    const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Normal"><Font ss:Name="Calibri" ss:Size="11"/></Style>
  <Style ss:ID="Bold"><Font ss:Name="Calibri" ss:Size="11" ss:Bold="1"/></Style>
 </Styles>
 <Worksheet ss:Name="Laporan Kas">
  <Table>
   ${trs}
  </Table>
 </Worksheet>
</Workbook>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": 'attachment; filename="laporan-kas-barcelona-cove.xls"',
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
