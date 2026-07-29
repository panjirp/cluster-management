"use client";

import { useMemo, useState } from "react";
import { useQueryState } from "@/lib/use-query-state";
import { UserPlus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddResidentForm } from "@/components/admin/add-resident-form";
import { ResidentActions } from "@/components/admin/resident-actions";
import { roleLabels, residencyStatusLabels } from "@/lib/validations/user";
import type { Role, ResidencyStatus } from "@/app/generated/prisma/client";

const ALL_ROLES = "__all__";

type ResidentRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  houseId: string | null;
  houseBlock: string | null;
  phone: string | null;
  residencyStatus: ResidencyStatus | null;
};

const roleStyle: Record<Role, { badge: string; avatar: string }> = {
  WARGA: {
    badge: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400",
    avatar: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  ADMIN: {
    badge: "border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-400",
    avatar: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  },
  BENDAHARA: {
    badge: "border-transparent bg-green-500/15 text-green-700 dark:text-green-400",
    avatar: "bg-green-500/15 text-green-700 dark:text-green-400",
  },
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function ResidentsList({
  residents,
  houses,
  sessionUserId,
}: {
  residents: ResidentRow[];
  houses: { id: string; blockNumber: string }[];
  sessionUserId: string;
}) {
  const [role, setRole] = useQueryState("role", ALL_ROLES);
  const [query, setQuery] = useQueryState("q", "");
  const [addOpen, setAddOpen] = useState(false);

  const roleItems = useMemo(() => ({ [ALL_ROLES]: "Semua Role", ...roleLabels }), []);

  const filtered = residents.filter((user) => {
    if (role !== ALL_ROLES && user.role !== role) return false;
    if (query) {
      const q = query.toLowerCase();
      const haystack = `${user.name} ${user.email} ${user.houseBlock ?? ""}`.toLowerCase();
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
          placeholder="Cari nama, email, atau blok…"
          className="w-64"
        />
        <Select items={roleItems} value={role} onValueChange={(v) => v && setRole(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROLES}>Semua Role</SelectItem>
            {(Object.keys(roleLabels) as Role[]).map((value) => (
              <SelectItem key={value} value={value}>
                {roleLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} dari {residents.length} akun
        </span>

        <div className="ml-auto">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={
                <Button>
                  <UserPlus data-icon="inline-start" />
                  Tambah Akun
                </Button>
              }
            />
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Akun</DialogTitle>
                <DialogDescription>Buat akun warga, admin, atau bendahara baru.</DialogDescription>
              </DialogHeader>
              <AddResidentForm houses={houses} onSuccess={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-muted-foreground">
          <SearchX className="size-8" />
          <p className="text-sm">Tidak ada akun yang cocok dengan pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center gap-3">
                <div
                  className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${roleStyle[user.role].avatar}`}
                >
                  {initials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{user.name}</p>
                    {user.houseBlock && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {user.houseBlock}
                      </Badge>
                    )}
                    {user.residencyStatus && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {residencyStatusLabels[user.residencyStatus]}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge variant="outline" className={roleStyle[user.role].badge}>
                    {roleLabels[user.role]}
                  </Badge>
                  <ResidentActions
                    resident={{
                      id: user.id,
                      name: user.name,
                      role: user.role,
                      houseId: user.houseId,
                      phone: user.phone,
                      residencyStatus: user.residencyStatus,
                    }}
                    houses={houses}
                    isSelf={user.id === sessionUserId}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
