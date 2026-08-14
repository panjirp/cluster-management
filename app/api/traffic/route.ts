import { NextResponse } from "next/server";

// Rute: Daifuku (perlintasan kereta) → Gerbang Metland Telaga Murni
// Sampling 5 titik di sepanjang ruas jalan (interpolasi linear antar ujung)
const POINTS = [
  "-6.26176,107.10085", // Daifuku perlintasan
  "-6.26069,107.10344",
  "-6.25962,107.10602",
  "-6.25854,107.10861",
  "-6.25747,107.11120", // Gerbang Metland
];

function getStatus(current: number, free: number, closure: boolean): "lancar" | "sedang" | "macet" {
  if (closure) return "macet";
  const ratio = free > 0 ? current / free : 1;
  if (ratio < 0.5) return "macet";
  if (ratio < 0.8) return "sedang";
  return "lancar";
}

const rank: Record<string, number> = { lancar: 0, sedang: 1, macet: 2 };

export async function GET() {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TomTom API key belum dikonfigurasi" }, { status: 500 });
  }

  try {
    const results = await Promise.all(
      POINTS.map((point) =>
        fetch(
          `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${apiKey}&point=${point}&unit=KMPH`
        )
      )
    );

    if (results.some((r) => !r.ok)) {
      return NextResponse.json({ error: "Gagal mengambil data lalu lintas" }, { status: 502 });
    }

    const datas = await Promise.all(results.map((r) => r.json()));

    const segs = datas.map((d, i) => {
      const f = d.flowSegmentData ?? {};
      return {
        label: i === 0 ? "Daifuku" : i === POINTS.length - 1 ? "Gerbang Metland" : `S${i}`,
        currentSpeed: f.currentSpeed ?? 0,
        freeFlowSpeed: f.freeFlowSpeed ?? 0,
        status: getStatus(f.currentSpeed ?? 0, f.freeFlowSpeed ?? 0, f.roadClosure),
      };
    });

    // Overall = segmen terburuk
    let overallStatus: "lancar" | "sedang" | "macet" = "lancar";
    for (const s of segs) {
      if (rank[s.status] > rank[overallStatus]) overallStatus = s.status;
    }

    // Kecepatan rata-rata (hanya yang > 0)
    const speeds = segs.map((s) => s.currentSpeed).filter((v) => v > 0);
    const avgSpeed = speeds.length ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0;
    const avgFree = ((arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0))(
      segs.map((s) => s.freeFlowSpeed).filter((v) => v > 0)
    );

    return NextResponse.json({
      overallStatus,
      dari: "Daifuku",
      ke: "Gerbang Metland",
      avgSpeed,
      avgFree,
      segments: segs,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data lalu lintas" }, { status: 502 });
  }
}
