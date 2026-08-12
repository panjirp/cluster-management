import { NextResponse } from "next/server";

// GET /api/krl — jadwal KRL 5 perjalanan berikutnya dari Cibitung
export async function GET() {
  try {
    const now = new Date();
    const timeFrom = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
    const timeTo = "23:59";

    const res = await fetch(
      `https://kci.id/api/krl/schedules?stationid=TLM&timefrom=${timeFrom}&timeto=${timeTo}`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Gagal mengambil jadwal KRL" }, { status: 502 });
    }

    const data = await res.json();

    if (!data.data || !Array.isArray(data.data)) {
      return NextResponse.json({ error: "Data jadwal tidak valid" }, { status: 502 });
    }

    // Ambil 5 perjalanan berikutnya
    const upcoming = data.data
      .filter((s: any) => s.time_est >= timeFrom)
      .sort((a: any, b: any) => a.time_est.localeCompare(b.time_est))
      .slice(0, 5)
      .map((s: any) => ({
        trainId: s.train_id,
        route: s.route_name,
        dest: s.dest,
        depTime: s.time_est,
        arrTime: s.dest_time,
        color: s.color,
      }));

    return NextResponse.json({
      station: "Metland Telaga Murni",
      upcoming,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil jadwal KRL" }, { status: 502 });
  }
}