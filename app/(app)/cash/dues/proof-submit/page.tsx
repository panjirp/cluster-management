import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ProofSubmitClient } from "./proof-submit-client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pengajuan Pembayaran Iuran",
  description: "Upload bukti pembayaran iuran bulanan",
};

export default async function ProofSubmitPage() {
  const session = await requireUser();

  const role: string = session.user.role;
  // Fitur kas: nonaktif sementara untuk warga (aktif kembali jika diminta)
  if (role === "WARGA") {
    redirect("/dashboard");
  }
  // Halaman ini khusus warga — pengurus diarahkan ke review bukti
  if (role !== "WARGA") {
    redirect("/cash/dues");
  }

  const houseId = session.user.houseId;
  if (!houseId) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Pengajuan Pembayaran Iuran</h1>
          <p className="text-sm text-muted-foreground">Upload bukti pembayaran iuran bulanan</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Anda belum terhubung ke data rumah. Hubungi admin.
          </CardContent>
        </Card>
      </div>
    );
  }

  const dues = await prisma.monthlyDue.findMany({
    where: { houseId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      paymentProofs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          fileName: true,
          filePath: true,
          createdAt: true,
          rejectionReason: true,
        },
      },
    },
  });

  return (
    <ProofSubmitClient
      initialDues={dues.map((due) => ({
        id: due.id,
        year: due.year,
        month: due.month,
        amount: due.amount,
        isPaid: due.isPaid,
        proof: due.paymentProofs[0] ?? null,
        mayarInvoiceId: due.mayarInvoiceId,
      }))}
    />
  );
}
