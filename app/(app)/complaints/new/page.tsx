import type { Metadata } from "next";
import { ComplaintForm } from "@/components/complaints/complaint-form";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Buat Pengaduan" };

export default function NewComplaintPage() {
  return (
    <div className="space-y-6">
      <BackLink href="/complaints" label="Kembali ke Pengaduan" />
      <div>
        <h1 className="text-2xl font-semibold">Buat Pengaduan</h1>
        <p className="text-sm text-muted-foreground">Sampaikan keluhan Anda kepada pengurus cluster</p>
      </div>
      <ComplaintForm />
    </div>
  );
}
