import { NextResponse } from "next/server";

// Koordinat untuk area Daifuku — Jl. Telaga Asih (dekat Metland Telaga Murni)
const POINTS = {
  daifukuToTelagaAsih: "-6.2575,107.1040",  // Daifuku → Jl. Telaga Asih
  telagaAsihToDaifuku: "-6.2580,107.1035",  // Jl. Telaga Asih → Daifuku
};

export async function GET() {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TomTom API key belum dikonfigurasi" }, { status: 500 });
  }

  try {
    // Fetch 2 arah sekaligus
    const [res1, res2] = await Promise.all([
      fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${apiKey}&point=${POINTS.daifukuToTelagaAsih}&unit=KMPH`),
      fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${apiKey}&point=${POINTS.telagaAsihToDaifuku}&unit=KMPH`),
    ]);

    if (!res1.ok || !res2.ok) {
      return NextResponse.json({ error: "Gagal mengambil data lalu lintas" }, { status: 502 });
    }

    const [d1, d2] = await Promise.all([res1.json(), res2.json()]);
    const seg1 = d1.flowSegmentData;
    const seg2 = d2.flowSegmentData;

    function getStatus(current: number, free: number, closure: boolean): "lancar" | "sedang" | "macet" {
      if (closure) return "macet";
      const ratio = free > 0 ? current / free : 1;
      if (ratio < 0.5) return "macet";
      if (ratio < 0.8) return "sedang";
      return "lancar";
    }

    const arah1 = {
      dari: "Daifuku",
      ke: "Jl. Telaga Asih",
      currentSpeed: seg1.currentSpeed,
      freeFlowSpeed: seg1.freeFlowSpeed,
      status: getStatus(seg1.currentSpeed, seg1.freeFlowSpeed, seg1.roadClosure),
    };

    const arah2 = {
      dari: "Jl. Telaga Asih",
      ke: "Daifuku",
      currentSpeed: seg2.currentSpeed,
      freeFlowSpeed: seg2.freeFlowSpeed,
      status: getStatus(seg2.currentSpeed, seg2.freeFlowSpeed, seg2.roadClosure),
    };

    // Status keseluruhan — pakai yang paling parah
    const statusOrder = { lancar: 0, sedang: 1, macet: 2 } as const;
    const overallStatus = statusOrder[arah1.status] >= statusOrder[arah2.status] ? arah1.status : arah2.status;

    return NextResponse.json({
      overallStatus,
      arah1,
      arah2,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data lalu lintas" }, { status: 502 });
  }
}
