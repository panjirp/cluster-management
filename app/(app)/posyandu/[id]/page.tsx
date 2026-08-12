import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Detail Anak — Posyandu" };

// ── Helpers ──

function formatGender(gender: string): string {
  return gender === "LAKI_LAKI" ? "Laki-laki" : "Perempuan";
}

function calcAgeMonths(birthDate: Date): number {
  const now = new Date();
  const birth = new Date(birthDate);
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function calcAgeString(birthDate: Date): string {
  const months = calcAgeMonths(birthDate);
  if (months < 1) {
    const days = Math.floor(
      (new Date().getTime() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${days} hari`;
  }
  if (months < 24) return `${months} bulan`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} tahun ${rem} bulan` : `${years} tahun`;
}

function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(d));
}

type ImmunizationItem = {
  vaccine: string;
  dueAgeMonths: number;
};

const IMMUNIZATION_SCHEDULE: ImmunizationItem[] = [
  { vaccine: "HB0", dueAgeMonths: 0 },
  { vaccine: "BCG", dueAgeMonths: 1 },
  { vaccine: "Polio 1", dueAgeMonths: 1 },
  { vaccine: "DPT-HB-Hib 1", dueAgeMonths: 2 },
  { vaccine: "Polio 2", dueAgeMonths: 2 },
  { vaccine: "PCV 1", dueAgeMonths: 2 },
  { vaccine: "DPT-HB-Hib 2", dueAgeMonths: 3 },
  { vaccine: "Polio 3", dueAgeMonths: 3 },
  { vaccine: "PCV 2", dueAgeMonths: 3 },
  { vaccine: "DPT-HB-Hib 3", dueAgeMonths: 4 },
  { vaccine: "Polio 4", dueAgeMonths: 4 },
  { vaccine: "IPV", dueAgeMonths: 4 },
  { vaccine: "Campak/MR", dueAgeMonths: 9 },
  { vaccine: "JE", dueAgeMonths: 9 },
  { vaccine: "PCV 3", dueAgeMonths: 12 },
  { vaccine: "DPT-HB-Hib booster", dueAgeMonths: 18 },
  { vaccine: "Campak/MR booster", dueAgeMonths: 18 },
];

function getImmunizationStatus(
  ageMonths: number,
  received: string[]
): { vaccine: string; dueAgeMonths: number; received: boolean; isDue: boolean }[] {
  return IMMUNIZATION_SCHEDULE.map((item) => {
    const isDue = ageMonths >= item.dueAgeMonths;
    const receivedVaccine = received.some(
      (r) =>
        r === item.vaccine ||
        r === item.vaccine.replace(/ /g, "_") ||
        r.replace(/ booster$/, "_BOOSTER").replace(/ /g, "_") === item.vaccine.replace(/ /g, "_")
    );
    return { ...item, received: receivedVaccine, isDue };
  });
}

function formatNutritionalStatus(s: string | null | undefined): string {
  if (!s) return "—";
  const map: Record<string, string> = {
    GIZI_BAIK: "Gizi Baik",
    GIZI_KURANG: "Gizi Kurang",
    GIZI_BURUK: "Gizi Buruk",
    GIZI_LEBIH: "Gizi Lebih",
  };
  return map[s] ?? s;
}

// ── Page ──

export default async function PosyanduDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "BENDAHARA";
  const { id } = await params;

  const child = await prisma.child.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true, house: { select: { blockNumber: true } } } },
      verifiedBy: { select: { name: true } },
    },
  });

  if (!child) notFound();

  // Warga hanya bisa lihat anak sendiri
  if (!isAdmin && child.userId !== session.user.id) redirect("/posyandu");

  const checkups = await prisma.childCheckup.findMany({
    where: { childId: child.id },
    orderBy: { date: "desc" },
    include: {
      recordedBy: { select: { name: true } },
      schedule: { select: { date: true, location: true } },
    },
  });

  const ageMonths = calcAgeMonths(child.birthDate);

  // Kumpulkan semua vaksin yang pernah diberikan
  const allImmunizations: string[] = [];
  for (const c of checkups) {
    for (const imm of c.immunizationGiven) {
      if (!allImmunizations.includes(imm)) allImmunizations.push(imm);
    }
  }

  const immunizationStatus = getImmunizationStatus(ageMonths, allImmunizations);

  // Hitung capaian
  const totalDue = immunizationStatus.filter((i) => i.isDue).length;
  const totalReceived = immunizationStatus.filter((i) => i.received).length;
  const totalDueAndReceived = immunizationStatus.filter((i) => i.isDue && i.received).length;
  const totalDueButNotReceived = immunizationStatus.filter((i) => i.isDue && !i.received).length;
  const totalUpcoming = immunizationStatus.filter((i) => !i.isDue).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/posyandu">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{child.name}</h1>
          <p className="text-sm text-muted-foreground">
            Detail pemeriksaan Posyandu
          </p>
        </div>
      </div>

      {/* Profil Anak */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil Anak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Nama</p>
              <p className="font-semibold">{child.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Usia</p>
              <p className="font-semibold">{calcAgeString(child.birthDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jenis Kelamin</p>
              <p className="font-semibold">{formatGender(child.gender)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tanggal Lahir</p>
              <p className="font-semibold">{formatDate(child.birthDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Berat Lahir</p>
              <p className="font-semibold">
                {child.birthWeight != null ? `${child.birthWeight} kg` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Panjang Lahir</p>
              <p className="font-semibold">
                {child.birthLength != null ? `${child.birthLength} cm` : "—"}
              </p>
            </div>
            {child.nik && (
              <div>
                <p className="text-xs text-muted-foreground">NIK</p>
                <p className="font-semibold">{child.nik}</p>
              </div>
            )}
            {child.allergies && (
              <div>
                <p className="text-xs text-muted-foreground">Alergi</p>
                <p className="font-semibold">{child.allergies}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Status Verifikasi</p>
              <p>
                {child.isVerified ? (
                  <Badge variant="default">
                    Terverifikasi{child.verifiedBy ? ` oleh ${child.verifiedBy.name}` : ""}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Belum Verifikasi</Badge>
                )}
              </p>
            </div>
            {isAdmin && (
              <div>
                <p className="text-xs text-muted-foreground">Wali</p>
                <p className="font-semibold">
                  {child.parent.name}
                  {child.parent.house ? ` (${child.parent.house.blockNumber})` : ""}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Imunisasi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Imunisasi</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Ringkasan */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="default">
              {totalDueAndReceived} dari {totalDue} imunisasi wajib (usia {calcAgeString(child.birthDate)})
            </Badge>
            {totalDueButNotReceived > 0 && (
              <Badge variant="destructive">{totalDueButNotReceived} imunisasi tertunda</Badge>
            )}
            {totalUpcoming > 0 && (
              <Badge variant="secondary">{totalUpcoming} imunisasi mendatang</Badge>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {immunizationStatus.map((item) => (
              <div
                key={item.vaccine}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm ${
                  item.received
                    ? "border-green-500/30 bg-green-500/5"
                    : item.isDue
                      ? "border-red-500/30 bg-red-500/5"
                      : "opacity-50"
                }`}
              >
                {item.received ? (
                  <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.vaccine}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.dueAgeMonths === 0
                      ? "Saat lahir"
                      : `Usia ${item.dueAgeMonths} bulan`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabel Riwayat Pemeriksaan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Pemeriksaan</CardTitle>
        </CardHeader>
        <CardContent>
          {checkups.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Belum ada riwayat pemeriksaan.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>BB (kg)</TableHead>
                  <TableHead>TB (cm)</TableHead>
                  <TableHead>Lingkar Kepala</TableHead>
                  <TableHead>Status Gizi</TableHead>
                  <TableHead>Imunisasi</TableHead>
                  <TableHead>Vitamin A</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkups.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(c.date)}
                    </TableCell>
                    <TableCell>
                      {c.weight != null ? `${c.weight}` : "—"}
                    </TableCell>
                    <TableCell>
                      {c.height != null ? `${c.height}` : "—"}
                    </TableCell>
                    <TableCell>
                      {c.headCircumference != null
                        ? `${c.headCircumference} cm`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {c.nutritionalStatus ? (
                        <Badge variant="outline">
                          {formatNutritionalStatus(c.nutritionalStatus)}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.immunizationGiven.length > 0
                          ? c.immunizationGiven.map((imm, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {imm}
                              </Badge>
                            ))
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.vitaminA === true ? (
                        <CheckCircle2 className="size-4 text-green-600" />
                      ) : c.vitaminA === false ? (
                        "—"
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
