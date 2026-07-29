"use client";

import { useEffect, useMemo } from "react";
import { SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { useQueryState } from "@/lib/use-query-state";

const PAGE_SIZE = 20;

const ALL_TIME = "__all__";
const TODAY = "today";
const THIS_WEEK = "this_week";
const THIS_MONTH = "this_month";

const rangeItems = {
  [ALL_TIME]: "Semua Waktu",
  [TODAY]: "Hari Ini",
  [THIS_WEEK]: "7 Hari Terakhir",
  [THIS_MONTH]: "Bulan Ini",
};

const ALL_ACTIONS = "__all__";

const actionLabels: Record<string, string> = {
  UPDATE_COMPLAINT_STATUS: "Pengaduan",
  UPDATE_PERMIT_STATUS: "Perizinan",
  DELETE_RESIDENT: "Warga",
  DELETE_HOUSE: "Rumah",
};

function isInRange(date: Date, range: string) {
  const now = new Date();
  if (range === ALL_TIME) return true;
  if (range === TODAY) {
    return date.toDateString() === now.toDateString();
  }
  if (range === THIS_WEEK) {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    return date >= cutoff;
  }
  if (range === THIS_MONTH) {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  return true;
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export type ActivityLogRow = {
  id: string;
  actorName: string;
  action: string;
  description: string;
  createdAt: string;
};

export function ActivityLogList({ logs }: { logs: ActivityLogRow[] }) {
  const [query, setQuery] = useQueryState("q", "");
  const [action, setAction] = useQueryState("action", ALL_ACTIONS);
  const [range, setRange] = useQueryState("range", ALL_TIME);
  const [pageStr, setPageStr] = useQueryState("page", "1");
  const page = Math.max(1, Number(pageStr) || 1);

  const actionsPresent = useMemo(() => Array.from(new Set(logs.map((l) => l.action))), [logs]);
  const actionItems = useMemo(
    () => ({
      [ALL_ACTIONS]: "Semua Aksi",
      ...Object.fromEntries(actionsPresent.map((a) => [a, actionLabels[a] ?? a])),
    }),
    [actionsPresent]
  );

  const filtered = logs.filter((log) => {
    if (action !== ALL_ACTIONS && log.action !== action) return false;
    if (!isInRange(new Date(log.createdAt), range)) return false;
    if (query) {
      const q = query.toLowerCase();
      const haystack = `${log.actorName} ${log.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (page !== 1) setPageStr("1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, action, range]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama admin atau deskripsi…"
          className="w-64"
        />
        <Select items={actionItems} value={action} onValueChange={(v) => v && setAction(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(actionItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select items={rangeItems} value={range} onValueChange={(v) => v && setRange(v)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(rangeItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} dari {logs.length} aktivitas
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-muted-foreground">
          <SearchX className="size-8" />
          <p className="text-sm">Tidak ada aktivitas yang cocok dengan pencarian.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((log) => (
              <Card key={log.id}>
                <CardContent className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm">
                      <span className="font-medium">{log.actorName}</span> — {log.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {actionLabels[log.action] ?? log.action} · {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Pagination page={currentPage} totalPages={totalPages} onPageChange={(p) => setPageStr(p.toString())} />
        </>
      )}
    </div>
  );
}
