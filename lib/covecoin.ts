import { prisma } from "./prisma";

/**
 * Tambah CoveCoin ke user (earn). 1 CoveCoin = Rp 1.
 * Dipanggil otomatis saat aktivitas baik (bayar kas, ikut acara, upload FYP, dll).
 */
export async function awardCoveCoin(userId: string, amount: number, description: string) {
  if (!amount || amount <= 0) return;
  // Batasi supaya tidak dobel besar; pengaman sederhana: tiap award tercatat sebagai baris EARN.
  await prisma.coveCoinLedger.create({
    data: {
      userId,
      amount: Math.round(amount),
      type: "EARN",
      description,
    },
  });
}

/**
 * Award ke banyak user sekaligus (mis. semua penghuni rumah).
 */
export async function awardCoveCoinToMany(userIds: string[], amountPer: number, description: string) {
  if (userIds.length === 0 || amountPer <= 0) return;
  await prisma.coveCoinLedger.createMany({
    data: userIds.map((userId) => ({
      userId,
      amount: Math.round(amountPer),
      type: "EARN",
      description,
    })),
  });
}
