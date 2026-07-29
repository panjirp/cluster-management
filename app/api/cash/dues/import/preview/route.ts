import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { importPreviewSchema } from "@/lib/validations/cash";
import { extractSheetExportUrl } from "@/lib/sheet-import";
import { parseDuesLedger } from "@/lib/dues-sheet-import";
import { compareBlockNumber } from "@/lib/sort";

export async function POST(req: NextRequest) {
  try {
    await requireBendahara();
    const body = await req.json();
    const parsed = importPreviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const exportUrl = extractSheetExportUrl(parsed.data.sheetUrl);
    if (!exportUrl) {
      return NextResponse.json({ error: "URL Google Sheets tidak dikenali." }, { status: 400 });
    }

    const sheetRes = await fetch(exportUrl);
    if (!sheetRes.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil data. Pastikan sheet dapat diakses publik (Anyone with the link)." },
        { status: 400 }
      );
    }

    const csvText = await sheetRes.text();
    const { rows, skippedColumns, warnings } = parseDuesLedger(csvText);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data yang bisa dibaca dari sheet ini. Pastikan formatnya sesuai matriks iuran per rumah per bulan." },
        { status: 400 }
      );
    }

    const [houses, existingDues] = await Promise.all([
      prisma.house.findMany({ select: { id: true, blockNumber: true } }),
      prisma.monthlyDue.findMany({ select: { houseId: true, year: true, month: true, isPaid: true } }),
    ]);

    const houseIdByBlock = new Map(houses.map((h) => [h.blockNumber, h.id]));
    const dueStatusByKey = new Map(
      existingDues.map((d) => [`${d.houseId}:${d.year}-${d.month}`, d.isPaid])
    );

    type MonthEntry = { year: number; month: number; amount: number; status: "new" | "update_to_paid" | "already_paid" };
    const houseGroups = new Map<
      string,
      { blockNumber: string; houseCode: string; residentName: string; houseExists: boolean; months: MonthEntry[] }
    >();

    for (const row of rows) {
      let group = houseGroups.get(row.blockNumber);
      if (!group) {
        group = {
          blockNumber: row.blockNumber,
          houseCode: row.houseCode,
          residentName: row.residentName,
          houseExists: houseIdByBlock.has(row.blockNumber),
          months: [],
        };
        houseGroups.set(row.blockNumber, group);
      }

      let status: MonthEntry["status"] = "new";
      const houseId = houseIdByBlock.get(row.blockNumber);
      if (houseId) {
        const existingPaid = dueStatusByKey.get(`${houseId}:${row.year}-${row.month}`);
        if (existingPaid === true) status = "already_paid";
        else if (existingPaid === false) status = "update_to_paid";
      }

      group.months.push({ year: row.year, month: row.month, amount: row.amount, status });
    }

    const houseList = Array.from(houseGroups.values()).sort((a, b) => compareBlockNumber(a.blockNumber, b.blockNumber));

    await prisma.setting.upsert({
      where: { id: "singleton" },
      update: { duesSheetUrl: parsed.data.sheetUrl },
      create: { id: "singleton", duesSheetUrl: parsed.data.sheetUrl },
    });

    return NextResponse.json({ houses: houseList, skippedColumns, warnings });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
