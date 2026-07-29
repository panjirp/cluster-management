import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { EventForm } from "@/components/events/event-form";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Buat Acara" };

export default async function NewEventPage() {
  const session = await requireUser();
  if (session.user.role !== "ADMIN") redirect("/events");

  return (
    <div className="space-y-6">
      <BackLink href="/events" label="Kembali ke Info & Acara" />
      <div>
        <h1 className="text-2xl font-semibold">Buat Acara</h1>
        <p className="text-sm text-muted-foreground">Informasikan kegiatan komunitas kepada warga</p>
      </div>
      <EventForm />
    </div>
  );
}
