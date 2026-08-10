import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { BackLink } from "@/components/shared/back-link";
import { PollForm } from "@/components/polls/poll-form";

export const metadata: Metadata = { title: "Buat Polling" };

export default async function NewPollPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <BackLink href="/polls" label="Kembali ke Polling" />
      <div>
        <h1 className="text-2xl font-semibold">Buat Polling</h1>
        <p className="text-sm text-muted-foreground">Kumpulkan suara warga untuk keputusan bersama</p>
      </div>
      <PollForm />
    </div>
  );
}
