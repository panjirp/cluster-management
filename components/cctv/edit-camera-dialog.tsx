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
import { cameraStreamTypeValues, cameraStreamTypeLabels } from "@/lib/validations/camera";
import type { CameraRow } from "@/components/cctv/camera-card";

export function EditCameraDialog({ camera }: { camera: CameraRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(camera.name);
  const [location, setLocation] = useState(camera.location ?? "");
  const [streamUrl, setStreamUrl] = useState(camera.streamUrl);
  const [streamType, setStreamType] = useState(camera.streamType);

  async function handleSave() {
    setPending(true);
    const res = await fetch(`/api/cameras/${camera.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, location: location || null, streamUrl, streamType }),
    });
    setPending(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(typeof body?.error === "string" ? body.error : "Gagal menyimpan perubahan.");
      return;
    }

    toast.success("Kamera diperbarui.");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Kamera</DialogTitle>
          <DialogDescription>Ubah data kamera {camera.name}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`name-${camera.id}`}>Nama Kamera</Label>
            <Input id={`name-${camera.id}`} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`location-${camera.id}`}>Lokasi</Label>
            <Input id={`location-${camera.id}`} value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tipe Sumber</Label>
            <Select
              items={cameraStreamTypeLabels}
              value={streamType}
              onValueChange={(v) => v && setStreamType(v as typeof streamType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cameraStreamTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {cameraStreamTypeLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`streamUrl-${camera.id}`}>URL Stream</Label>
            <Input id={`streamUrl-${camera.id}`} value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} />
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
