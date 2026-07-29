// Netlify Scheduled Function — triggered daily per the cron schedule in
// netlify.toml. Just pings our own Next.js API route (where the actual
// Prisma/notification logic lives) with the shared secret so the route can
// be safely called without a logged-in user session.
export default async () => {
  const secret = process.env.CRON_SECRET;
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;

  if (!secret || !siteUrl) {
    console.error("event-reminders: missing CRON_SECRET or site URL env var");
    return new Response("Missing configuration", { status: 500 });
  }

  const res = await fetch(`${siteUrl}/api/cron/event-reminders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });

  const body = await res.text();
  console.log("event-reminders result:", res.status, body);

  return new Response(body, { status: res.status });
};

export const config = {
  schedule: "0 2 * * *", // 02:00 UTC = 09:00 WIB, daily
};
