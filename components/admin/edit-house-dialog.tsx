"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EditHouseDialog({
  houseId,
  blockNumber,
  residentName,
  contactPhone,
}: {
  houseId: string;
  blockNumber: string;
  residentName: string | null;
  contactPhone: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(residentName ?? "");
  const [phone, setPhone] = useState(contactPhone ?? "");

  async function handleSave() {
    setPending(true);
    const res = await fetch(`/api/houses/${houseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ residentName: name || null, contactPhone: phone || null }),
    });
    setPending(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal menyimpan perubahan.");
      return;
    }

    toast.success("Data rumah diperbarui.");
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Rumah</DialogTitle>
          <DialogDescription>Ubah data rumah {blockNumber}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`residentName-${houseId}`}>Nama Warga</Label>
            <Input
              id={`residentName-${houseId}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama warga yang tercatat"
            />
            <p className="text-xs text-muted-foreground">
              Ini hanya catatan nama, bukan akun login. Untuk akun, kelola lewat Data Warga.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`contactPhone-${houseId}`}>No. WhatsApp</Label>
            <Input
              id={`contactPhone-${houseId}`}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812xxxxxxx"
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
  );
}
