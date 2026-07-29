"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { EditCameraDialog } from "@/components/cctv/edit-camera-dialog";
import { CameraPlayer } from "@/components/cctv/camera-player";

export type CameraRow = {
  id: string;
  name: string;
  location: string | null;
  streamUrl: string;
  streamType: "IFRAME" | "HLS";
};

export function CameraCard({ camera, canManage }: { camera: CameraRow; canManage: boolean }) {
  const router = useRouter();

  async function handleDelete() {
    const res = await fetch(`/api/cameras/${camera.id}`, { method: "DELETE" });

    if (!res.ok) {
      toast.error("Gagal menghapus kamera.");
      return;
    }

    toast.success("Kamera dihapus.");
    router.refresh();
  }

  return (
    <Card className="overflow-hidden py-0">
      <div className="aspect-video w-full bg-black">
        <CameraPlayer streamUrl={camera.streamUrl} streamType={camera.streamType} name={camera.name} />
      </div>
      <CardContent className="flex items-center gap-2 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{camera.name}</p>
          {camera.location && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              {camera.location}
            </p>
          )}
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            <EditCameraDialog camera={camera} />
            <ConfirmDeleteButton
              title={`Hapus kamera ${camera.name}?`}
              description="Kamera ini akan dihapus dari daftar CCTV."
              onConfirm={handleDelete}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
