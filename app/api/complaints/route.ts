import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { createComplaintSchema } from "@/lib/validations/complaint";
import { notifyAdmins } from "@/lib/notify";

export async function GET() {
  try {
    const session = await requireUser();

    const complaints = await prisma.complaint.findMany({
      where: session.user.role === "WARGA" ? { createdById: session.user.id } : undefined,
      include: { createdBy: { select: { name: true, house: { select: { blockNumber: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(complaints);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();
    if (session.user.role !== "WARGA") throw new ForbiddenError();
    const body = await req.json();
    const parsed = createComplaintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const complaint = await prisma.complaint.create({
      data: { ...parsed.data, createdById: session.user.id },
    });

    await notifyAdmins("Pengaduan baru", complaint.title, `/complaints/${complaint.id}`);

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
