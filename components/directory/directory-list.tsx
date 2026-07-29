"use client";

import { useMemo, useState } from "react";
import { useQueryState } from "@/lib/use-query-state";
import { UserPlus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddDirectoryMemberForm } from "@/components/directory/add-directory-member-form";
import { DirectoryMemberCard, type DirectoryMemberRow } from "@/components/directory/directory-member-card";
import { directoryRoleLabels } from "@/lib/validations/directory";

const ALL_TYPES = "__all__";

export function DirectoryList({ members, canManage }: { members: DirectoryMemberRow[]; canManage: boolean }) {
  const [type, setType] = useQueryState("type", ALL_TYPES);
  const [query, setQuery] = useQueryState("q", "");
  const [addOpen, setAddOpen] = useState(false);

  const typeItems = useMemo(() => ({ [ALL_TYPES]: "Semua", ...directoryRoleLabels }), []);

  const filtered = members.filter((member) => {
    if (type !== ALL_TYPES && member.roleType !== type) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!`${member.fullName} ${member.position}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const pengurus = filtered.filter((m) => m.roleType === "PENGURUS");
  const satpam = filtered.filter((m) => m.roleType === "SATPAM");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama atau jabatan…"
          className="w-64"
        />
        <Select items={typeItems} value={type} onValueChange={(v) => v && setType(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TYPES}>Semua</SelectItem>
            <SelectItem value="PENGURUS">Pengurus</SelectItem>
            <SelectItem value="SATPAM">Satpam</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} dari {members.length} anggota
        </span>

        {canManage && (
          <div className="ml-auto">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger
                render={
                  <Button>
                    <UserPlus data-icon="inline-start" />
                    Tambah Anggota
                  </Button>
                }
              />
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Tambah Anggota Direktori</DialogTitle>
                  <DialogDescription>Daftarkan pengurus atau satpam baru.</DialogDescription>
                </DialogHeader>
                <AddDirectoryMemberForm onSuccess={() => setAddOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-muted-foreground">
          <SearchX className="size-8" />
          <p className="text-sm">Tidak ada anggota yang cocok dengan pencarian.</p>
        </div>
      ) : (
        <>
          {pengurus.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-medium">Pengurus</h2>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {pengurus.map((m) => (
                  <DirectoryMemberCard key={m.id} member={m} canManage={canManage} />
                ))}
              </div>
            </div>
          )}
          {satpam.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-medium">Satpam</h2>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {satpam.map((m) => (
                  <DirectoryMemberCard key={m.id} member={m} canManage={canManage} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
