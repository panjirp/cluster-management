import { NextResponse } from "next/server";

// Koordinat: Gerbang Metland ↔ Masjid Jami At-Taqwa (2 arah)
const POINT_KELUAR = "-6.2580,107.1035"; // Gerbang Metland → Masjid
const POINT_MASUK = "-6.2585,107.1030";   // Masjid → Gerbang Metland

export async function GET() {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TomTom API key belum dikonfigurasi" }, { status: 500 });
  }

  try {
    const [res1, res2] = await Promise.all([
      fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${apiKey}&point=${POINT_KELUAR}&unit=KMPH`),
      fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${apiKey}&point=${POINT_MASUK}&unit=KMPH`),
    ]);

    if (!res1.ok || !res2.ok) {
      return NextResponse.json({ error: "Gagal mengambil data lalu lintas" }, { status: 502 });
    }

    const [d1, d2] = await Promise.all([res1.json(), res2.json()]);
    const s1 = d1.flowSegmentData;
    const s2 = d2.flowSegmentData;

    function getStatus(current: number, free: number, closure: boolean): "lancar" | "sedang" | "macet" {
      if (closure) return "macet";
      const ratio = free > 0 ? current / free : 1;
      if (ratio < 0.5) return "macet";
      if (ratio < 0.8) return "sedang";
      return "lancar";
    }

    const keluar = {
      dari: "Gerbang Metland",
      ke: "Masjid Jami At-Taqwa",
      currentSpeed: s1.currentSpeed,
      freeFlowSpeed: s1.freeFlowSpeed,
      status: getStatus(s1.currentSpeed, s1.freeFlowSpeed, s1.roadClosure),
    };

    const masuk = {
      dari: "Masjid Jami At-Taqwa",
      ke: "Gerbang Metland",
      currentSpeed: s2.currentSpeed,
      freeFlowSpeed: s2.freeFlowSpeed,
      status: getStatus(s2.currentSpeed, s2.freeFlowSpeed, s2.roadClosure),
    };

    const statusOrder = { lancar: 0, sedang: 1, macet: 2 } as const;
    const overallStatus = statusOrder[keluar.status] >= statusOrder[masuk.status] ? keluar.status : masuk.status;

    return NextResponse.json({
      overallStatus,
      keluar,
      masuk,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data lalu lintas" }, { status: 502 });
  }
}
