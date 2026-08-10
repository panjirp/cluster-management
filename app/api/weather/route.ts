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

// Klasifikasi US AQI (standar EPA)
export function aqiCategory(aqi: number): { label: string; level: "good" | "moderate" | "unhealthy-sensitive" | "unhealthy" | "very-unhealthy" | "hazardous" } {
  if (aqi <= 50) return { label: "Baik", level: "good" };
  if (aqi <= 100) return { label: "Sedang", level: "moderate" };
  if (aqi <= 150) return { label: "Tidak Sehat (Sensitif)", level: "unhealthy-sensitive" };
  if (aqi <= 200) return { label: "Tidak Sehat", level: "unhealthy" };
  if (aqi <= 300) return { label: "Sangat Tidak Sehat", level: "very-unhealthy" };
  return { label: "Berbahaya", level: "hazardous" };
}

// Klasifikasi indeks UV (standar WHO)
export function uvCategory(uv: number): { label: string; level: "low" | "moderate" | "high" | "very-high" | "extreme" } {
  if (uv < 3) return { label: "Rendah", level: "low" };
  if (uv < 6) return { label: "Sedang", level: "moderate" };
  if (uv < 8) return { label: "Tinggi", level: "high" };
  if (uv < 11) return { label: "Sangat Tinggi", level: "very-high" };
  return { label: "Ekstrem", level: "extreme" };
}

type AirQualityResponse = {
  current?: { us_aqi?: number; pm2_5?: number; uv_index?: number };
};

type ForecastResponse = {
  current: { temperature_2m: number; relative_humidity_2m: number; apparent_temperature: number; weather_code: number; wind_speed_10m: number };
  daily: { precipitation_probability_max: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; uv_index_max: number[] };
};

// GET /api/weather — cuaca + kualitas udara + UV untuk dashboard warga (Open-Meteo, gratis tanpa key)
export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json(cache.data);
  }

  try {
    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min,uv_index_max` +
      `&timezone=Asia%2FJakarta&forecast_days=1`;

    const airUrl =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}` +
      `&current=us_aqi,pm2_5,uv_index`;

    // Ambil keduanya paralel; kualitas udara boleh gagal tanpa mematikan cuaca.
    const [res, airRes] = await Promise.all([
      fetch(forecastUrl),
      fetch(airUrl).catch(() => null),
    ]);

    if (!res.ok) {
      return NextResponse.json({ error: "Gagal mengambil data cuaca." }, { status: 502 });
    }
    const raw = (await res.json()) as ForecastResponse;

    const wmo = WMO_LABELS[raw.current.weather_code] ?? { label: "Tidak Diketahui", icon: "cloud" };

    // Kualitas udara (opsional — null jika endpoint gagal)
    let aqi: number | null = null;
    let pm25: number | null = null;
    let uvNow: number | null = null;
    if (airRes && airRes.ok) {
      const air = (await airRes.json().catch(() => null)) as AirQualityResponse | null;
      if (air?.current) {
        aqi = air.current.us_aqi ?? null;
        pm25 = air.current.pm2_5 ?? null;
        uvNow = air.current.uv_index ?? null;
      }
    }

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
      uvIndex: raw.daily.uv_index_max?.[0] ?? null,
      uvNow,
      aqi,
      pm25,
      updatedAt: new Date().toISOString(),
    };

    cache = { at: Date.now(), data };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data cuaca." }, { status: 502 });
  }
}
