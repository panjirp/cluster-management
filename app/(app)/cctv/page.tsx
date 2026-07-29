import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { CameraList } from "@/components/cctv/camera-list";
import type { CameraRow } from "@/components/cctv/camera-card";

export const metadata: Metadata = { title: "CCTV" };

export default async function CctvPage() {
  const session = await requireUser();
  const cameras = await prisma.camera.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  const rows: CameraRow[] = cameras.map((c) => ({
    id: c.id,
    name: c.name,
    location: c.location,
    streamUrl: c.streamUrl,
    streamType: c.streamType,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">CCTV</h1>
        <p className="text-sm text-muted-foreground">Pantau kamera keamanan cluster Barcelona Cove</p>
      </div>

      <CameraList cameras={rows} canManage={session.user.role === "ADMIN"} />
    </div>
  );
}
