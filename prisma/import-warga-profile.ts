import "dotenv/config";
import { prisma } from "../lib/prisma";
import { parseCsv } from "../lib/sheet-import";

/**
 * Import profil warga (nama, no. WA, status hunian) dari Google Form pendataan warga.
 *
 * Spreadsheet "Data Warga RT 003/031" punya 7 tab (satu per blok):
 *   gid 1903311078 -> blok 01 | gid 27173634 -> blok 03 | gid 201171390 -> blok 05
 *   gid 302115694  -> blok 07 | gid 983495518 -> blok 09 | gid 1024290075 -> blok 11
 *   gid 467689277  -> blok 15
 *
 * Format setiap tab (hasil export Google Form):
 *   Timestamp | Alamat Rumah (contoh: BC 06/24) | Nama Kepala Keluarga/Suami |
 *   Usia Kepala Keluarga/Suami | Nama Istri | Usia Istri | No. Whatsapp | ...
 *   ... | Status Hunian | Masa Berakhir Sewa? (Jika Anda Penyewa)
 *
 * Pemetaan:
 *   - Alamat "BC 01/03", "Bc 11/8", "BC 15 no. 06" -> House.blockNumber "BC1-03"
 *   - Nama  -> User.name = "Nama KK / Nama Istri" (jika istri ada) & House.residentName
 *   - No. WA -> User.phone & House.contactPhone
 *   - Status Hunian:
 *       mengandung "pemilik"/"dihuni"     -> PEMILIK  / DITEMPATI
 *       mengandung "sewa"/"kontrak"        -> KONTRAK  / DIKONTRAKKAN
 *
 * Penanganan duplikat (rumah diisi >1 responden):
 *   - Entri paling akhir (paling baru di sheet) menang untuk nama & status.
 *   - Nomor WA dari SEMUA entri digabung (unik).
 * Idempotent & aman: rumah yang tidak ditemukan dilewati dengan log.
 */

const SHEET_ID = process.env.WARGA_PROFILE_SHEET_ID ?? "1hXc5_Tod3KhgW6OhdP_MM4ZqYPc8bTxf5KCsIU7-G8A";

const GIDS = (process.env.WARGA_PROFILE_SHEET_GIDS ?? "1903311078,27173634,201171390,302115694,983495518,1024290075,467689277")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** "BC 01/03" | "Bc 11/8" | "BC 15 no. 06" -> "BC1-03" */
function mapHouseCode(code: string): string | null {
  const m = code.trim().match(/^BC\s*(\d+)\s*(?:\/|(?:no\.?|nomor)?\s*)\s*(\d+)$/i);
  if (!m) return null;
  const block = parseInt(m[1], 10);
  const unit = parseInt(m[2], 10);
  return `BC${block}-${unit.toString().padStart(2, "0")}`;
}

function cleanName(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

const NO_WIFE = ["belum menikah", "tidak ada", "-", "", "single", "jomblo"];

/** Normalisasi no. WA: pecah "A / B", ambil yang valid, gabung " / ". */
function normalizePhones(raw: string): string[] {
  return raw
    .split("/")
    .map((p) => p.trim().replace(/[^0-9+]/g, ""))
    .filter((p) => p.length >= 9);
}

function mapStatus(raw: string): { residencyStatus: "PEMILIK" | "KONTRAK"; houseStatus: "DITEMPATI" | "DIKONTRAKKAN" } | null {
  const s = raw.toLowerCase();
  // Catatan: "Penyewa" TIDAK mengandung substring "sewa" (pe-nye-wa),
  // jadi cocokkan juga "nyewa".
  if (/(sewa|nyewa|kontrak|ngontrak)/.test(s)) {
    return { residencyStatus: "KONTRAK", houseStatus: "DIKONTRAKKAN" };
  }
  if (s.includes("pemilik") || s.includes("dihuni") || s.includes("anggota keluarga")) {
    return { residencyStatus: "PEMILIK", houseStatus: "DITEMPATI" };
  }
  return null;
}

type RawEntry = {
  gid: string;
  order: number; // urutan global (tab demi tab, baris demi baris) — makin besar makin baru
  blockNumber: string;
  name: string;
  phones: string[];
  status: { residencyStatus: "PEMILIK" | "KONTRAK"; houseStatus: "DITEMPATI" | "DIKONTRAKKAN" } | null;
  rawStatus: string;
};

async function fetchTab(gid: string, baseOrder: number): Promise<{ entries: RawEntry[]; nextOrder: number }> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`  ! Tab gid=${gid} gagal diambil (${res.status}) — dilewati.`);
    return { entries: [], nextOrder: baseOrder };
  }
  const rows = parseCsv(await res.text());
  if (rows.length < 2) {
    console.log(`  ! Tab gid=${gid} kosong — dilewati.`);
    return { entries: [], nextOrder: baseOrder };
  }

  const header = rows[0].map((h) => h.trim());
  const idxAddress = header.findIndex((h) => h.toLowerCase().includes("alamat rumah"));
  const idxName = header.findIndex((h) => h.toLowerCase().includes("nama kepala keluarga"));
  const idxWife = header.findIndex((h) => h.toLowerCase().includes("nama istri"));
  const idxPhone = header.findIndex((h) => h.toLowerCase().includes("no. whatsapp") || h.toLowerCase().includes("whatsapp"));
  const idxStatus = header.findIndex((h) => h.toLowerCase().includes("status hunian"));
  if (idxAddress === -1 || idxName === -1 || idxStatus === -1) {
    console.log(`  ! Tab gid=${gid} header tidak dikenali — dilewati.`);
    return { entries: [], nextOrder: baseOrder };
  }

  const entries: RawEntry[] = [];
  let order = baseOrder;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const blockNumber = mapHouseCode(row[idxAddress] ?? "");
    if (!blockNumber) continue;
    const headName = cleanName(row[idxName] ?? "");
    if (!headName) continue;
    const wifeRaw = idxWife !== -1 ? cleanName(row[idxWife] ?? "") : "";
    const wifeName = NO_WIFE.includes(wifeRaw.toLowerCase()) ? "" : wifeRaw;
    const name = wifeName ? `${headName} / ${wifeName}` : headName;
    const phones = idxPhone !== -1 ? normalizePhones(row[idxPhone] ?? "") : [];
    const rawStatus = (row[idxStatus] ?? "").trim();
    entries.push({
      gid,
      order: order++,
      blockNumber,
      name,
      phones,
      status: mapStatus(rawStatus),
      rawStatus,
    });
  }
  return { entries, nextOrder: order };
}

