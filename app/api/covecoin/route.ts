import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireBendahara, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { sendPushToUsers } from "@/lib/web-push";

function errorResponse(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  throw error;
}

// GET /api/covecoin — saldo CoveCoin + riwayat transaksi ku
export async function GET() {
  try {
    const session = await requireUser();
    const [ledger, aggregate] = await Promise.all([
      prisma.coveCoinLedger.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.coveCoinLedger.aggregate({
        where: { userId: session.user.id },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      balance: aggregate._sum.amount ?? 0,
      ledger: ledger.map((l) => ({
        id: l.id,
        amount: l.amount,
        type: l.type,
        description: l.description,
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

const adjustSchema = {
  amount: (v: unknown) => typeof v === "number" && Number.isInteger(v) && v !== 0,
};

// POST /api/covecoin — bendahara beri/kurang CoveCoin manual (redeem/adjust)
export async function POST(req: NextRequest) {
  try {
    await requireBendahara();
    const body = await req.json();
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const amount = body?.amount;
    const description = typeof body?.description === "string" ? body.description.slice(0, 200) : null;

    if (!userId || !adjustSchema.amount(amount)) {
      return NextResponse.json({ error: "userId & amount (integer non-zero) wajib." }, { status: 400 });
    }

    const entry = await prisma.coveCoinLedger.create({
      data: {
        userId,
        amount,
        type: amount > 0 ? "EARN" : "REDEEM",
        description,
      },
    });

    // Notifikasi ke warga yang dikenai transaksi
    if (amount < 0) {
      await sendPushToUsers([userId], {
        title: "🪙 CoveCoin kamu dipakai",
        body: description ?? `${amount} CoveCoin` + ` dipotong pengurus.`,
        url: "/score",
      }).catch(() => {});
    } else {
      await sendPushToUsers([userId], {
        title: "🪙 CoveCoin bertambah!",
        body: `+${amount} CoveCoin` + (description ? ` — ${description}` : ""),
        url: "/score",
      }).catch(() => {});
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
