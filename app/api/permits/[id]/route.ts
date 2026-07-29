import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { getStore } from "@netlify/blobs";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { updatePermitSchema } from "@/lib/validations/permit";
import { generatePermitPdf } from "@/lib/pdf";

const useBlobStore = !!process.env.NETLIFY;

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
    throw error;
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

      let finalDocUrl: string;
      if (useBlobStore) {
        const store = getStore("uploads");
        const arrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength) as ArrayBuffer;
        await store.set(filename, arrayBuffer, { metadata: { contentType: "application/pdf" } });
        finalDocUrl = `/api/uploads/${filename}`;
      } else {
        await writeFile(path.join(process.cwd(), "public", "uploads", filename), pdfBuffer);
        finalDocUrl = `/uploads/${filename}`;
      }

      permit = await prisma.permit.update({ where: { id }, data: { finalDocUrl } });
    }

    return NextResponse.json(permit);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
