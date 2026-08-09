import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/session";
import { sendPushToUsers } from "@/lib/web-push";

// GET /api/letters — daftar surat edaran
export async function GET() {
  try {
    await requireUser();
    const letters = await prisma.suratEdaran.findMany({
      orderBy: { publishedAt: "desc" },
    });
    return NextResponse.json(letters);
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}

// POST /api/letters — tambah surat (admin)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { title, filePath, notifyWarga } = await req.json();

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Judul surat wajib diisi." }, { status: 400 });
    }
    if (!filePath || typeof filePath !== "string" || !filePath.startsWith("/api/uploads/")) {
      return NextResponse.json({ error: "File surat tidak valid." }, { status: 400 });
    }

    const letter = await prisma.suratEdaran.create({
      data: { title: title.trim(), filePath },
    });

    // Opsi: kirim notifikasi + push ke semua warga (seperti broadcast pengumuman)
    if (notifyWarga) {
      const warga = await prisma.user.findMany({ where: { role: "WARGA" }, select: { id: true } });
      const notifTitle = "📄 Surat Edaran Baru";
      const notifBody = `${title.trim()}`;
      await prisma.notification.createMany({
        data: warga.map((w) => ({
          userId: w.id,
          title: notifTitle,
          body: notifBody,
          url: "/letters",
        })),
      });
      await sendPushToUsers(
        warga.map((w) => w.id),
        { title: notifTitle, body: notifBody, url: "/letters" }
      ).catch(() => {});
    }

    return NextResponse.json(letter, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
