import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { importPreviewSchema } from "@/lib/validations/cash";
import { extractSheetExportUrl, parseLedger } from "@/lib/sheet-import";

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
    const { blocks, warnings } = parseLedger(csvText);

    if (blocks.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data yang bisa dibaca dari sheet ini. Pastikan formatnya sesuai laporan kas bulanan." },
        { status: 400 }
      );
    }

    const importKeys = blocks.flatMap((b) => b.rows.map((r) => r.importKey));
    const existing = await prisma.cashTransaction.findMany({
      where: { importKey: { in: importKeys } },
      select: { importKey: true },
    });
    const existingKeys = new Set(existing.map((e) => e.importKey));

    const blocksWithStatus = blocks.map((block) => ({
      ...block,
      rows: block.rows.map((row) => ({ ...row, alreadyImported: existingKeys.has(row.importKey) })),
    }));

    await prisma.setting.upsert({
      where: { id: "singleton" },
      update: { cashSheetUrl: parsed.data.sheetUrl },
      create: { id: "singleton", cashSheetUrl: parsed.data.sheetUrl },
    });

    return NextResponse.json({ blocks: blocksWithStatus, warnings });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
