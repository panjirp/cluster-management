import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";

type FeedItem = {
  id: string;
  type: "fyp" | "event" | "announcement" | "market";
  title: string;
  body: string;
  image?: string | null;
  actor?: string;
  url?: string;
  createdAt: Date;
};

// GET /api/feed — feed aktivitas cluster (FYP + acara + pengumuman + jual beli)
export async function GET() {
  try {
    await requireUser();

    const [photos, events, broadcasts, listings] = await Promise.all([
      prisma.galleryPhoto.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { uploadedBy: { select: { name: true } }, _count: { select: { likes: true, comments: true } } },
      }),
      prisma.event.findMany({
        orderBy: { eventDate: "desc" },
        take: 10,
      }),
      prisma.notification.findMany({
        where: { broadcastId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.marketListing.findMany({
        where: { status: "AKTIF" },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { seller: { select: { name: true } } },
      }),
    ]);

    const items: FeedItem[] = [];

    for (const p of photos) {
      items.push({
        id: `fyp-${p.id}`,
        type: "fyp",
        title: `${p.uploadedBy.name} unggah momen baru`,
        body: p.caption ?? "",
        image: p.filePath,
        actor: p.uploadedBy.name,
        url: "/fyp",
        createdAt: p.createdAt,
      });
    }

    for (const e of events) {
      items.push({
        id: `event-${e.id}`,
        type: "event",
        title: e.title,
        body: `${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(e.eventDate))}${e.location ? ` · ${e.location}` : ""}`,
        actor: "Info & Acara",
        url: "/events",
        createdAt: e.eventDate,
      });
    }

    for (const b of broadcasts) {
      items.push({
        id: `ann-${b.id}`,
        type: "announcement",
        title: b.title,
        body: b.body,
        actor: "Pengumuman",
        url: b.url ?? "/notifications",
        createdAt: b.createdAt,
      });
    }

    for (const l of listings) {
      items.push({
        id: `market-${l.id}`,
        type: "market",
        title: `${l.seller.name} pasang: ${l.title}`,
        body: l.price != null ? `Rp ${l.price.toLocaleString("id-ID")}` : "Gratis / Nego",
        image: l.imagePath,
        actor: "Jual Beli",
        url: "/market",
        createdAt: l.createdAt,
      });
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return NextResponse.json(items.slice(0, 50));
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
