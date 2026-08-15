"use client";

import { useState, useCallback, useEffect } from "react";
import { MessageSquare, Send, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Thread = { other: { id: string; name: string; house: string | null }; last: string; unread: number };
type Msg = { id: string; senderId: string; sender: { id: string; name: string }; content: string; createdAt: string; read: boolean };

export function DmInbox({ currentUserId }: { currentUserId: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/dm");
      if (res.ok) setThreads(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
    const id = setInterval(loadThreads, 15000);
    return () => clearInterval(id);
  }, [loadThreads]);

  const openThread = useCallback(async (t: Thread) => {
    setActive(t);
    try {
      await fetch(`/api/dm/${t.other.id}`, { method: "PATCH" });
      const res = await fetch(`/api/dm/${t.other.id}`);
      if (res.ok) setMessages(await res.json());
      loadThreads();
    } catch {
      // silent
    }
  }, [loadThreads]);

  async function send() {
    if (!active || !draft.trim()) return;
    try {
      const res = await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: active.other.id, content: draft.trim() }),
      });
      if (res.ok) {
        const m = await res.json();
        setMessages((prev) => [...prev, m]);
        setDraft("");
      }
    } catch {
      toast.error("Gagal mengirim pesan.");
    }
  }

  return (
    <div className="space-y-4">
      {!active ? (
        <>
          <div>
            <h2 className="text-lg font-semibold">Pesan Antar Warga</h2>
            <p className="text-sm text-muted-foreground">Pilih percakapan untuk mulai chatting.</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
          ) : threads.length === 0 ? (
            <Card><CardContent className="py-14 text-center">
              <MessageSquare className="mx-auto mb-2 size-8 text-muted-foreground" />
              <p className="font-semibold">Belum ada percakapan</p>
              <p className="text-sm text-muted-foreground">Mulai chat dari halaman warga atau Jual Beli.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {threads.map((t) => (
                <button key={t.other.id} onClick={() => openThread(t)} className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/40">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    {t.other.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.other.name}{t.other.house ? ` · ${t.other.house}` : ""}</p>
                    <p className="truncate text-sm text-muted-foreground">{t.last}</p>
                  </div>
                  {t.unread > 0 && (
                    <span className="grid size-5 place-items-center rounded-full bg-red-500 text-[11px] font-bold text-white">{t.unread}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button onClick={() => setActive(null)} className="grid size-8 place-items-center rounded-lg border text-muted-foreground hover:bg-muted" aria-label="Kembali">
              <ArrowLeft className="size-4" />
            </button>
            <p className="font-semibold">{active.other.name}{active.other.house ? ` · ${active.other.house}` : ""}</p>
          </div>
          <Card className="flex h-[60vh] flex-col">
            <CardContent className="flex-1 space-y-3 overflow-y-auto py-4">
              {messages.map((m) => (
                <div key={m.id} className={m.senderId === currentUserId ? "flex justify-end" : "flex justify-start"}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.senderId === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="flex gap-2 border-t p-3">
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ketik pesan..." />
              <Button size="icon" onClick={send} aria-label="Kirim"><Send className="size-4" /></Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
