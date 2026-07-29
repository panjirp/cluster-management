import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { updateComplaintSchema, complaintStatusLabels } from "@/lib/validations/complaint";
import { notifyUser } from "@/lib/notify";
import { logActivity } from "@/lib/activity-log";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { createdBy: { select: { name: true, house: { select: { blockNumber: true } } } } },
    });

    if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (session.user.role === "WARGA" && complaint.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(complaint);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateComplaintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const complaint = await prisma.complaint.update({
      where: { id },
      data: {
        status: parsed.data.status,
        response: parsed.data.response,
        resolvedAt: parsed.data.status === "RESOLVED" ? new Date() : existing.resolvedAt,
      },
    });

    if (parsed.data.status && parsed.data.status !== existing.status) {
      await notifyUser(
        complaint.createdById,
        "Status pengaduan diperbarui",
        `${complaint.title}: ${complaintStatusLabels[parsed.data.status]}`,
        `/complaints/${complaint.id}`
      );
      await logActivity(
        session.user.name ?? session.user.email ?? "Admin",
        "UPDATE_COMPLAINT_STATUS",
        `Mengubah status pengaduan "${complaint.title}" menjadi ${complaintStatusLabels[parsed.data.status]}`
      );
    }

    return NextResponse.json(complaint);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
