import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { updateUserSchema } from "@/lib/validations/user";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (parsed.data.email && parsed.data.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (emailTaken) {
        return NextResponse.json({ error: "Email sudah dipakai akun lain." }, { status: 409 });
      }
    }

    const { password, ...rest } = parsed.data;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10), mustChangePassword: true } : {}),
      },
    });

    return NextResponse.json({ id: user.id, name: user.name, role: user.role });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    if (id === session.user.id) {
      return NextResponse.json({ error: "Tidak bisa menghapus akun Anda sendiri." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { complaints: true, permits: true, events: true } },
      },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { complaints, permits, events } = existing._count;
    if (complaints > 0 || permits > 0 || events > 0) {
      return NextResponse.json(
        { error: "Warga ini memiliki riwayat pengaduan/perizinan/acara sehingga tidak bisa dihapus." },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.eventRSVP.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
