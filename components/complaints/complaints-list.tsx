"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MessageSquareWarning, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { ComplaintStatusBadge } from "@/components/complaints/complaint-status-badge";
import { complaintCategoryLabels, complaintStatusValues, complaintStatusLabels } from "@/lib/validations/complaint";
import { useQueryState } from "@/lib/use-query-state";
import type { ComplaintStatus } from "@/app/generated/prisma/client";

const ALL_STATUS = "__all__";
const PAGE_SIZE = 10;

const statusAccent: Record<ComplaintStatus, string> = {
  OPEN: "border-l-amber-500",
  IN_PROGRESS: "border-l-blue-500",
  RESOLVED: "border-l-green-600",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(date));
}

export type ComplaintRow = {
  id: string;
  title: string;
  description: string;
  category: keyof typeof complaintCategoryLabels;
  status: ComplaintStatus;
  createdAt: string;
  createdByName: string;
  createdByBlock: string | null;
};

export function ComplaintsList({
  complaints,
  isWarga,
  canManage,
}: {
  complaints: ComplaintRow[];
  isWarga: boolean;
  canManage?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useQueryState("status", ALL_STATUS);
  const [query, setQuery] = useQueryState("q", "");
  const [pageStr, setPageStr] = useQueryState("page", "1");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const page = Math.max(1, Number(pageStr) || 1);

  const statusItems = useMemo(() => ({ [ALL_STATUS]: "Semua Status", ...complaintStatusLabels }), []);

  const filtered = complaints.filter((c) => {
    if (status !== ALL_STATUS && c.status !== status) return false;
    if (query) {
      const q = query.toLowerCase();
      const haystack = `${c.title} ${c.description} ${c.createdByName} ${c.createdByBlock ?? ""}`.toLowerCase();
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
  }, [status, query]);

  const selectableIds = paginated.filter((c) => c.status !== "RESOLVED").map((c) => c.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleSelectAll(checked: boolean) {
    setSelected(checked ? new Set(selectableIds) : new Set());
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function bulkResolve() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    setBulkPending(true);
    const results = await Promise.all(
      ids.map((id) =>
        fetch(`/api/complaints/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "RESOLVED" }),
        }).then((res) => res.ok)
      )
    );
    setBulkPending(false);

    const failedCount = results.filter((ok) => !ok).length;
    if (failedCount > 0) {
      toast.error(`Gagal menandai ${failedCount} dari ${ids.length} pengaduan.`);
    } else {
      toast.success(`${ids.length} pengaduan ditandai selesai.`);
    }
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {canManage && selectableIds.length > 0 && (
          <Checkbox
            checked={allSelected}
            indeterminate={selected.size > 0 && !allSelected}
            onCheckedChange={(checked) => toggleSelectAll(checked === true)}
            aria-label="Pilih semua yang belum selesai"
          />
        )}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari judul, deskripsi, atau nama warga…"
          className="w-64"
        />
        <Select items={statusItems} value={status} onValueChange={(v) => v && setStatus(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS}>Semua Status</SelectItem>
            {complaintStatusValues.map((value) => (
              <SelectItem key={value} value={value}>
                {complaintStatusLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} dari {complaints.length} pengaduan
        </span>

        {canManage && selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm">
            <span>{selected.size} dipilih</span>
            <Button size="sm" disabled={bulkPending} onClick={bulkResolve}>
              {bulkPending ? "Memproses..." : "Tandai Selesai"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Batal
            </Button>
          </div>
        )}
      </div>

      {complaints.length === 0 ? (
        <EmptyState
          icon={MessageSquareWarning}
          title="Belum ada pengaduan"
          description={
            isWarga
              ? "Laporkan kerusakan fasilitas atau gangguan ketertiban di sini."
              : "Belum ada warga yang mengajukan pengaduan."
          }
          action={isWarga ? <Button size="sm" render={<Link href="/complaints/new">Buat Pengaduan</Link>} /> : undefined}
        />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-muted-foreground">
          <SearchX className="size-8" />
          <p className="text-sm">Tidak ada pengaduan yang cocok dengan pencarian.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginated.map((complaint) => (
            <Card
              key={complaint.id}
              className={`border-l-4 ${statusAccent[complaint.status]} transition-all hover:-translate-y-0.5 hover:shadow-md`}
            >
              <CardContent className="flex items-center gap-4">
                {canManage && complaint.status !== "RESOLVED" && (
                  <Checkbox
                    checked={selected.has(complaint.id)}
                    onCheckedChange={(checked) => toggleSelect(complaint.id, checked === true)}
                    aria-label={`Pilih ${complaint.title}`}
                  />
                )}
                <Link href={`/complaints/${complaint.id}`} className="group min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate text-base font-semibold group-hover:text-primary">{complaint.title}</p>
                      <p className="line-clamp-1 text-sm text-muted-foreground">{complaint.description}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{complaintCategoryLabels[complaint.category]}</Badge>
                        <span>{formatDate(complaint.createdAt)}</span>
                        {!isWarga && (
                          <span>
                            · {complaint.createdByName}
                            {complaint.createdByBlock ? ` (${complaint.createdByBlock})` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <ComplaintStatusBadge status={complaint.status} />
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={(p) => setPageStr(p.toString())} />
    </div>
  );
}
