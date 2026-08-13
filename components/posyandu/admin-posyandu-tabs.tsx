"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Plus,
  CalendarDays,
  Clock,
  MapPin,
  Baby,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

interface SerializedChild {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  isVerified: boolean;
  allergies: string | null;
  immunizationsDone: string[];
  vitamins: string | null;
  notes: string | null;
  parent: { name: string; house: string | null };
}

interface SerializedSchedule {
  id: string;
  date: string;
  time: string;
  location: string;
  notes: string | null;
  createdBy: string;
  checkupCount: number;
}

interface SerializedCheckup {
  id: string;
  childId: string;
  childName: string;
  date: string;
  weight: number | null;
  height: number | null;
  headCircumference: number | null;
  nutritionalStatus: string | null;
  immunizationGiven: string[];
  vitaminA: boolean | null;
  notes: string | null;
  recordedBy: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcAge(birthDate: string): string {
  const now = new Date();
  const birth = new Date(birthDate);
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 1) {
    const days = Math.floor(
      (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${days} hari`;
  }
  if (months < 24) return `${months} bulan`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} tahun ${rem} bulan` : `${years} tahun`;
}

function formatGender(gender: string): string {
  return gender === "LAKI_LAKI" ? "Laki-laki" : "Perempuan";
}

const IMMUNIZATION_OPTIONS = [
  { value: "HB0", label: "HB0 (0-24 jam)" },
  { value: "BCG", label: "BCG" },
  { value: "POLIO_1", label: "Polio 1" },
  { value: "POLIO_2", label: "Polio 2" },
  { value: "POLIO_3", label: "Polio 3" },
  { value: "POLIO_4", label: "Polio 4" },
  { value: "DPT_1", label: "DPT-HB-Hib 1" },
  { value: "DPT_2", label: "DPT-HB-Hib 2" },
  { value: "DPT_3", label: "DPT-HB-Hib 3" },
  { value: "IPV", label: "IPV" },
  { value: "CAMPAK", label: "Campak/MR" },
  { value: "JE", label: "Japanese Encephalitis" },
];

const NUTRITION_OPTIONS = [
  { value: "GIZI_BAIK", label: "Gizi Baik" },
  { value: "GIZI_KURANG", label: "Gizi Kurang" },
  { value: "GIZI_BURUK", label: "Gizi Buruk" },
  { value: "GIZI_LEBIH", label: "Gizi Lebih" },
];

function nutritionalLabel(val: string | null): string {
  const opt = NUTRITION_OPTIONS.find((o) => o.value === val);
  return opt?.label ?? val ?? "—";
}

// ── Main Component ────────────────────────────────────────────────────

export function AdminPosyanduTabs({
  childrenList: initialChildren,
  schedules,
  recentCheckups,
}: {
  childrenList: SerializedChild[];
  schedules: SerializedSchedule[];
  recentCheckups: SerializedCheckup[];
}) {
  const [tab, setTab] = useState("anak");
  const [childrenList, setChildrenList] = useState(initialChildren);
  const [schedulesList, setSchedulesList] = useState(schedules);
  const [checkupsList, setCheckupsList] = useState(recentCheckups);

  // ── Tab: Anak Terdaftar ───────────────────────────────────────────

  async function verifyChild(id: string) {
    try {
      const res = await fetch(`/api/posyandu/children/${id}/verify`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Gagal verifikasi");
      setChildrenList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isVerified: true } : c))
      );
      toast.success("Anak berhasil diverifikasi");
    } catch {
      toast.error("Gagal memverifikasi anak");
    }
  }

  // ── Tab: Jadwal — Tambah Jadwal Dialog ────────────────────────────

