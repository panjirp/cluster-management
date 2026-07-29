"use client";

import { useState } from "react";
import { Video, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddCameraForm } from "@/components/cctv/add-camera-form";
import { CameraCard, type CameraRow } from "@/components/cctv/camera-card";

export function CameraList({ cameras, canManage }: { cameras: CameraRow[]; canManage: boolean }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Video data-icon="inline-start" />
                  Tambah Kamera
                </Button>
              }
            />
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Kamera CCTV</DialogTitle>
                <DialogDescription>
                  Daftarkan kamera baru dengan link stream dari aplikasi/cloud kamera atau URL HLS langsung.
                </DialogDescription>
              </DialogHeader>
              <AddCameraForm onSuccess={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {cameras.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-muted-foreground">
          <CameraOff className="size-8" />
          <p className="text-sm">Belum ada kamera CCTV yang terdaftar.</p>
          {canManage && <p className="text-xs">Klik "Tambah Kamera" untuk mulai menambahkan.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cameras.map((camera) => (
            <CameraCard key={camera.id} camera={camera} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  );
}
