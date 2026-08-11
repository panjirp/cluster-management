"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSun,
  Droplets,
  Factory,
  HeartPulse,
  RefreshCw,
  ShieldAlert,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type WeatherData = {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  rainProbability: number | null;
  tempMax: number | null;
  tempMin: number | null;
  uvIndex: number | null;
  uvNow: number | null;
  aqi: number | null;
  pm25: number | null;
  updatedAt?: string;
};

const ICONS: Record<string, typeof Sun> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "cloud-rain-wind": CloudRainWind,
  "cloud-lightning": CloudLightning,
};

// Klasifikasi US AQI (EPA) — konsisten dengan API
function aqiInfo(aqi: number): { label: string; cls: string } {
  if (aqi <= 50) return { label: "Baik", cls: "text-green-600 dark:text-green-400" };
  if (aqi <= 100) return { label: "Sedang", cls: "text-amber-600 dark:text-amber-400" };
  if (aqi <= 150) return { label: "Tidak Sehat (Sensitif)", cls: "text-orange-600 dark:text-orange-400" };
  if (aqi <= 200) return { label: "Tidak Sehat", cls: "text-red-600 dark:text-red-400" };
  if (aqi <= 300) return { label: "Sangat Tidak Sehat", cls: "text-purple-600 dark:text-purple-400" };
  return { label: "Berbahaya", cls: "text-rose-700 dark:text-rose-400" };
}

// Klasifikasi indeks UV (WHO)
function uvInfo(uv: number): { label: string; cls: string } {
  if (uv < 3) return { label: "Rendah", cls: "text-green-600 dark:text-green-400" };
  if (uv < 6) return { label: "Sedang", cls: "text-amber-600 dark:text-amber-400" };
  if (uv < 8) return { label: "Tinggi", cls: "text-orange-600 dark:text-orange-400" };
  if (uv < 11) return { label: "Sangat Tinggi", cls: "text-red-600 dark:text-red-400" };
  return { label: "Ekstrem", cls: "text-purple-600 dark:text-purple-400" };
}

type Advice = { tone: "warning" | "positive"; title: string; text: string } | null;

