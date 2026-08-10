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
  aqi: number | null;
  pm25: number | null;
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

/** Widget cuaca + kualitas udara cluster (Open-Meteo via /api/weather) — tampil di dashboard. */
export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
            {data.aqi > 100 && (
              <p className="w-full text-muted-foreground">
                ⚠️ Udara sedang kurang sehat — disarankan mengurangi aktivitas luar ruang & pakai masker.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
