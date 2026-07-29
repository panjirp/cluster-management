import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { BackLink } from "@/components/shared/back-link";
import { EventRsvpSection } from "@/components/events/event-rsvp-section";
import { maskName } from "@/lib/mask";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(date);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, select: { title: true } });
  return { title: event?.title ?? "Acara" };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { rsvps: { include: { user: { select: { id: true, name: true } } } }, createdBy: { select: { name: true } } },
  });

  if (!event) notFound();

  const going = event.rsvps.filter((r) => r.status === "GOING");
  const myRsvp = event.rsvps.find((r) => r.userId === session.user.id);
  const canSeeFullNames = session.user.role === "ADMIN" || session.user.role === "BENDAHARA";

  return (
    <div className="max-w-2xl space-y-6">
      <BackLink href="/events" label="Kembali ke Info & Acara" />
      <div>
        <h1 className="text-2xl font-semibold">{event.title}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(event.eventDate)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">Dibuat oleh {event.createdBy.name}</p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Deskripsi</p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
      </div>

      <EventRsvpSection
        eventId={event.id}
        initialStatus={myRsvp?.status ?? null}
        initialGoing={going.map((r) => ({
          userId: r.userId,
          displayName: canSeeFullNames || r.userId === session.user.id ? r.user.name : maskName(r.user.name),
        }))}
        myUserId={session.user.id}
        myDisplayName={session.user.name ?? "Anda"}
      />
    </div>
  );
}
