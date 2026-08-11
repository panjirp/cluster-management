import { WeatherWidget } from "@/components/dashboard/weather-widget";
import ClientProbe from "./client-probe";

// Halaman preview sementara — widget cuaca auto-refresh + indikator waktu.
export default function PreviewWeatherPage() {
  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-sm font-semibold text-muted-foreground">
        Preview: Widget Cuaca (auto-refresh 5 menit + indikator waktu)
      </h1>
      <WeatherWidget />
      <ClientProbe />
    </div>
  );
}
