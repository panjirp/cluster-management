"use client";

import { useEffect, useState } from "react";

export default function ClientProbe() {
  const [state, setState] = useState("menunggu...");

  useEffect(() => {
    setState("client JS JALAN ✓");
    fetch("/api/weather")
      .then((r) => r.json())
      .then((d) => setState(`fetch OK: ${d.temperature}°C`))
      .catch((e) => setState(`fetch GAGAL: ${e.message}`));
  }, []);

  return <p data-testid="probe">{state}</p>;
}
