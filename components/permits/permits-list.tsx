"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FileCheck2, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { PermitStatusBadge } from "@/components/permits/permit-status-badge";
import { permitTypeLabels, permitStatusValues, permitStatusLabels } from "@/lib/validations/permit";
import { useQueryState } from "@/lib/use-query-state";
import type { PermitStatus } from "@/app/generated/prisma/client";

const ALL_STATUS = "__all__";

const statusAccent: Record<PermitStatus, string> = {
  PENDING: "border-l-amber-500",
  APPROVED: "border-l-green-600",
  REJECTED: "border-l-red-500",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(date));
}

export type PermitRow = {
  id: string;
  title: string;
  description: string;
  type: keyof typeof permitTypeLabels;
  status: PermitStatus;
  createdAt: string;
  createdByName: string;
  createdByBlock: string | null;
};

export function PermitsList({ permits, isWarga }: { permits: PermitRow[]; isWarga: boolean }) {
  const [status, setStatus] = useQueryState("status", ALL_STATUS);
  const [query, setQuery] = useQueryState("q", "");

  const statusItems = useMemo(() => ({ [ALL_STATUS]: "Semua Status", ...permitStatusLabels }), []);

  const filtered = permits.filter((p) => {
    if (status !== ALL_STATUS && p.status !== status) return false;
    if (query) {
      const q = query.toLowerCase();
      const haystack = `${p.title} ${p.description} ${p.createdByName} ${p.createdByBlock ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
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
            {permitStatusValues.map((value) => (
              <SelectItem key={value} value={value}>
                {permitStatusLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} dari {permits.length} permohonan
        </span>
      </div>

      {permits.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="Belum ada permohonan izin"
          description={
            isWarga
              ? "Ajukan izin renovasi, kegiatan, atau surat pengantar di sini."
              : "Belum ada warga yang mengajukan izin."
          }
          action={isWarga ? <Button size="sm" render={<Link href="/permits/new">Ajukan Izin</Link>} /> : undefined}
        />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-muted-foreground">
          <SearchX className="size-8" />
          <p className="text-sm">Tidak ada permohonan yang cocok dengan pencarian.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((permit) => (
            <Link key={permit.id} href={`/permits/${permit.id}`} className="group block">
              <Card
                className={`border-l-4 ${statusAccent[permit.status]} transition-all group-hover:-translate-y-0.5 group-hover:shadow-md`}
              >
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1.5">
                    <p className="truncate text-base font-semibold group-hover:text-primary">{permit.title}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{permit.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{permitTypeLabels[permit.type]}</Badge>
                      <span>{formatDate(permit.createdAt)}</span>
                      {!isWarga && (
                        <span>
                          · {permit.createdByName}
                          {permit.createdByBlock ? ` (${permit.createdByBlock})` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <PermitStatusBadge status={permit.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
