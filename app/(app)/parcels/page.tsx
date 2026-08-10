import Link from "next/link";
import type { Metadata } from "next";
import { Package, PackageCheck, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PickUpButton } from "@/components/parcels/pick-up-button";

export const metadata: Metadata = { title: "Titip Paket" };

export default async function ParcelsPage() {
  const session = await requireUser();
  const isAdmin = session.user.role === "ADMIN";

  const parcels = await prisma.parcel.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { residentId: session.user.id },
            ...(session.user.houseId ? [{ houseId: session.user.houseId }] : []),
          ],
        },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { house: { select: { blockNumber: true } } },
  });

  const waiting = parcels.filter((p) => p.status === "WAITING");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Titip Paket</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Paket yang dititipkan di pos satpam"
              : "Paket Anda yang dititipkan di pos satpam"}
          </p>
        </div>
        {isAdmin && (
          <Button render={<Link href="/parcels/new">
            <Plus className="size-4" /> Catat Paket Masuk
          </Link>} />
        )}
      </div>

      {parcels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/20">
              <Package className="size-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Belum ada paket tercatat. Catat paket yang tiba di pos satpam."
                : "Belum ada paket untuk Anda. Jika ada paket di pos satpam, Anda akan diberi tahu di sini."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {waiting.length > 0 && !isAdmin && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="flex items-center gap-3 py-3">
                <Package className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm">
                  <span className="font-semibold">{waiting.length} paket</span> menunggu diambil di pos satpam
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {parcels.map((p) => (
              <Card key={p.id} className={p.status === "WAITING" ? "border-primary/30" : ""}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {p.house?.blockNumber ?? "Rumah tidak diketahui"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Kurir: {p.courierName}
                        {p.senderName ? ` · Dari: ${p.senderName}` : ""}
                      </p>
                    </div>
                    {p.status === "WAITING" ? (
                      <Badge variant="default">Menunggu</Badge>
                    ) : (
                      <Badge variant="secondary">
                        <PackageCheck className="mr-1 size-3" /> Diambil
                      </Badge>
                    )}
                  </div>

                  {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}

                  {p.photoUrl && (
                    <a href={p.photoUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.photoUrl}
                        alt="Foto paket"
                        className="h-32 w-full rounded-lg border object-cover"
                      />
                    </a>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Dicatat{" "}
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(p.createdAt)}
                    {p.pickedUpAt
                      ? ` · Diambil ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(p.pickedUpAt)}`
                      : ""}
                  </p>

                  {p.status === "WAITING" && <PickUpButton parcelId={p.id} />}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
