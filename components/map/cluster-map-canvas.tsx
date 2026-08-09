"use client";

import Image from "next/image";
import { SITE_PLAN_URL, SITE_PLAN_ASPECT } from "@/lib/site-plan";

/**
 * Peta klaster — hanya menampilkan denah skematik, tanpa penanda
 * status pembayaran / posisi rumah.
 */
export function ClusterMapCanvas() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border bg-muted/10"
      style={{ aspectRatio: SITE_PLAN_ASPECT }}
    >
      <Image
        src={SITE_PLAN_URL}
        alt="Denah Cluster Barcelona Cove"
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, 700px"
        className="object-cover"
      />
    </div>
  );
}
