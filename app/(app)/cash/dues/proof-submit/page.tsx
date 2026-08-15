import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ProofSubmitClient } from "./proof-submit-client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pengajuan Pembayaran Kas",
  description: "Upload bukti pembayaran kas bulanan",
};

/** Generate array bulan dari startYear/startMonth sampai sekarang */
function generateMonthRange(startYear: number, startMonth: number) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const months: { year: number; month: number }[] = [];
  let y = startYear;
  let m = startMonth;

  while (y < currentYear || (y === currentYear && m <= currentMonth)) {
    months.push({ year: y, month: m });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  // URUTAN: tahun kecil di bawah → tahun besar di atas (reverse)
  return months.reverse();
}

export default async function ProofSubmitPage() {
  const session = await requireUser();

  const role: string = session.user.role;
  if (role !== "WARGA") {
    redirect("/cash/dues");
  }

  const houseId = session.user.houseId;
  if (!houseId) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Pengajuan Pembayaran Kas</h1>
          <p className="text-sm text-muted-foreground">Upload bukti pembayaran kas bulanan</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Anda belum terhubung ke data rumah. Hubungi admin.
          </CardContent>
        </Card>
      </div>
    );
  }

  const house = await prisma.house.findUnique({ where: { id: houseId } });

  // Ambil semua record iuran rumah ini
  const existingDues = await prisma.monthlyDue.findMany({
    where: { houseId },
    orderBy: [{ year: "asc" }, { month: "asc" }],
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

  const neverPaid = existingDues.length === 0;

  let displayDues: any[] = [];

  if (neverPaid) {
    displayDues = [];
  } else {
    const firstDue = existingDues[0];
    const startYear = firstDue.year;
    const startMonth = firstDue.month;

    const allMonths = generateMonthRange(startYear, startMonth);
    // allMonths sekarang: bulan sekarang di index 0, bulan pertama di index terakhir

    const dueMap = new Map<string, (typeof existingDues)[0]>();
    for (const d of existingDues) {
      dueMap.set(`${d.year}-${d.month}`, d);
    }

    displayDues = allMonths.map(({ year, month }) => {
      const existing = dueMap.get(`${year}-${month}`);
      if (existing) {
        return {
          id: existing.id,
          year: existing.year,
          month: existing.month,
          amount: existing.amount,
          isPaid: existing.isPaid,
          proof: existing.paymentProofs[0] ?? null,
          mayarInvoiceId: existing.mayarInvoiceId,
        };
      } else {
        // Bulan ini belum ada record = belum serah terima
        return {
          id: `placeholder-${year}-${month}`,
          year,
          month,
          amount: 0,
          isPaid: false,
          proof: null,
          mayarInvoiceId: null,
          isPlaceholder: true,
          label: "Menunggak",
        };
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pengajuan Pembayaran Kas</h1>
        <p className="text-sm text-muted-foreground">
          {neverPaid
            ? "Anda belum pernah membayar kas. Bulan pertama yang Anda bayar akan dihitung sampai sekarang."
            : "Upload bukti pembayaran kas bulanan"}
        </p>
      </div>

      {neverPaid && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Badge className="bg-amber-500 text-white mt-0.5">Info</Badge>
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-200">Belum Pernah Bayar</p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  Rumah Anda belum pernah memiliki catatan kas. Saat Anda mengajukan pembayaran pertama kali, bulan yang dipilih akan menjadi bulan mulai bayar dan akan dihitung sampai sekarang.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ProofSubmitClient
        initialDues={displayDues}
        houseBlock={house?.blockNumber ?? "—"}
        wargaName={session.user.name ?? "Warga"}
      />
    </div>
  );
}
