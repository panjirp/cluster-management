import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { EventsList, type EventRow } from "@/components/events/events-list";

export const metadata: Metadata = { title: "Info & Acara" };

export default async function EventsPage() {
  const session = await requireUser();
  const isAdmin = session.user.role === "ADMIN";

  const events = await prisma.event.findMany({
    include: { rsvps: true },
    orderBy: { eventDate: "asc" },
  });

  const now = new Date();
  const rows: EventRow[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    eventDate: e.eventDate.toISOString(),
    isPast: e.eventDate < now,
    goingCount: e.rsvps.filter((r) => r.status === "GOING").length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Info & Acara</h1>
          <p className="text-sm text-muted-foreground">Kegiatan komunitas cluster Barcelona Cove</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button render={<Link href="/events/new">Buat Acara</Link>} />
          </div>
        )}
      </div>

      <EventsList events={rows} isAdmin={isAdmin} />
    </div>
  );
}
