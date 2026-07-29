import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function tomorrowRangeWIB() {
  const nowWib = new Date(Date.now() + WIB_OFFSET_MS);
  const startWib = Date.UTC(nowWib.getUTCFullYear(), nowWib.getUTCMonth(), nowWib.getUTCDate() + 1);
  const endWib = Date.UTC(nowWib.getUTCFullYear(), nowWib.getUTCMonth(), nowWib.getUTCDate() + 2);
  return {
    start: new Date(startWib - WIB_OFFSET_MS),
    end: new Date(endWib - WIB_OFFSET_MS),
  };
}

// Triggered daily by a scheduled Netlify function (see netlify/functions/event-reminders.mts).
// Sends an in-app notification to everyone who RSVP'd "Akan Hadir" for an
// event happening tomorrow (WIB), and marks each RSVP so it's only sent once.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { start, end } = tomorrowRangeWIB();

  const events = await prisma.event.findMany({
    where: { eventDate: { gte: start, lt: end } },
    include: {
      rsvps: { where: { status: "GOING", reminderSent: false } },
    },
  });

  let sent = 0;
  for (const event of events) {
    for (const rsvp of event.rsvps) {
      await notifyUser(
        rsvp.userId,
        "Pengingat Acara Besok",
        `${event.title} — besok, jangan lupa hadir!`,
        `/events/${event.id}`
      );
      sent += 1;
    }
    if (event.rsvps.length > 0) {
      await prisma.eventRSVP.updateMany({
        where: { eventId: event.id, status: "GOING", reminderSent: false },
        data: { reminderSent: true },
      });
    }
  }

  return NextResponse.json({ eventsChecked: events.length, remindersSent: sent });
}
