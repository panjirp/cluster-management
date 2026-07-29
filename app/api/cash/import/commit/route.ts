import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { importCommitSchema } from "@/lib/validations/cash";

export async function POST(req: NextRequest) {
  try {
    await requireBendahara();
    const body = await req.json();
    const parsed = importCommitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // De-duplicate importKeys within the request itself, in case the client
    // submitted the same row twice (e.g. a stale re-click).
    const seenInRequest = new Set<string>();
    const dedupedRows = parsed.data.rows.filter((r) => {
      if (seenInRequest.has(r.importKey)) return false;
      seenInRequest.add(r.importKey);
      return true;
    });

    const existing = await prisma.cashTransaction.findMany({
      where: { importKey: { in: dedupedRows.map((r) => r.importKey) } },
      select: { importKey: true },
    });
    const existingKeys = new Set(existing.map((e) => e.importKey));
    const newRows = dedupedRows.filter((r) => !existingKeys.has(r.importKey));

    const result = await prisma.cashTransaction.createMany({
      data: newRows.map((row) => ({
        type: row.type,
        category: row.category,
        amount: row.amount,
        description: row.description,
        date: new Date(row.date),
        importKey: row.importKey,
      })),
    });

    return NextResponse.json({
      imported: result.count,
      skipped: parsed.data.rows.length - result.count,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
