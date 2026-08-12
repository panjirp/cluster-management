import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DuesManagement from "@/components/admin/DuesManagement";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Manajemen Iuran | Admin",
};

export default async function AdminDuesPage() {
  const session = await requireUser();

  if (session.user.role !== "ADMIN" && session.user.role !== "BENDAHARA") {
    redirect("/dashboard");
  }

  // Ambil semua iuran yang sudah ada
  const dues = await prisma.monthlyDue.findMany({
    include: {
      house: {
        select: {
          id: true,
          blockNumber: true,
        },
      },
    },
    orderBy: [
      { year: "desc" },
      { month: "desc" },
      { house: { blockNumber: "asc" } },
    ],
  });

  const records = dues.map((d) => ({
    id: d.id,
    houseId: d.houseId,
    houseNumber: d.house.blockNumber,
    year: d.year,
    month: d.month,
    amount: d.amount,
    isPaid: d.isPaid,
    paidAt: d.paidAt ? d.paidAt.toISOString() : null,
    paymentProofUrl: d.paymentProofUrl,
  }));

  // Ambil semua rumah
  const allHouses = await prisma.house.findMany({
    select: { id: true, blockNumber: true },
    orderBy: { blockNumber: "asc" },
  });

  // Rumah yang sudah pernah punya record iuran
  const housesWithDues = new Set(dues.map((d) => d.houseId));

  // Rumah yang BELUM PERNAH bayar sama sekali
  const neverPaidHouses = allHouses
    .filter((h) => !housesWithDues.has(h.id))
    .map((h) => ({
      id: `never-${h.id}`,
      houseId: h.id,
      houseNumber: h.blockNumber,
      year: 0,
      month: 0,
      amount: 0,
      isPaid: false,
      paidAt: null,
      paymentProofUrl: null,
      neverPaid: true,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Iuran Bulanan</h1>
        <p className="text-muted-foreground">
          Kelola status pembayaran iuran warga. Rumah yang "Belum Pernah Bayar" berarti belum pernah ada transaksi iuran sama sekali.
        </p>
      </div>

      {/* Daftar iuran yang sudah ada */}
      <DuesManagement records={records} />

      {/* Rumah yang Belum Pernah Bayar sama sekali */}
      {neverPaidHouses.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4 text-amber-600">
              Belum Pernah Bayar ({neverPaidHouses.length} rumah)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Rumah-rumah ini belum pernah memiliki record iuran sama sekali. Ketika mereka mulai membayar, bulan pertama yang dibayar akan dihitung sampai sekarang.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Rumah</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {neverPaidHouses.map((h) => (
                    <tr key={h.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{h.houseNumber}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                          Belum Pernah Bayar
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