async function main() {
  // 1) Kumpulkan SEMUA entri dari semua tab
  const all: RawEntry[] = [];
  let order = 0;
  for (const gid of GIDS) {
    const { entries, nextOrder } = await fetchTab(gid, order);
    all.push(...entries);
    order = nextOrder;
  }
  console.log(`Total entri dari semua tab: ${all.length}`);

  // 2) Gabungkan per rumah: entri terakhir menang (nama & status), WA digabung
  const byHouse = new Map<string, RawEntry[]>();
  for (const e of all) {
    const arr = byHouse.get(e.blockNumber) ?? [];
    arr.push(e);
    byHouse.set(e.blockNumber, arr);
  }

  const merged: { blockNumber: string; name: string; phones: string[]; status: RawEntry["status"]; dup: boolean }[] = [];
  for (const [blockNumber, arr] of byHouse) {
    const sorted = [...arr].sort((a, b) => a.order - b.order);
    const last = sorted[sorted.length - 1];
    const phoneSet = new Set<string>();
    sorted.forEach((e) => e.phones.forEach((p) => phoneSet.add(p)));
    merged.push({
      blockNumber,
      name: last.name,
      phones: [...phoneSet],
      status: last.status,
      dup: arr.length > 1,
    });
  }
  merged.sort((a, b) => a.blockNumber.localeCompare(b.blockNumber));
  console.log(`Rumah unik: ${merged.length}\n`);

  const houses = await prisma.house.findMany({ select: { id: true, blockNumber: true } });
  const houseMap = new Map(houses.map((h) => [h.blockNumber, h.id]));

  let updated = 0;
  let userUpdated = 0;
  let houseMissing: string[] = [];

  for (const rec of merged) {
    const houseId = houseMap.get(rec.blockNumber) ?? null;
    if (!houseId) {
      houseMissing.push(rec.blockNumber);
      console.log(`  ! Rumah tidak ditemukan: ${rec.blockNumber} — dilewati.`);
      continue;
    }

    const phones = rec.phones.length ? rec.phones.join(" / ") : null;

    const houseData: Record<string, unknown> = {
      residentName: rec.name,
      ...(phones ? { contactPhone: phones } : {}),
      ...(rec.status ? { statusHuni: rec.status.houseStatus } : {}),
    };
    await prisma.house.update({ where: { id: houseId }, data: houseData });

    const users = await prisma.user.findMany({ where: { houseId }, select: { id: true, name: true, role: true } });
    const warga = users.find((u) => u.role === "WARGA") ?? users[0];
    if (warga) {
      await prisma.user.update({
        where: { id: warga.id },
        data: {
          name: rec.name,
          ...(phones ? { phone: phones } : {}),
          ...(rec.status ? { residencyStatus: rec.status.residencyStatus } : {}),
        },
      });
      userUpdated++;
    }
    updated++;
    console.log(
      `  ${rec.dup ? "⚠" : "✓"} ${rec.blockNumber}: ${rec.name} | WA: ${phones ?? "-"} | ${rec.status ? rec.status.residencyStatus : "-"}`
    );
  }

  console.log("\n=== HASIL IMPORT PROFIL WARGA (SEMUA BLOK) ===");
  console.log(`Rumah diperbarui       : ${updated}`);
  console.log(`User (akun) diupdate   : ${userUpdated}`);
  console.log(`Rumah tidak ditemukan  : ${houseMissing.length} ${houseMissing.length ? "(" + houseMissing.join(", ") + ")" : ""}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
