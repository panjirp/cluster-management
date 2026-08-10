import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: (error as UnauthorizedError).message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: (error as ForbiddenError).message }, { status: 403 });
  throw error;
}

const voteSchema = z.object({ optionIds: z.array(z.string().min(1)).min(1).max(8) });

// POST /api/polls/[id]/vote — warga memberi suara (menggantikan suara lama)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;
    const body = voteSchema.safeParse(await req.json().catch(() => null));
    if (!body.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

    const poll = await prisma.poll.findUnique({ where: { id }, include: { options: true } });
    if (!poll) return NextResponse.json({ error: "Poll tidak ditemukan." }, { status: 404 });
    if (poll.endsAt && poll.endsAt < new Date()) {
      return NextResponse.json({ error: "Poll ini sudah ditutup." }, { status: 409 });
    }
    if (!poll.isMultiple && body.data.optionIds.length > 1) {
      return NextResponse.json({ error: "Poll ini hanya boleh memilih satu pilihan." }, { status: 400 });
    }

    const validIds = new Set(poll.options.map((o) => o.id));
    const optionIds = [...new Set(body.data.optionIds)].filter((oid) => validIds.has(oid));
    if (optionIds.length === 0) return NextResponse.json({ error: "Pilihan tidak valid." }, { status: 400 });

    // Hapus suara lama user di poll ini, lalu masukkan yang baru (transaction).
    await prisma.$transaction(async (tx) => {
      await tx.pollVote.deleteMany({
        where: { userId: session.user.id, option: { pollId: poll.id } },
      });
      await tx.pollVote.createMany({
        data: optionIds.map((optionId) => ({ optionId, userId: session.user.id })),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
