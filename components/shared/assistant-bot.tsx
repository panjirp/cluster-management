"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ChatMessage = {
  role: "user" | "bot";
  content: string;
};

const WELCOME: ChatMessage = {
  role: "bot",
  content:
    "Halo! 👋 Aku asisten portal Barcelona Cove.\n\nAku bisa bantu soal satpam, pengaduan, izin, acara, fasilitas, notifikasi, dan lainnya. Mau tanya apa?",
};

const QUICK_PROMPTS = [
  "Siapa satpam jaga hari ini?",
  "Cara lapor pengaduan",
  "Acara terdekat",
  "Cara pinjam fasilitas",
];

// Render minimal markdown: **bold** → <strong>
function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function AssistantBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.reply) {
        setMessages((prev) => [...prev, { role: "bot", content: body.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: "Maaf, aku lagi bermasalah. Coba lagi sebentar ya." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Maaf, aku lagi bermasalah. Coba lagi sebentar ya." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            size="icon"
            aria-label="Asisten portal"
            className="fixed right-4 bottom-20 z-40 size-12 rounded-full shadow-[0_12px_32px_-8px_color-mix(in_oklab,var(--primary)_50%,transparent)]"
          >
            {open ? <X className="size-5" /> : <Bot className="size-5" />}
          </Button>
        }
      />
      <SheetContent side="bottom" className="mx-auto flex h-[70dvh] max-h-[70dvh] max-w-lg flex-col overflow-hidden rounded-t-2xl p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <span className="grid size-8 place-items-center rounded-full bg-primary/15">
              <Bot className="size-4 text-primary" />
            </span>
            Asisten Barcelona Cove
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border bg-muted/50"
                }`}
              >
                {m.role === "bot" ? renderText(m.content) : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border bg-muted/50 px-3.5 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Mengetik…
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => send(p)}
                disabled={loading}
                className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {p}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pertanyaan…"
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
