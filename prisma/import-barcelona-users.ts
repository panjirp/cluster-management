import "dotenv/config";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

/**
 * Import akun login warga dari file JSON (hasil transformasi Excel).
 * Setiap baris: { name, email, password, block, unit, blockNumber }
 * - Email: bcXXYY@barcelona.cove
 * - Password: barcelona123 (di-hash bcrypt)
 * - Role: WARGA, dikaitkan ke rumah (House) via blockNumber "BC{block}-{unit:02}"
 * Upsert berdasarkan email -> idempotent (aman dijalankan ulang).
 */

const JSON_PATH =
  process.env.BARCELONA_USERS_JSON ??
  "C:\\Users\\jiaul\\Downloads\\barcelona_users.json";

async function main() {
  const records = JSON.parse(
    fs.readFileSync(JSON_PATH, "utf-8")
  ) as Array<{
    name: string;
    email: string;
    password: string;
    block: number;
    unit: number;
    blockNumber: string;
  }>;

  console.log(`Total data: ${records.length}`);

  // Ambil semua rumah yang ada (blockNumber -> id)
  const houses = await prisma.house.findMany({
    select: { id: true, blockNumber: true },
  });
  const houseMap = new Map(houses.map((h) => [h.blockNumber, h.id]));

  // Pre-hash password sekali saja (sama untuk semua)
  const passwordHash = await bcrypt.hash("barcelona123", 10);

  let created = 0;
  let updated = 0;
  let existing = 0;
  let houseMissing = 0;

  for (const rec of records) {
    const houseId = houseMap.get(rec.blockNumber) ?? null;
    if (!houseId) {
      houseMissing++;
      console.log(`  ! Rumah tidak ditemukan: ${rec.blockNumber} (${rec.email})`);
    }

    const prev = await prisma.user.findUnique({
      where: { email: rec.email },
      select: { id: true, passwordHash: true },
    });

    if (prev) {
      // Jika password beda, perbarui; jika sama, biarkan.
      const samePassword = await bcrypt.compare(rec.password, prev.passwordHash);
      if (!samePassword || prev.passwordHash === "") {
        await prisma.user.update({
          where: { id: prev.id },
          data: { passwordHash },
        });
      }
      // Pastikan terhubung ke rumah & role WARGA
      await prisma.user.update({
        where: { id: prev.id },
        data: { houseId: houseId ?? undefined, role: "WARGA" },
      });
      existing++;
    } else {
      await prisma.user.create({
        data: {
          name: rec.name,
          email: rec.email,
          passwordHash,
          role: "WARGA",
          houseId,
        },
      });
      created++;
    }
  }

  console.log("\n=== HASIL IMPORT ===");
  console.log(`Dibuat baru (created) : ${created}`);
  console.log(`Sudah ada (existing)  : ${existing}`);
  console.log(`Rumah tidak ditemukan : ${houseMissing}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
