"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/shared/file-upload";
import {
  directoryRoleValues,
  directoryRoleLabels,
  shiftStatusValues,
  shiftStatusLabels,
} from "@/lib/validations/directory";
import type { DirectoryMemberRow } from "@/components/directory/directory-member-card";

export function EditDirectoryMemberDialog({ member }: { member: DirectoryMemberRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [roleType, setRoleType] = useState(member.roleType);
  const [position, setPosition] = useState(member.position);
  const [fullName, setFullName] = useState(member.fullName);
  const [phone, setPhone] = useState(member.phone);
  const [photoUrl, setPhotoUrl] = useState(member.photoUrl ?? "");
  const [scheduleShift, setScheduleShift] = useState(member.scheduleShift ?? undefined);

  async function handleSave() {
    setPending(true);
    const res = await fetch(`/api/directory/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roleType,
        position,
        fullName,
        phone,
        photoUrl: photoUrl || undefined,
        scheduleShift: roleType === "SATPAM" ? (scheduleShift ?? null) : null,
      }),
    });
    setPending(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal menyimpan perubahan.");
      return;
    }

    toast.success("Data anggota diperbarui.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="icon-sm" aria-label="Edit" title="Edit">
            <Pencil />
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Anggota Direktori</DialogTitle>
          <DialogDescription>Ubah data {member.fullName}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label>Tipe</Label>
            <Select
              items={directoryRoleLabels}
              value={roleType}
              onValueChange={(v) => v && setRoleType(v as typeof roleType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {directoryRoleValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {directoryRoleLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`position-${member.id}`}>Jabatan</Label>
            <Input id={`position-${member.id}`} value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`fullName-${member.id}`}>Nama Lengkap</Label>
            <Input id={`fullName-${member.id}`} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`phone-${member.id}`}>No. WhatsApp</Label>
            <Input id={`phone-${member.id}`} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          {roleType === "SATPAM" && (
            <div className="flex flex-col gap-2">
              <Label>Shift Saat Ini</Label>
              <Select
                items={shiftStatusLabels}
                value={scheduleShift}
                onValueChange={(v) => setScheduleShift(v as typeof scheduleShift)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih shift" />
                </SelectTrigger>
                <SelectContent>
                  {shiftStatusValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {shiftStatusLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <FileUpload id={`photoUrl-${member.id}`} label="Foto" value={photoUrl} onChange={setPhotoUrl} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
