import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { AdminPosyanduTabs } from "@/components/posyandu/admin-posyandu-tabs";

export const metadata: Metadata = { title: "Posyandu | Admin" };

export default async function AdminPosyanduPage() {
  const session = await requireUser();

  if (session.user.role !== "ADMIN" && session.user.role !== "BENDAHARA") {
    redirect("/dashboard");
  }

  // Fetch semua anak (admin view)
  const children = await prisma.child.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      parent: {
        select: { id: true, name: true, house: { select: { blockNumber: true } } },
      },
      checkups: { orderBy: { date: "desc" }, take: 1 },
    },
  });

  // Fetch jadwal posyandu
  const schedules = await prisma.posyanduSchedule.findMany({
    where: { isActive: true },
    orderBy: { date: "asc" },
    include: {
      createdBy: { select: { name: true } },
      checkups: { select: { id: true } },
    },
  });

  // Fetch 20 pemeriksaan terbaru
  const recentCheckups = await prisma.childCheckup.findMany({
    orderBy: { date: "desc" },
    take: 20,
    include: {
      child: { select: { name: true, birthDate: true } },
      recordedBy: { select: { name: true } },
    },
  });

  // Serialize data untuk client component
  const serializedChildren = children.map((c) => ({
    id: c.id,
    name: c.name,
    birthDate: c.birthDate.toISOString(),
    gender: c.gender,
    isVerified: c.isVerified,
    parent: {
      name: c.parent.name,
      house: c.parent.house ? c.parent.house.blockNumber : null,
    },
  }));

  const serializedSchedules = schedules.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    time: s.time,
    location: s.location,
    notes: s.notes,
    createdBy: s.createdBy.name,
    checkupCount: s.checkups.length,
  }));

  const serializedCheckups = recentCheckups.map((c) => ({
    id: c.id,
    childId: c.childId,
    childName: c.child.name,
    date: c.date.toISOString(),
    weight: c.weight,
    height: c.height,
    headCircumference: c.headCircumference,
    nutritionalStatus: c.nutritionalStatus,
    immunizationGiven: c.immunizationGiven,
    vitaminA: c.vitaminA,
    notes: c.notes,
    recordedBy: c.recordedBy.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Posyandu Anak</h1>
        <p className="text-muted-foreground">
          Manajemen data anak, jadwal posyandu, dan pencatatan hasil pemeriksaan.
        </p>
      </div>

      <AdminPosyanduTabs
        children={serializedChildren}
        schedules={serializedSchedules}
        recentCheckups={serializedCheckups}
      />
    </div>
  );
}
