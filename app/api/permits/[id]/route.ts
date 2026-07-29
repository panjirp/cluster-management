import { NextRequest, NextResponse } from "next/server";
import { saveUpload } from "@/lib/save-upload";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { updatePermitSchema } from "@/lib/validations/permit";
import { generatePermitPdf } from "@/lib/pdf";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;

    const permit = await prisma.permit.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, house: { select: { blockNumber: true } } } },
        assetBookings: { include: { asset: true } },
      },
    });

    if (!permit) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (session.user.role === "WARGA" && permit.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(permit);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    console.error("Failed to fetch permit:", error);
    return NextResponse.json({ error: "Gagal memuat data perizinan." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = updatePermitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.permit.findUnique({
      where: { id },
      include: { createdBy: { select: { name: true, house: { select: { blockNumber: true } } } } },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let permit = await prisma.permit.update({
      where: { id },
      data: {
        status: parsed.data.status,
        adminNotes: parsed.data.adminNotes,
        decidedAt: parsed.data.status !== "PENDING" ? new Date() : existing.decidedAt,
      },
    });

    if (permit.status === "APPROVED" && !permit.finalDocUrl) {
      const pdfBuffer = await generatePermitPdf(permit, existing.createdBy.name, existing.createdBy.house?.blockNumber ?? null);
      const filename = `${permit.id}.pdf`;
      const finalDocUrl = await saveUpload(pdfBuffer, filename, "application/pdf");

      permit = await prisma.permit.update({ where: { id }, data: { finalDocUrl } });
    }

    return NextResponse.json(permit);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    console.error("Failed to update permit:", error);
    return NextResponse.json({ error: "Gagal memperbarui perizinan." }, { status: 500 });
  }
}
