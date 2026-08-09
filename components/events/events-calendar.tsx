"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type CalendarEvent = { id: string; title: string; eventDate: string };

function toKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function EventsCalendar({
  events,
  selectedDate,
  onSelectDate,
}: {
  events: CalendarEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const dayEventCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      const key = toKey(new Date(e.eventDate));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [events]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Senin = 0
  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    new Date(viewYear, viewMonth, 1)
  );
  const todayKey = toKey(today);

  function goMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{monthLabel}</h3>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" aria-label="Bulan sebelumnya" onClick={() => goMonth(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setViewYear(today.getFullYear());
              setViewMonth(today.getMonth());
            }}
          >
            Hari Ini
          </Button>
          <Button variant="outline" size="icon" aria-label="Bulan berikutnya" onClick={() => goMonth(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
          <div key={d} className="pb-1 text-[11px] font-semibold text-muted-foreground">
            {d}
          </div>
        ))}

        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = dayEventCounts.get(key) ?? 0;
          const isSelected = selectedDate === key;
          const isToday = key === todayKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : key)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-[0_4px_16px_-6px_color-mix(in_oklab,var(--primary)_60%,transparent)]"
                  : isToday
                    ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/40 hover:bg-primary/20"
                    : "hover:bg-muted"
              }`}
            >
              {day}
              {count > 0 && (
                <span
                  className={`absolute bottom-1 flex size-4 items-center justify-center rounded-full text-[9px] font-bold ${
                    isSelected ? "bg-white/25" : "bg-primary text-primary-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <p className="text-sm">
            Acara tanggal{" "}
            <span className="font-semibold">
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date(`${selectedDate}T00:00:00`))}
            </span>
          </p>
          <Button variant="ghost" size="sm" onClick={() => onSelectDate(null)}>
            <CalendarX2 className="size-4" />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
