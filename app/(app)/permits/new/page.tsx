import type { Metadata } from "next";
import { PermitForm } from "@/components/permits/permit-form";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Ajukan Izin" };

export default async function NewPermitPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const validTypes = ["RENOVASI", "ACARA", "TAMU_KENDARAAN", "SURAT_PENGANTAR", "LAINNYA"] as const;
  const initialType = type && (validTypes as readonly string[]).includes(type) ? (type as (typeof validTypes)[number]) : undefined;

  return (
    <div className="space-y-6">
      <BackLink href="/permits" label="Kembali ke Perizinan" />
      <div>
        <h1 className="text-2xl font-semibold">Ajukan Izin</h1>
        <p className="text-sm text-muted-foreground">Ajukan permohonan izin kepada pengurus cluster</p>
      </div>
      <PermitForm initialType={initialType} />
    </div>
  );
}
