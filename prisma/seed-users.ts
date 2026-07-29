import "dotenv/config";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

function randomPassword() {
  return crypto.randomBytes(9).toString("base64url");
}

async function upsertUser(email: string, name: string, role: "ADMIN" | "BENDAHARA" | "WARGA", envVar: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { email, password: "(sudah ada, password tidak diubah)" };
  }

  const password = process.env[envVar] || randomPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({ data: { name, email, passwordHash, role } });

  return { email, password: process.env[envVar] ? "(dari env var)" : password };
}

async function main() {
  const results = await Promise.all([
    upsertUser("admin@barcelonacove.local", "Admin Barcelona Cove", "ADMIN", "SEED_ADMIN_PASSWORD"),
    upsertUser("bendahara@barcelonacove.local", "Bendahara Barcelona Cove", "BENDAHARA", "SEED_BENDAHARA_PASSWORD"),
    upsertUser("warga@barcelonacove.local", "Warga Barcelona Cove", "WARGA", "SEED_WARGA_PASSWORD"),
  ]);

  console.log("Akun dibuat/diperbarui (catat password ini, tidak akan ditampilkan lagi):");
  for (const r of results) {
    console.log(`  ${r.email} / ${r.password}`);
  }
  console.log("\nSegera login dan ganti password lewat halaman profil setelah deploy.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
