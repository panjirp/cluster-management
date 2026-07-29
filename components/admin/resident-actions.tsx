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
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { PasswordInput } from "@/components/shared/password-input";
import { HouseCombobox } from "@/components/shared/house-combobox";
import { roleValues, roleLabels, residencyStatusValues, residencyStatusLabels } from "@/lib/validations/user";
import type { Role, ResidencyStatus } from "@/app/generated/prisma/client";

type Resident = {
  id: string;
  name: string;
  email: string;
  role: Role;
  houseId: string | null;
  phone: string | null;
  residencyStatus: ResidencyStatus | null;
};

export function ResidentActions({
  resident,
  houses,
  isSelf,
}: {
  resident: Resident;
  houses: { id: string; blockNumber: string }[];
  isSelf: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(resident.name);
  const [email, setEmail] = useState(resident.email);
  const [phone, setPhone] = useState(resident.phone ?? "");
  const [role, setRole] = useState<Role>(resident.role);
  const [houseId, setHouseId] = useState<string | null>(resident.houseId);
  const [residencyStatus, setResidencyStatus] = useState<ResidencyStatus | null>(resident.residencyStatus);
  const [password, setPassword] = useState("");

  async function handleSave() {
    setPending(true);
    const res = await fetch(`/api/residents/${resident.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone: phone || null,
        role,
        houseId,
        residencyStatus,
        ...(password ? { password } : {}),
      }),
    });
    setPending(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal menyimpan perubahan.");
      return;
    }

    toast.success("Data warga diperbarui.");
    setPassword("");
    setOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    const res = await fetch(`/api/residents/${resident.id}`, { method: "DELETE" });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal menghapus akun.");
      return;
    }

    toast.success("Akun dihapus.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="outline" size="icon-sm" aria-label="Edit" title="Edit">
              <Pencil />
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Warga</DialogTitle>
            <DialogDescription>Ubah data akun {resident.name}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`name-${resident.id}`}>Nama</Label>
              <Input id={`name-${resident.id}`} value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`email-${resident.id}`}>Email</Label>
              <Input
                id={`email-${resident.id}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`phone-${resident.id}`}>No. WhatsApp</Label>
              <Input
                id={`phone-${resident.id}`}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select items={roleLabels} value={role} onValueChange={(v) => v && setRole(v as Role)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {roleLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Rumah</Label>
              <HouseCombobox houses={houses} value={houseId} onValueChange={setHouseId} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Status Huni</Label>
              <Select
                items={residencyStatusLabels}
                value={residencyStatus}
                onValueChange={(v) => setResidencyStatus((v as ResidencyStatus) ?? null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {residencyStatusValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {residencyStatusLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`password-${resident.id}`}>Password Baru (kosongkan jika tidak diubah)</Label>
              <PasswordInput
                id={`password-${resident.id}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
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

      {!isSelf && (
        <ConfirmDeleteButton
          title={`Hapus akun ${resident.name}?`}
          description="Akun yang dihapus tidak bisa dikembalikan."
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