  function AddScheduleDialog() {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [location, setLocation] = useState("Posko Barcelona Cove");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!date || !time) {
        toast.error("Tanggal dan jam wajib diisi");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/posyandu/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, time, location: location || undefined, notes: notes || undefined }),
        });
        if (!res.ok) throw new Error("Gagal menambah jadwal");
        const newSchedule = await res.json();
        setSchedulesList((prev) =>
          [
            ...prev,
            {
              id: newSchedule.id,
              date: newSchedule.date,
              time: newSchedule.time,
              location: newSchedule.location,
              notes: newSchedule.notes,
              createdBy: newSchedule.createdBy?.name ?? "Admin",
              checkupCount: 0,
            },
          ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        );
        toast.success("Jadwal posyandu berhasil ditambahkan");
        setOpen(false);
        setDate("");
        setTime("");
        setLocation("Posko Barcelona Cove");
        setNotes("");
      } catch {
        toast.error("Gagal menambahkan jadwal");
      } finally {
        setLoading(false);
      }
    }

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button size="sm">
            <Plus className="mr-1 size-3.5" />
            Tambah Jadwal
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Jadwal Posyandu</DialogTitle>
            <DialogDescription>
              Tetapkan tanggal, jam, dan lokasi pelaksanaan posyandu.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Tanggal</Label>
              <Input
                id="schedule-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-time">Jam</Label>
              <Input
                id="schedule-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-location">Tempat</Label>
              <Input
                id="schedule-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-notes">Catatan</Label>
              <Textarea
                id="schedule-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Bawa KMS..."
                rows={2}
              />
            </div>
            <DialogFooter>
              <DialogClose>
                <Button variant="outline" type="button">
                  Batal
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Tab: Pemeriksaan — Form Input + Riwayat ───────────────────────

  function CheckupForm() {
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [scheduleId, setScheduleId] = useState("");
    const [checkupDate, setCheckupDate] = useState(
      new Date().toISOString().slice(0, 10)
    );
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");
    const [headCirc, setHeadCirc] = useState("");
    const [nutrition, setNutrition] = useState("");
    const [immunizations, setImmunizations] = useState<string[]>([]);
    const [vitaminA, setVitaminA] = useState(false);
    const [checkupNotes, setCheckupNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    function toggleImmunization(val: string) {
      setImmunizations((prev) =>
        prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
      );
    }

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!selectedChildId) {
        toast.error("Pilih anak terlebih dahulu");
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch("/api/posyandu/checkups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            childId: selectedChildId,
            scheduleId: scheduleId || undefined,
            date: checkupDate,
            weight: weight ? parseFloat(weight) : undefined,
            height: height ? parseFloat(height) : undefined,
            headCircumference: headCirc ? parseFloat(headCirc) : undefined,
            nutritionalStatus: nutrition || undefined,
            immunizationGiven: immunizations,
            vitaminA,
            notes: checkupNotes || undefined,
          }),
        });
        if (!res.ok) throw new Error("Gagal menyimpan");
        const newCheckup = await res.json();

        const childName =
          childrenList.find((c) => c.id === selectedChildId)?.name ?? "";

        setCheckupsList((prev) => [
          {
            id: newCheckup.id,
            childId: newCheckup.childId,
            childName: newCheckup.child?.name ?? childName,
            date: newCheckup.date,
            weight: newCheckup.weight,
            height: newCheckup.height,
            headCircumference: newCheckup.headCircumference,
            nutritionalStatus: newCheckup.nutritionalStatus,
            immunizationGiven: newCheckup.immunizationGiven ?? [],
            vitaminA: newCheckup.vitaminA,
            notes: newCheckup.notes,
            recordedBy: newCheckup.recordedBy?.name ?? "",
          },
          ...prev,
        ]);

        toast.success("Hasil pemeriksaan berhasil disimpan");

        // Reset form
        setSelectedChildId(null);
        setScheduleId("");
        setCheckupDate(new Date().toISOString().slice(0, 10));
        setWeight("");
        setHeight("");
        setHeadCirc("");
        setNutrition("");
        setImmunizations([]);
        setVitaminA(false);
        setCheckupNotes("");
      } catch {
        toast.error("Gagal menyimpan pemeriksaan");
      } finally {
        setSubmitting(false);
      }
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="font-semibold">Input Hasil Pemeriksaan</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="checkup-child">Nama Anak</Label>
                {childrenList.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Belum ada anak terdaftar</p>
                ) : (
                  <select
                    id="checkup-child"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedChildId ?? ""}
                    onChange={(e) => setSelectedChildId(e.target.value || null)}
                  >
                    <option value="">— Pilih Anak —</option>
                    {childrenList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({calcAge(c.birthDate)})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkup-date">Tanggal Periksa</Label>
                <Input
                  id="checkup-date"
                  type="date"
                  value={checkupDate}
                  onChange={(e) => setCheckupDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkup-weight">Berat Badan (kg)</Label>
                <Input
                  id="checkup-weight"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Contoh: 8.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkup-height">Tinggi Badan (cm)</Label>
                <Input
                  id="checkup-height"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Contoh: 72.3"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkup-head">Lingkar Kepala (cm)</Label>
                <Input
                  id="checkup-head"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Contoh: 44.0"
                  value={headCirc}
                  onChange={(e) => setHeadCirc(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkup-nutrition">Status Gizi</Label>
                <Select value={nutrition} onValueChange={(v) => setNutrition(v ?? "")}>
                  <SelectTrigger id="checkup-nutrition" className="w-full">
                    <SelectValue placeholder="— Pilih —" />
                  </SelectTrigger>
                  <SelectContent>
                    {NUTRITION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Imunisasi */}
            <div className="space-y-2">
              <Label>Imunisasi Diberikan</Label>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                {IMMUNIZATION_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={immunizations.includes(opt.value)}
                      onCheckedChange={() => toggleImmunization(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label htmlFor="checkup-vitaminA">Vitamin A</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="checkup-vitaminA"
                  checked={vitaminA}
                  onCheckedChange={(checked) => setVitaminA(!!checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {vitaminA ? "Diberikan" : "Belum"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkup-notes">Catatan</Label>
              <Textarea
                id="checkup-notes"
                value={checkupNotes}
                onChange={(e) => setCheckupNotes(e.target.value)}
                placeholder="Catatan tambahan..."
                rows={2}
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Pemeriksaan"}
            </Button>
          </CardContent>
        </Card>
      </form>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v ?? "children")}>
      <TabsList>
        <TabsTrigger value="anak">Anak Terdaftar</TabsTrigger>
        <TabsTrigger value="jadwal">Jadwal</TabsTrigger>
        <TabsTrigger value="pemeriksaan">Pemeriksaan</TabsTrigger>
      </TabsList>

      {/* ── Tab 1: Anak Terdaftar ────────────────────────────────── */}
      <TabsContent value="anak" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            {childrenList.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/20">
                  <Baby className="size-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Belum ada anak terdaftar.
                </p>
              </div>
            ) : (
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Anak</TableHead>
                  <TableHead>Orang Tua</TableHead>
                  <TableHead>Umur</TableHead>
                  <TableHead>JK</TableHead>
                  <TableHead>Imunisasi & Vitamin</TableHead>
                  <TableHead>Status Verifikasi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {childrenList.map((child) => (
                  <TableRow key={child.id}>
                    <TableCell className="font-medium">
                      {child.name}
                      {child.allergies && (
                        <p className="text-xs font-normal text-red-400">⚠️ Alergi: {child.allergies}</p>
                      )}
                      {child.notes && (
                        <p className="text-xs font-normal text-muted-foreground">📝 {child.notes}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {child.parent.name}
                      {child.parent.house ? ` (${child.parent.house})` : ""}
                    </TableCell>
                    <TableCell>{calcAge(child.birthDate)}</TableCell>
                    <TableCell>{formatGender(child.gender)}</TableCell>
                    <TableCell>
                      {child.immunizationsDone.length > 0 ? (
                        <p className="text-xs">{child.immunizationsDone.map((v) => IMMUNIZATION_OPTIONS.find((o) => o.value === v)?.label ?? v).join(", ")}</p>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      {child.vitamins && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">💊 {child.vitamins}</p>
                      )}
                    </TableCell>
                      <TableCell>
                        {child.isVerified ? (
                          <Badge variant="default">Terverifikasi</Badge>
                        ) : (
                          <Badge variant="secondary">Belum Verifikasi</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!child.isVerified && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => verifyChild(child.id)}
                          >
                            <CheckCircle className="mr-1 size-3.5" />
                            Verifikasi
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Tab 2: Jadwal ────────────────────────────────────────── */}
      <TabsContent value="jadwal" className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {schedulesList.length} jadwal aktif
          </p>
          <AddScheduleDialog />
        </div>

        {schedulesList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <CalendarDays className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Belum ada jadwal posyandu.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {schedulesList.map((s) => (
              <Card key={s.id}>
                <CardContent className="space-y-3 py-4">
                  <div>
                    <p className="font-semibold">{formatDate(s.date)}</p>
                    <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {s.time}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5" />
                        {s.location}
                      </div>
                    </div>
                  </div>
                  {s.notes && (
                    <p className="text-xs text-muted-foreground border-t pt-2">
                      {s.notes}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      {s.checkupCount} pemeriksaan
                    </Badge>
                    <span>· Dibuat oleh {s.createdBy}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* ── Tab 3: Pemeriksaan ───────────────────────────────────── */}
      <TabsContent value="pemeriksaan" className="mt-4 space-y-6">
        <CheckupForm />

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Riwayat Pemeriksaan Terbaru</h3>
            {checkupsList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Belum ada data pemeriksaan.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Anak</TableHead>
                    <TableHead>BB (kg)</TableHead>
                    <TableHead>TB (cm)</TableHead>
                    <TableHead>Status Gizi</TableHead>
                    <TableHead>Vitamin A</TableHead>
                    <TableHead>Petugas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkupsList.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{formatDate(c.date)}</TableCell>
                      <TableCell className="font-medium">
                        {c.childName}
                      </TableCell>
                      <TableCell>{c.weight ?? "—"}</TableCell>
                      <TableCell>{c.height ?? "—"}</TableCell>
                      <TableCell>{nutritionalLabel(c.nutritionalStatus)}</TableCell>
                      <TableCell>
                        {c.vitaminA === true ? (
                          <Badge variant="default">Ya</Badge>
                        ) : c.vitaminA === false ? (
                          <Badge variant="secondary">Tidak</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.recordedBy}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