/** Format waktu update (WIB, mengikuti jam perangkat). */
function formatUpdatedAt(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Himbauan kesehatan berdasarkan kualitas udara, UV, cuaca, dan jam lokal.
 * - Udara buruk / UV sangat tinggi  -> pakai masker, kurangi aktivitas luar (apalagi sore).
 * - Pagi cerah & udara bersih       -> ajakan keluar rumah & berolahraga.
 */
function getHealthAdvice(d: WeatherData, hour: number): Advice {
  const aqi = d.aqi;
  const uv = d.uvNow ?? d.uvIndex;
  const isClear = d.icon === "sun" || d.icon === "cloud-sun";
  // Sore: mendung ("cloud") juga aman — matahari tertutup, sudah teduh.
  const isNotRainy = isClear || d.icon === "cloud";
  const rain = d.rainProbability ?? 0;

  const badAir = aqi != null && aqi > 100;
  const veryHighUv = uv != null && uv >= 8;

  // Pagi cerah (05–09): ajakan positif untuk keluar & olahraga.
  if (hour >= 5 && hour < 9 && isClear && rain < 40 && !badAir && !veryHighUv) {
    return {
      tone: "positive",
      title: "Pagi cerah — waktu yang pas untuk bergerak",
      text:
        "Udara pagi ini nyaman untuk keluar rumah dan berolahraga ringan. Jangan lupa tetap cukupi cairan tubuh.",
    };
  }

  // Sore (16–19): panas sudah reda, cuaca aman & udara baik -> ajakan keluar & olahraga.
  if (
    hour >= 16 &&
    hour < 19 &&
    isNotRainy &&
    rain < 40 &&
    !badAir &&
    !veryHighUv &&
    d.feelsLike < 31
  ) {
    return {
      tone: "positive",
      title: "Sore sudah teduh — ayo gerak sebentar",
      text:
        "Matahari sudah tidak terik. Waktu yang enak untuk keluar rumah, jalan santai, atau berolahraga ringan di sekitar cluster.",
    };
  }

  // Kondisi buruk: udara tidak sehat dan/atau UV sangat tinggi.
  if (badAir || veryHighUv) {
    const isEvening = hour >= 15;
    const causes: string[] = [];
    if (badAir) causes.push("kualitas udara sedang tidak sehat");
    if (veryHighUv) causes.push("indeks UV sangat tinggi");
    const tail = isEvening
      ? "Sebaiknya gunakan masker dan kurangi aktivitas di luar rumah, terutama pada sore hari."
      : "Sebaiknya gunakan masker dan kurangi aktivitas di luar rumah.";
    return { tone: "warning", title: "Peringatan kesehatan", text: `${causes.join(" dan ")}. ${tail}` };
  }

  return null;
}

// Data mock untuk preview (tidak dipakai di produksi).
const MOCKS: Record<string, WeatherData> = {
  bad: {
    temperature: 31, feelsLike: 35, humidity: 72, windSpeed: 6,
    condition: "Berawan Sebagian", icon: "cloud-sun",
    rainProbability: 10, tempMax: 33, tempMin: 26,
    uvIndex: 9.2, uvNow: 8.6, aqi: 185, pm25: 88,
  },
  uv: {
    temperature: 32, feelsLike: 36, humidity: 60, windSpeed: 8,
    condition: "Cerah", icon: "sun",
    rainProbability: 0, tempMax: 34, tempMin: 26,
    uvIndex: 10.5, uvNow: 9.8, aqi: 55, pm25: 18,
  },
  morning: {
    temperature: 26, feelsLike: 27, humidity: 80, windSpeed: 4,
    condition: "Cerah", icon: "sun",
    rainProbability: 5, tempMax: 32, tempMin: 25,
    uvIndex: 4.2, uvNow: 1.2, aqi: 42, pm25: 12,
  },
  evening: {
    temperature: 29, feelsLike: 30, humidity: 70, windSpeed: 5,
    condition: "Cerah Berawan", icon: "cloud-sun",
    rainProbability: 10, tempMax: 34, tempMin: 25,
    uvIndex: 8.2, uvNow: 0.6, aqi: 58, pm25: 16,
  },
};

/** Widget cuaca + kualitas udara cluster (Open-Meteo via /api/weather) — tampil di dashboard. */
export function WeatherWidget({ mock, forceHour }: { mock?: "bad" | "uv" | "morning" | "evening"; forceHour?: number } = {}) {
  const [data, setData] = useState<WeatherData | null>(mock ? MOCKS[mock] : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (mock) return;
    let cancelled = false;

    const loadWeather = () => {
      fetch("/api/weather")
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
        .then((d) => {
          if (!cancelled) setData(d);
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    };

    loadWeather();
    // Auto-refresh setiap 5 menit (sync dengan cache API).
    const id = setInterval(loadWeather, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [mock]);

  if (failed) return null;
  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <div className="size-10 animate-pulse rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const Icon = ICONS[data.icon] ?? Cloud;
  const aqi = data.aqi != null ? aqiInfo(data.aqi) : null;
  const uv = data.uvIndex != null ? uvInfo(data.uvIndex) : null;
  const hour = forceHour ?? new Date().getHours();
  const advice = getHealthAdvice(data, hour);
  const updatedAtText = formatUpdatedAt(data.updatedAt);

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-500/15 ring-1 ring-inset ring-sky-500/20">
              <Icon className="size-6 text-sky-500 dark:text-sky-400" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-lg font-bold tabular-nums">
                {Math.round(data.temperature)}°C
                <span className="text-sm font-medium text-muted-foreground">· {data.condition}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Cuaca Barcelona Cove · terasa seperti {Math.round(data.feelsLike)}°C
                {updatedAtText && (
                  <span className="inline-flex items-center gap-1" title="Data diperbarui otomatis">
                    · <RefreshCw className="size-3" /> {updatedAtText}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Thermometer className="size-3.5" />
              {data.tempMin != null && data.tempMax != null
                ? `${Math.round(data.tempMin)}–${Math.round(data.tempMax)}°C`
                : "—"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Droplets className="size-3.5" /> {data.humidity}%
            </span>
            <span className="inline-flex items-center gap-1">
              <Wind className="size-3.5" /> {Math.round(data.windSpeed)} km/j
            </span>
            {data.rainProbability != null && (
              <span
                className={
                  data.rainProbability >= 50
                    ? "inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400"
                    : "inline-flex items-center gap-1"
                }
              >
                <Umbrella className="size-3.5" /> hujan {data.rainProbability}%
              </span>
            )}
            {uv && data.uvIndex != null && (
              <span
                className={`inline-flex items-center gap-1 font-semibold ${uv.cls}`}
                title={`Indeks UV ${data.uvIndex.toFixed(1)} — ${uv.label}. ${
                  data.uvIndex >= 3 ? "Gunakan tabir surya & topi saat di luar." : ""
                }`}
              >
                <Sun className="size-3.5" /> UV {data.uvIndex.toFixed(1)} · {uv.label}
              </span>
            )}
          </div>
        </div>

        {/* Baris kualitas udara — muncul jika data AQI tersedia */}
        {aqi && data.aqi != null && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Factory className="size-3.5" />
              Kualitas udara (US AQI)
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="font-bold tabular-nums">{data.aqi}</span>
              <span className={`font-semibold ${aqi.cls}`}>{aqi.label}</span>
              {data.pm25 != null && (
                <span className="text-muted-foreground">PM2.5 {Math.round(data.pm25)} µg/m³</span>
              )}
            </span>
          </div>
        )}

        {/* Himbauan kesehatan — otomatis berdasarkan kondisi & jam */}
        {advice && (
          <div
            className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-xs ring-1 ring-inset ${
              advice.tone === "warning"
                ? "bg-red-500/10 ring-red-500/20"
                : "bg-green-500/10 ring-green-500/20"
            }`}
          >
            {advice.tone === "warning" ? (
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
            ) : (
              <HeartPulse className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
            )}
            <div>
              <p
                className={`font-semibold ${
                  advice.tone === "warning"
                    ? "text-red-700 dark:text-red-300"
                    : "text-green-700 dark:text-green-300"
                }`}
              >
                {advice.title}
              </p>
              <p className="mt-0.5 leading-relaxed text-muted-foreground">{advice.text}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
