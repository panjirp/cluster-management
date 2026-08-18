import type { Metadata } from "next";
import { Car } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { MyVehicles } from "@/components/vehicles/my-vehicles";

export const metadata: Metadata = { title: "Kendaraan Saya" };

export default async function VehiclesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Car className="size-6 text-primary" /> Kendaraan Saya
        </h1>
        <p className="text-sm text-muted-foreground">
          Daftarkan plat nomor kendaraan agar dikenali gerbang otomatis (boomgate) cluster.
        </p>
      </div>
      <MyVehicles />
    </div>
  );
}
