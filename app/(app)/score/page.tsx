import type { Metadata } from "next";
import { Trophy, Star, Users, Flame } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Warga Score" };

// Skor poin per aktivitas
const POINTS = { due: 25, event: 15, poll: 5, chat: 10 };

async function computeWargaScores() {
  const [dues, rsvps, votes, chats] = await Promise.all([
    // MonthlyDue berbasis house, bukan user → hitung per rumah
    prisma.monthlyDue.findMany({ where: { isPaid: true }, select: { houseId: true } }),
    prisma.eventRSVP.findMany({ select: { userId: true } }),
    prisma.pollVote.findMany({ select: { userId: true } }),
    prisma.groupChatMessage.findMany({ select: { authorId: true } }),
  ]);

  return { dues, rsvps, votes, chats };
}

export default async function ScorePage() {
  const session = await requireUser();
  const me = session.user;

  const users = await prisma.user.findMany({
    where: { role: "WARGA" },
    select: {
      id: true,
      name: true,
      houseId: true,
      house: { select: { blockNumber: true } },
    },
  });

  const { dues, rsvps, votes, chats } = await computeWargaScores();

  // Hitung skor per user
  const countBy = (arr: Record<string, string>[], key: string) => {
    const m = new Map<string, number>();
    for (const a of arr) {
      const id = a[key];
      if (id) m.set(id, (m.get(id) ?? 0) + 1);
    }
    return m;
  };

  // Iuran: hitung jumlah lunas per rumah (MonthlyDue berbasis houseId)
  const duePerHouse = new Map<string, number>();
  for (const d of dues as { houseId: string }[]) {
    duePerHouse.set(d.houseId, (duePerHouse.get(d.houseId) ?? 0) + 1);
  }
  // Map ke user (warga yang punya rumah itu dapat poin iuran)
  const dueCount = new Map<string, number>();
  for (const u of users) {
    if (u.houseId) dueCount.set(u.id, duePerHouse.get(u.houseId) ?? 0);
  }

  const rsvpCount = countBy(rsvps as Record<string, string>[], "userId");
  const voteCount = countBy(votes as Record<string, string>[], "userId");
  const chatCount = countBy(chats as Record<string, string>[], "authorId");

  // Map user→skor iuran via rumah (lunasi per rumah, warga di rumah itu dapat poin)
  const scores = users.map((u) => {
    const d = dueCount.get(u.id) ?? 0;
    const e = rsvpCount.get(u.id) ?? 0;
    const p = voteCount.get(u.id) ?? 0;
    const c = Math.min(10, Math.floor((chatCount.get(u.id) ?? 0) / 5));
    const total = Math.round(d * POINTS.due + e * POINTS.event + p * POINTS.poll + c);
    return { ...u, d, e, p, c, total };
  });

  scores.sort((a, b) => b.total - a.total);

  // Peringkat blok (agregasi)
  const blockMap = new Map<string, { sum: number; count: number }>();
  for (const s of scores) {
    const blk = s.house?.blockNumber?.split("-")[0] ?? "Lain";
    const cur = blockMap.get(blk) ?? { sum: 0, count: 0 };
    cur.sum += s.total;
    cur.count += 1;
    blockMap.set(blk, cur);
  }
  const blocks = [...blockMap.entries()]
    .map(([name, v]) => ({ name, avg: Math.round(v.sum / v.count), count: v.count }))
    .sort((a, b) => b.avg - a.avg);

  const myRank = scores.findIndex((s) => s.id === me.id);
  const meScore = scores.find((s) => s.id === me.id);
  const top = scores.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Warga Score 🏆</h1>
        <p className="text-sm text-muted-foreground">
          Poin aktivitas warga & peringkat antar blok — makin aktif, makin tinggi!
        </p>
      </div>

      {/* My score */}
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 to-background">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Trophy className="size-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Skor kamu</p>
              <p className="text-3xl font-bold">{myRank >= 0 ? meScore?.total ?? 0 : "—"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">
              {myRank >= 0 ? `Peringkat #${myRank + 1}` : "Belum ada skor"}
            </p>
            <p className="text-xs text-muted-foreground">
              {me.houseId ? "Warga Terdaftar" : "Warga"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-2">
        {top.map((t, i) => (
          <Card key={t.id} className={i === 0 ? "border-amber-400/50 bg-amber-500/5" : ""}>
            <CardContent className="py-4 text-center">
              <p className="text-2xl">{["🥇", "🥈", "🥉"][i]}</p>
              <p className="truncate text-sm font-semibold">{t.name?.split(" ")[0]}</p>
              <p className="text-lg font-bold text-primary">{t.total}</p>
              <p className="text-[10px] text-muted-foreground">poin</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leaderboard blok */}
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h2 className="font-semibold tracking-tight">Peringkat Blok</h2>
          </div>
          <div className="space-y-2">
            {blocks.map((b, i) => (
              <div key={b.name} className="flex items-center gap-3 rounded-lg border p-2.5">
                <span className="w-5 text-center font-bold text-muted-foreground">{i + 1}</span>
                <span className="flex-1 font-semibold">Blok {b.name}</span>
                <span className="text-sm text-muted-foreground">{b.count} warga</span>
                <span className="font-bold tabular-nums">{b.avg}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bagaimana cara dapat poin */}
      <Card>
        <CardContent className="space-y-2 py-4">
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-primary" />
            <h2 className="font-semibold tracking-tight">Cara Dapat Poin</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2">
              <Star className="size-4 text-green-600" /> Bayar kas lunas <b>+{POINTS.due}</b>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-sky-500/10 px-3 py-2">
              <Star className="size-4 text-sky-600" /> Ikut acara <b>+{POINTS.event}</b>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-2">
              <Star className="size-4 text-violet-600" /> Vote polling <b>+{POINTS.poll}</b>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2">
              <Star className="size-4 text-amber-600" /> Aktif chat (tiap 5) <b>+{POINTS.chat}</b>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
