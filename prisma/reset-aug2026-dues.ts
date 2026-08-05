import "dotenv/config";
import { prisma } from "../lib/prisma";

/**
 * Script untuk MERESET status pembayaran iuran bulanan (MonthlyDue)
 * Agustus 2026 menjadi BELUM BAYAR.
 *
 * Penggunaan:
 *   tsx prisma/reset-aug2026-dues.ts --preview   -> hanya menampilkan dampak (read-only)
 *   tsx prisma/reset-aug2026-dues.ts --reset     -> menjalankan perubahan
 */

const YEAR = 2026;
const MONTH = 8; // Agustus

async function main() {
  const mode = process.argv.includes("--reset") ? "reset" : "preview";

  const dues = await prisma.monthlyDue.findMany({
    where: { year: YEAR, month: MONTH },
    include: { _count: { select: { paymentProofs: true } } },
  });

  const paid = dues.filter((d) => d.isPaid);
  const withProofs = dues.filter((d) => d._count.paymentProofs > 0);

  console.log(`\n=== PREVIEW iuran ${YEAR}-${String(MONTH).padStart(2, "0")} ===`);
  console.log(`Total iuran           : ${dues.length}`);
  console.log(`Sudah dibayar (isPaid): ${paid.length}`);
  console.log(`Belum dibayar         : ${dues.length - paid.length}`);
  console.log(`Ada bukti bayar       : ${withProofs.length}`);
  console.log(`Total nominal (semua) : Rp ${dues.reduce((s, d) => s + d.amount, 0).toLocaleString("id-ID")}`);

  if (mode !== "reset") {
    console.log("\nMode PREVIEW (read-only). Jalankan dengan --reset untuk mengubah data.\n");
    return;
  }

  // --- EKSEKUSI RESET ---
  const result = await prisma.monthlyDue.updateMany({
    where: { year: YEAR, month: MONTH },
    data: {
      isPaid: false,
      paidAt: null,
      paymentProofUrl: null,
      mayarInvoiceId: null,
    },
  });

  console.log(`\n[RESET DONE] Data diubah: ${result.count} iuran ${YEAR}-${String(MONTH).padStart(2, "0")} di-set BELUM BAYAR.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
