"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function PollForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [isMultiple, setIsMultiple] = useState(false);
  const [endsAt, setEndsAt] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (title.trim().length < 5 || question.trim().length < 5) {
      toast.error("Judul dan pertanyaan minimal 5 karakter.");
      return;
    }
    if (cleanOptions.length < 2) {
      toast.error("Minimal 2 pilihan jawaban.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        question: question.trim(),
        isMultiple,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        options: cleanOptions,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(body.error ?? "Gagal membuat polling.");
      return;
    }
    toast.success("Polling dibuat.");
    router.push("/polls");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="poll-title">Judul</Label>
        <Input id="poll-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Pemasangan CCTV Tambahan" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="poll-question">Pertanyaan</Label>
        <Textarea id="poll-question" rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Apakah warga setuju...?" />
      </div>
      <div className="space-y-2">
        <Label>Pilihan Jawaban</Label>
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={opt}
              onChange={(e) => setOptions(options.map((o, j) => (j === i ? e.target.value : o)))}
              placeholder={`Pilihan ${i + 1}`}
            />
            {options.length > 2 && (
              <Button variant="ghost" size="icon-sm" onClick={() => setOptions(options.filter((_, j) => j !== i))} aria-label="Hapus pilihan">
                <X className="size-4" />
              </Button>
            )}
          </div>
        ))}
        {options.length < 8 && (
          <Button variant="outline" size="sm" onClick={() => setOptions([...options, ""])}>
            <Plus className="size-4" /> Tambah Pilihan
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="poll-multiple" checked={isMultiple} onCheckedChange={(v) => setIsMultiple(v === true)} />
        <Label htmlFor="poll-multiple" className="font-normal">Boleh pilih lebih dari satu</Label>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="poll-ends">Tenggat (opsional)</Label>
        <Input id="poll-ends" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
      </div>
      <Button onClick={submit} disabled={busy}>
        {busy ? "Membuat..." : "Buat Polling"}
      </Button>
    </div>
  );
}
