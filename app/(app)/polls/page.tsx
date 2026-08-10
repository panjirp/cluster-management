import type { Metadata } from "next";
import { Plus, Vote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PollCard } from "@/components/polls/poll-card";

export const metadata: Metadata = { title: "Polling Warga" };

export default async function PollsPage() {
  const session = await requireUser();
  const isAdmin = session.user.role === "ADMIN";

  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      options: {
        orderBy: { sort: "asc" },
        include: { votes: { select: { id: true, userId: true } } },
      },
    },
  });

  const serialized = polls.map((p) => ({
    id: p.id,
    title: p.title,
    question: p.question,
    isMultiple: p.isMultiple,
    endsAt: p.endsAt ? p.endsAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    createdById: p.createdById,
    options: p.options.map((o) => ({
      id: o.id,
      label: o.label,
      voteCount: o.votes.length,
      votedByMe: o.votes.some((v) => v.userId === session.user.id),
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Polling Warga</h1>
          <p className="text-sm text-muted-foreground">
            Suara bersama untuk keputusan cluster
          </p>
        </div>
        {isAdmin && (
          <Badge variant="secondary">
            <Plus className="mr-1 size-3" /> Admin dapat membuat poll via API
          </Badge>
        )}
      </div>

      {serialized.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/20">
              <Vote className="size-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Belum ada polling. Pengurus akan membuat polling saat ada keputusan bersama.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {serialized.map((p) => (
            <PollCard key={p.id} poll={p} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}
