import {
  Cross,
  Flame,
  HeartPulse,
  MapPin,
  Navigation,
  Phone,
  Pill,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Direktori layanan darurat terdekat dari Cluster Barcelona Cove.
 * Lokasi dikurasi dari OpenStreetMap (per Agustus 2026) berdasarkan jarak
 * terdekat dari cluster. Nomor nasional memakai kode resmi Indonesia.
 */

type ServiceEntry = {
  name: string;
  note?: string;
  distanceKm?: number;
  phone?: string;
  phoneDisplay?: string;
  lat?: number;
  lon?: number;
};

type ServiceCategory = {
  title: string;
  icon: typeof Shield;
  chipClass: string;
  entries: ServiceEntry[];
};

// Nomor darurat nasional Indonesia
const NATIONAL_NUMBERS: { number: string; label: string }[] = [
  { number: "112", label: "Darurat (Umum)" },
  { number: "119", label: "Ambulans" },
  { number: "110", label: "Polisi" },
  { number: "113", label: "Pemadam Kebakaran" },
  { number: "123", label: "PLN (Listrik)" },
];

const CATEGORIES: ServiceCategory[] = [
  {
    title: "Rumah Sakit & Ambulans",
    icon: HeartPulse,
    chipClass: "bg-red-500/15 text-red-600 dark:text-red-400",
    entries: [
      {
        name: "RS Hermina Cibitung",
        distanceKm: 1.6,
        lat: -6.25381,
        lon: 107.11518,
        note: "IGD 24 jam",
      },
      {
        name: "RS Bhakti Husada",
        distanceKm: 2.2,
        lat: -6.26272,
        lon: 107.14039,
      },
      {
        name: "RS Amanda Cikarang",
        distanceKm: 2.6,
        phone: "+62218900277",
        phoneDisplay: "(021) 8900277",
        lat: -6.26195,
        lon: 107.14684,
        note: "Jl. Raya Industri Pasir Gombong · 24 jam",
      },
      {
        name: "RS Ridhoka Salma",
        distanceKm: 2.6,
        lat: -6.26934,
        lon: 107.12113,
      },
    ],
  },
  {
    title: "Polisi",
    icon: Shield,
    chipClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    entries: [
      {
        name: "Polsek Cibitung",
        distanceKm: 3.9,
        lat: -6.2733,
        lon: 107.10371,
      },
      {
        name: "Polres Metro Bekasi",
        distanceKm: 5.7,
        lat: -6.28136,
        lon: 107.16717,
        note: "Cikarang",
      },
    ],
  },
  {
    title: "Pemadam Kebakaran",
    icon: Flame,
    chipClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    entries: [
      {
        name: "Damkar Cikarang Barat",
        distanceKm: 2.4,
        lat: -6.25753,
        lon: 107.1089,
      },
      {
        name: "Damkar Cikarang Utara",
        distanceKm: 3.5,
        lat: -6.25025,
        lon: 107.15969,
      },
    ],
  },
  {
    title: "Apotek & PMI",
    icon: Pill,
    chipClass: "bg-green-500/15 text-green-600 dark:text-green-400",
    entries: [
      {
        name: "Toko Obat Kirana Farma",
        distanceKm: 1.5,
        lat: -6.24693,
        lon: 107.11498,
      },
      {
        name: "PMI Kabupaten Bekasi",
        distanceKm: 5.8,
        lat: -6.26684,
        lon: 107.07892,
        note: "Donor darah & ambulans PMI",
      },
    ],
  },
];

function mapsDirUrl(lat: number, lon: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

function ServiceCard({ entry }: { entry: ServiceEntry }) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{entry.name}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {entry.distanceKm != null && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" /> ±{entry.distanceKm.toLocaleString("id-ID")} km dari cluster
              </span>
            )}
            {entry.note && <span>{entry.note}</span>}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {entry.phone && (
            <Button
              variant="outline"
              size="sm"
              render={
                <a href={`tel:${entry.phone}`}>
                  <Phone data-icon="inline-start" />
                  {entry.phoneDisplay ?? entry.phone}
                </a>
              }
            />
          )}
          {entry.lat != null && entry.lon != null && (
            <Button
              variant="outline"
              size="sm"
              render={
                <a href={mapsDirUrl(entry.lat, entry.lon)} target="_blank" rel="noopener noreferrer">
                  <Navigation data-icon="inline-start" />
                  Lokasi
                </a>
              }
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmergencyDirectory() {
  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Layanan Darurat Terdekat</h2>
        <p className="text-sm text-muted-foreground">
          Nomor penting & lokasi layanan darurat terdekat dari Barcelona Cove. Simpan halaman ini untuk berjaga-jaga.
        </p>
      </div>

      {/* Nomor darurat nasional — satu ketuk langsung menelepon */}
      <div className="flex flex-wrap justify-center gap-2">
        {NATIONAL_NUMBERS.map((n) => (
          <a
            key={n.number}
            href={`tel:${n.number}`}
            className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-red-500/60 hover:text-red-600 dark:hover:text-red-400"
          >
            <Phone className="size-3.5" />
            <span className="font-bold tabular-nums">{n.number}</span>
            <span className="text-muted-foreground">{n.label}</span>
          </a>
        ))}
      </div>

      {/* Direktori per kategori */}
      <div className="space-y-5">
        {CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          return (
            <div key={cat.title} className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <span className={`grid size-7 place-items-center rounded-lg ${cat.chipClass}`}>
                  <CatIcon className="size-4" />
                </span>
                {cat.title}
              </h3>
              <div className="space-y-2">
                {cat.entries.map((e) => (
                  <ServiceCard key={e.name} entry={e} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="flex items-start justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Cross className="mt-0.5 size-3.5 shrink-0" />
        Jika nomor lokasi tidak aktif, gunakan nomor darurat nasional — operator 112/119/110 dapat menyambungkan ke
        unit terdekat. Sumber lokasi: OpenStreetMap.
      </p>
    </section>
  );
}
