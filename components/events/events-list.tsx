"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarDays, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { EventsCalendar } from "@/components/events/events-calendar";
import { useQueryState } from "@/lib/use-query-state";

const ALL_TIME = "__all__";
const UPCOMING = "upcoming";
const PAST = "past";

const timeItems = {
  [ALL_TIME]: "Semua Waktu",
  [UPCOMING]: "Akan Datang",
  [PAST]: "Sudah Lewat",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date(date));
}

export type EventRow = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  eventDate: string;
  isPast: boolean;
  goingCount: number;
};

export function EventsList({ events, isAdmin }: { events: EventRow[]; isAdmin: boolean }) {
  const [time, setTime] = useQueryState("time", ALL_TIME);
  const [query, setQuery] = useQueryState("q", "");
  const [selectedDate, setSelectedDate] = useQueryState("date", "");

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        if (time === UPCOMING && e.isPast) return false;
        if (time === PAST && !e.isPast) return false;
        if (query) {
          const q = query.toLowerCase();
          const haystack = `${e.title} ${e.description} ${e.location ?? ""}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        if (selectedDate) {
          const d = new Date(e.eventDate);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          if (key !== selectedDate) return false;
        }
        return true;
      }),
    [events, time, query, selectedDate]
  );

  return (
    <div className="space-y-4">
      <EventsCalendar
        events={events}
        selectedDate={selectedDate || null}
        onSelectDate={(date) => setSelectedDate(date ?? "")}
      />

      <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari judul, deskripsi, atau lokasi…"
          className="sm:w-64"
        />
        <Select items={timeItems} value={time} onValueChange={(v) => v && setTime(v)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TIME}>Semua Waktu</SelectItem>
            <SelectItem value={UPCOMING}>Akan Datang</SelectItem>
            <SelectItem value={PAST}>Sudah Lewat</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} dari {events.length} acara
        </span>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Belum ada acara"
          description={
            isAdmin ? "Buat acara komunitas pertama untuk mengundang warga." : "Pengurus belum membuat acara komunitas."
          }
          action={isAdmin ? <Button size="sm" render={<Link href="/events/new">Buat Acara</Link>} /> : undefined}
        />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-muted-foreground">
          <SearchX className="size-8" />
          <p className="text-sm">Tidak ada acara yang cocok dengan pencarian.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} className="group block">
              <Card
                className={`border-l-4 ${event.isPast ? "border-l-muted-foreground/30 opacity-70" : "border-l-blue-500"} transition-all group-hover:-translate-y-0.5 group-hover:shadow-md`}
              >
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <p className="truncate text-base font-semibold group-hover:text-primary">{event.title}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{event.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.eventDate)}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-fit shrink-0">{event.goingCount} Akan Hadir</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
