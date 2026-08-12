import { prisma } from "../lib/prisma";

(async () => {
  const users = await prisma.user.findMany({
    where: { role: "WARGA" },
    select: { id: true },
  });

  const title = "📢 Fitur Baru Portal Barcelona Cove";
  const body = `1. Info Cuaca Real-Time ☀️ — cek cuaca, suhu, kualitas udara, & UV.
2. Status Lalu Lintas Perlintasan Kereta 🚂 — macet/lancar di Jl. Selang Cironggeng.
3. Jadwal KRL Metland Telaga Murni 🚆 — 5 keberangkatan berikutnya.
4. Pembayaran Iuran Bulanan 💰 — upload bukti bayar langsung dari HP.`;

  for (const user of users) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        title,
        body,
        url: "/dashboard",
      },
    });
  }

  console.log(`Sent to ${users.length} warga`);
  await prisma.$disconnect();
})();
