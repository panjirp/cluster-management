"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  houseId: string | null;
  house: { id: string; blockNumber: string } | null;
  author: {
    id: string;
    name: string;
    role: string;
    house: { blockNumber: string } | null;
  };
};

// Tanggal & jam pesan: "14:32" (hari ini), "Kemarin 14:32", atau "9 Agu, 14:32".
function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (diffDays <= 0) return time;
  if (diffDays === 1) return `Kemarin ${time}`;
  const day = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(date);
  return `${day}, ${time}`;
}

function roleLabel(role: string) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "BENDAHARA":
      return "Bendahara";
    default:
      return "Warga";
  }
}

function roleColor(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-purple-500/15 text-purple-600 dark:text-purple-400";
    case "BENDAHARA":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
    default:
      return "bg-green-500/15 text-green-600 dark:text-green-400";
  }
}

export default function GroupChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesRef = useRef<HTMLDivElement>(null);
  const prevLastIdRef = useRef<string | null>(null);

  // Fetch messages
  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/group-chat");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
    let id: ReturnType<typeof setInterval> | null = setInterval(loadMessages, 5000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (id) {
          clearInterval(id);
          id = null;
        }
      } else {
        loadMessages();
        if (!id) {
          id = setInterval(loadMessages, 5000);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (id) clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadMessages]);

  // Scroll ke bawah hanya di dalam kotak chat, hanya saat pesan baru tiba
  // (tidak menycroll seluruh halaman dan tidak mengganggu saat polling).
  useEffect(() => {
    const container = messagesRef.current;
    if (!container || messages.length === 0) return;

    const lastId = messages[messages.length - 1]?.id ?? null;
    const isFirstLoad = prevLastIdRef.current === null;
    const hasNewMessage = lastId !== prevLastIdRef.current;
    prevLastIdRef.current = lastId;

    if (!isFirstLoad && !hasNewMessage) return;

    // Jika user sedang membaca pesan lama (scroll ke atas), jangan paksa turun.
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 160;
    if (!isFirstLoad && !nearBottom) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: isFirstLoad ? "auto" : "smooth",
    });
  }, [messages]);

  // Send message
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/group-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setContent("");
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px] rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <svg
          className="size-5 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h2 className="text-base font-semibold">Grup Chat Warga</h2>
      </div>

      {/* Messages area */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Memuat pesan…
          </p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada pesan. Mulai percakapan!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="flex gap-2.5 items-start"
            >
              {/* Avatar initial */}
              <div className="size-8 shrink-0 rounded-full bg-primary/15 grid place-items-center text-xs font-semibold text-primary">
                {msg.author.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium">{msg.author.name}</span>
                  {(msg.author.house || msg.house) && (
                    <span className="text-xs text-muted-foreground">
                      • Blok {msg.author.house?.blockNumber ?? msg.house?.blockNumber}
                    </span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${roleColor(msg.author.role)}`}>
                    {roleLabel(msg.author.role)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDateTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words mt-0.5">
                  {msg.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 px-4 py-3 border-t"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ketik pesan…"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring transition-colors"
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? "…" : "Kirim"}
          </button>
        </div>
      </form>
    </div>
  );
}
