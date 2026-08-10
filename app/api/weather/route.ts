import { NextResponse } from "next/server";

// Koordinat Cluster Barcelona Cove, Cikarang, Kab. Bekasi.
const LAT = -6.2475;
const LON = 107.1281;

// Cache sederhana 10 menit agar tidak membebani Open-Meteo.
let cache: { at: number; data: unknown } | null = null;
const CACHE_MS = 10 * 60 * 1000;

const WMO_LABELS: Record<number, { label: string; icon: string }> = {
  0: { label: "Cerah", icon: "sun" },
  1: { label: "Cerah Berawan", icon: "sun" },
  2: { label: "Berawan Sebagian", icon: "cloud-sun" },
  3: { label: "Mendung", icon: "cloud" },
  45: { label: "Berkabut", icon: "cloud-fog" },
  48: { label: "Kabut Tebal", icon: "cloud-fog" },
  51: { label: "Gerimis Ringan", icon: "cloud-drizzle" },
  53: { label: "Gerimis", icon: "cloud-drizzle" },
  55: { label: "Gerimis Lebat", icon: "cloud-drizzle" },
  61: { label: "Hujan Ringan", icon: "cloud-rain" },
  63: { label: "Hujan", icon: "cloud-rain" },
  65: { label: "Hujan Lebat", icon: "cloud-rain-wind" },
  80: { label: "Hujan Lokal", icon: "cloud-rain" },
  81: { label: "Hujan Lokal Lebat", icon: "cloud-rain-wind" },
  82: { label: "Hujan Deras", icon: "cloud-rain-wind" },
  95: { label: "Badai Petir", icon: "cloud-lightning" },
  96: { label: "Badai Petir & Hujan Es", icon: "cloud-lightning" },
  99: { label: "Badai Petir & Hujan Es Lebat", icon: "cloud-lightning" },
};

// GET /api/weather — cuaca terkini untuk dashboard warga (Open-Meteo, gratis tanpa key)
export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json(cache.data);
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min` +
      `&timezone=Asia%2FJakarta&forecast_days=1`;

    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Gagal mengambil data cuaca." }, { status: 502 });
    }
    const raw = (await res.json()) as {
      current: { temperature_2m: number; relative_humidity_2m: number; apparent_temperature: number; weather_code: number; wind_speed_10m: number };
      daily: { precipitation_probability_max: number[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
    };

    const wmo = WMO_LABELS[raw.current.weather_code] ?? { label: "Tidak Diketahui", icon: "cloud" };

    const data = {
      temperature: raw.current.temperature_2m,
      feelsLike: raw.current.apparent_temperature,
      humidity: raw.current.relative_humidity_2m,
      windSpeed: raw.current.wind_speed_10m,
      condition: wmo.label,
      icon: wmo.icon,
      rainProbability: raw.daily.precipitation_probability_max?.[0] ?? null,
      tempMax: raw.daily.temperature_2m_max?.[0] ?? null,
      tempMin: raw.daily.temperature_2m_min?.[0] ?? null,
      updatedAt: new Date().toISOString(),
    };

    cache = { at: Date.now(), data };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data cuaca." }, { status: 502 });
  }
}
