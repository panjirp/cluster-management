"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Trash2, Vote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type PollOption = { id: string; label: string; voteCount: number; votedByMe: boolean };
type Poll = {
  id: string;
  title: string;
  question: string;
  isMultiple: boolean;
  endsAt: string | null;
  createdAt: string;
  createdById: string;
  options: PollOption[];
};

export function PollCard({ poll, isAdmin }: { poll: Poll; isAdmin: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(poll.options.filter((o) => o.votedByMe).map((o) => o.id));
  const [busy, setBusy] = useState(false);

  const totalVotes = poll.options.reduce((s, o) => s + o.voteCount, 0);
  const ended = poll.endsAt != null && new Date(poll.endsAt) < new Date();
  const hasVoted = poll.options.some((o) => o.votedByMe);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return poll.isMultiple ? [...prev, id] : [id];
    });
  }

  async function submit() {
    if (selected.length === 0) return;
    setBusy(true);
    const res = await fetch(`/api/polls/${poll.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIds: selected }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(body.error ?? "Gagal mengirim suara.");
      return;
    }
    toast.success("Suara Anda tersimpan.");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Hapus polling ini beserta seluruh suaranya?")) return;
    setBusy(true);
    const res = await fetch(`/api/polls/${poll.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      toast.success("Polling dihapus.");
      router.refresh();
    } else {
      toast.error("Gagal menghapus polling.");
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">{poll.title}</p>
            <p className="text-sm text-muted-foreground">{poll.question}</p>
            {poll.endsAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                Berakhir{" "}
                {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(poll.endsAt))}
                {ended ? " · ditutup" : ""}
              </p>
            )}
          </div>
          {isAdmin && (
            <Button variant="ghost" size="icon-sm" onClick={remove} disabled={busy} aria-label="Hapus polling">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {poll.options.map((o) => {
            const pct = totalVotes > 0 ? Math.round((o.voteCount / totalVotes) * 100) : 0;
            const isMine = o.votedByMe;
            return (
              <button
                key={o.id}
                type="button"
                disabled={ended}
                onClick={() => toggle(o.id)}
                className={`relative w-full overflow-hidden rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  isMine ? "border-primary/60" : "hover:border-primary/40"
                } ${ended ? "cursor-default opacity-90" : ""}`}
              >
                {/* bar persentase */}
                <span
                  className={`absolute inset-y-0 left-0 ${isMine ? "bg-primary/20" : "bg-muted"}`}
                  style={{ width: `${pct}%` }}
                />
                <span className="relative flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {poll.isMultiple ? (
                      <Checkbox checked={selected.includes(o.id)} onCheckedChange={() => {}} className="pointer-events-none" />
                    ) : (
                      <span
                        className={`grid size-4 place-items-center rounded-full border ${
                          selected.includes(o.id) ? "border-primary bg-primary" : ""
                        }`}
                      >
                        {selected.includes(o.id) && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                      </span>
                    )}
                    <span className={isMine ? "font-medium" : ""}>{o.label}</span>
                    {isMine && <Check className="size-3.5 text-primary" />}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {o.voteCount} ({pct}%)
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Total {totalVotes} suara · {poll.isMultiple ? "boleh pilih lebih dari satu" : "satu pilihan"}
            {hasVoted ? " · Anda sudah memilih" : ""}
          </p>
          {!ended && (
            <Button size="sm" onClick={submit} disabled={busy || selected.length === 0}>
              <Vote className="size-4" /> {hasVoted ? "Ubah Suara" : "Kirim Suara"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
