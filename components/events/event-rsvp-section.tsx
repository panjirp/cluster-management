"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type RsvpStatus = "GOING" | "NOT_GOING";

export type GoingAttendee = { userId: string; displayName: string };

export function EventRsvpSection({
  eventId,
  initialStatus,
  initialGoing,
  myUserId,
  myDisplayName,
}: {
  eventId: string;
  initialStatus: RsvpStatus | null;
  initialGoing: GoingAttendee[];
  myUserId: string;
  myDisplayName: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [going, setGoing] = useState(initialGoing);
  const [submitting, setSubmitting] = useState(false);

  async function rsvp(next: RsvpStatus) {
    const previousStatus = status;
    const previousGoing = going;

    setSubmitting(true);
    setStatus(next);
    setGoing((prev) => {
      const withoutMe = prev.filter((a) => a.userId !== myUserId);
      return next === "GOING" ? [...withoutMe, { userId: myUserId, displayName: myDisplayName }] : withoutMe;
    });

    const res = await fetch(`/api/events/${eventId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSubmitting(false);

    if (!res.ok) {
      setStatus(previousStatus);
      setGoing(previousGoing);
      toast.error("Gagal mengirim RSVP.");
      return;
    }

    toast.success(next === "GOING" ? "Anda akan hadir." : "Anda tidak hadir.");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={status === "GOING" ? "default" : "outline"}
          size="sm"
          disabled={submitting}
          onClick={() => rsvp("GOING")}
        >
          Akan Hadir
        </Button>
        <Button
          variant={status === "NOT_GOING" ? "default" : "outline"}
          size="sm"
          disabled={submitting}
          onClick={() => rsvp("NOT_GOING")}
        >
          Tidak Hadir
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{going.length} Warga Akan Hadir</p>
        {going.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada yang konfirmasi hadir.</p>
        ) : (
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {going.map((a) => (
              <li key={a.userId}>{a.displayName}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
