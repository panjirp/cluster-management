import type { Metadata } from "next";
import { PermitForm } from "@/components/permits/permit-form";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Ajukan Izin" };

export default function NewPermitPage() {
  return (
    <div className="space-y-6">
      <BackLink href="/permits" label="Kembali ke Perizinan" />
      <div>
        <h1 className="text-2xl font-semibold">Ajukan Izin</h1>
        <p className="text-sm text-muted-foreground">Ajukan permohonan izin kepada pengurus cluster</p>
      </div>
      <PermitForm />
    </div>
  );
}
