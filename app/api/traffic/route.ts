import { NextResponse } from "next/server";

// GET /api/traffic — status lalu lintas perlintasan kereta (TomTom Traffic API)
export async function GET() {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TomTom API key belum dikonfigurasi" }, { status: 500 });
  }

  // Koordinat perlintasan kereta Jl. Selang Cironggeng, Cibitung
  const point = "-6.2590,107.1010";

  try {
    const res = await fetch(
      `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${apiKey}&point=${point}&unit=KMPH`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Gagal mengambil data lalu lintas" }, { status: 502 });
    }

    const data = await res.json();
    const seg = data.flowSegmentData;
    const currentSpeed = seg.currentSpeed;
    const freeFlowSpeed = seg.freeFlowSpeed;
    const confidence = seg.confidence;
    const roadClosure = seg.roadClosure;

    // Hitung rasio kelancaran
    const ratio = freeFlowSpeed > 0 ? currentSpeed / freeFlowSpeed : 1;
    let status: "lancar" | "sedang" | "macet" = "lancar";
    if (roadClosure) {
      status = "macet";
    } else if (ratio < 0.5) {
      status = "macet";
    } else if (ratio < 0.8) {
      status = "sedang";
    }

    // Ambil koordinat polyline untuk peta
    const coordinates = seg.coordinates?.coordinate ?? [];

    return NextResponse.json({
      status,
      currentSpeed,
      freeFlowSpeed,
      confidence,
      roadClosure,
      ratio: Math.round(ratio * 100),
      coordinates,
      point: { lat: -6.2590, lon: 107.1010 },
      roadName: "Jl. Selang Cironggeng",
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data lalu lintas" }, { status: 502 });
  }
}