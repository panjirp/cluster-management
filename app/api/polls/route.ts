import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: (error as UnauthorizedError).message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: (error as ForbiddenError).message }, { status: 403 });
  throw error;
}

// GET /api/polls — semua poll beserta opsi, jumlah suara, dan pilihan user ini
export async function GET() {
  try {
    const session = await requireUser();
    const polls = await prisma.poll.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        options: {
          orderBy: { sort: "asc" },
          include: { votes: { select: { id: true, userId: true } } },
        },
      },
    });
    return NextResponse.json(
      polls.map((p) => ({
        id: p.id,
        title: p.title,
        question: p.question,
        isMultiple: p.isMultiple,
        endsAt: p.endsAt,
        createdAt: p.createdAt,
        createdById: p.createdById,
        options: p.options.map((o) => ({
          id: o.id,
          label: o.label,
          voteCount: o.votes.length,
          votedByMe: o.votes.some((v) => v.userId === session.user.id),
        })),
      }))
    );
  } catch (error) {
    return errorResponse(error);
  }
}

const createPollSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter").max(120),
  question: z.string().min(5, "Pertanyaan minimal 5 karakter").max(500),
  isMultiple: z.boolean().default(false),
  endsAt: z.string().optional().nullable(),
  options: z.array(z.string().min(1).max(100)).min(2, "Minimal 2 pilihan jawaban").max(8, "Maksimal 8 pilihan"),
});

// POST /api/polls — admin membuat poll baru
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = createPollSchema.safeParse(await req.json());
    if (!body.success) {
      const message = body.error.issues[0]?.message ?? "Data tidak valid.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { title, question, isMultiple, endsAt, options } = body.data;

    const poll = await prisma.poll.create({
      data: {
        title: title.trim(),
        question: question.trim(),
        isMultiple,
        endsAt: endsAt ? new Date(endsAt) : null,
        createdById: session.user.id,
        options: { create: options.map((label, i) => ({ label: label.trim(), sort: i })) },
      },
    });
    return NextResponse.json(poll, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
