import type { Metadata } from "next";
import { GuestPassForm } from "@/components/guest-passes/guest-pass-form";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Buat Pass Tamu" };

export default function NewGuestPassPage() {
  return (
    <div className="space-y-6">
      <BackLink href="/guest-passes" label="Kembali ke QR Pass Tamu" />
      <div>
        <h1 className="text-2xl font-semibold">Buat Pass Tamu</h1>
        <p className="text-sm text-muted-foreground">
          Pass berisi QR/kode yang diverifikasi satpam di gerbang
        </p>
      </div>
      <GuestPassForm />
    </div>
  );
}
