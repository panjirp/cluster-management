import { prisma } from "@/lib/prisma";
import { parseDuesAccessHouseIds } from "@/lib/cash";

/**
 * Cek apakah sebuah rumah (houseId) masuk whitelist akses "Uang Kas"/"Iuran Kas"
 * utk WARGA (Setting.duesAccessHouseIds, mis. ["BC3-22"]). Non-warga → selalu boleh.
 * Server-only: mengakses prisma, jangan diimpor dari client component.
 */
export async function wargaCanViewCash(role: string, houseId: string | null): Promise<boolean> {
  if (role !== "WARGA") return true;
  if (!houseId) return false;
  const [setting, house] = await Promise.all([
    prisma.setting.findUnique({ where: { id: "singleton" }, select: { duesAccessHouseIds: true } }),
    prisma.house.findUnique({ where: { id: houseId }, select: { blockNumber: true } }),
  ]);
  if (!house) return false;
  const allowed = parseDuesAccessHouseIds(setting?.duesAccessHouseIds);
  return allowed.includes(house.blockNumber.toUpperCase());
}
