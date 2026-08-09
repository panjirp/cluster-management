/**
 * Logika jadwal pengingat iuran kas untuk app Android (local notifications).
 * Fungsi MURNI — bisa diuji/simulasi tanpa perangkat Android.
 *
 * Aturan:
 * - Pengingat dikirim tanggal 1, 10, dan 25 setiap bulan, jam 07:00.
 * - HANYA jika warga BELUM membayar iuran bulan berjalan (paid = false).
 * - Jika sudah bayar → tidak ada jadwal (app juga membatalkan jadwal lama).
 */

export type ReminderItem = {
  /** id unik di Capacitor LocalNotifications: 1101 (tgl 1), 1110 (tgl 10), 1125 (tgl 25) */
  id: number;
  day: number;
  hour: number;
  minute: number;
  title: string;
  body: string;
  url: string;
};

export const REMINDER_DAYS = [1, 10, 25] as const;
export const REMINDER_HOUR = 7;
export const REMINDER_MINUTE = 0;

export const BODIES: Record<number, string> = {
  1: "Awal bulan nih! Yuk segera bayar iuran kas Barcelona Cove biar tidak menumpuk. Terima kasih 🙏",
  10: "Pengingat iuran kas bulan ini ya. Kalau belum bayar, yuk diselesaikan. Terima kasih 🙏",
  25: "Hampir akhir bulan! Segera bayar iuran kas bulan ini kalau belum ya. Terima kasih 🙏",
};

/**
 * Menghasilkan daftar pengingat yang HARUS dijadwalkan saat ini.
 * @param now tanggal/waktu sekarang (untuk simulasi bisa diganti tanggal lain)
 * @param paid true jika warga sudah membayar iuran bulan berjalan
 */
export function getReminderSchedule(now: Date, paid: boolean): ReminderItem[] {
  if (paid) return [];

  const items: ReminderItem[] = [];
  for (const day of REMINDER_DAYS) {
    const fireAt = new Date(now.getFullYear(), now.getMonth(), day, REMINDER_HOUR, REMINDER_MINUTE, 0);
    // Hanya jadwalkan tanggal yang belum lewat bulan ini (yang lewat sudah tidak relevan)
    if (fireAt.getTime() > now.getTime()) {
      items.push({
        id: 1100 + day,
        day,
        hour: REMINDER_HOUR,
        minute: REMINDER_MINUTE,
        title: "💸 Iuran Kas Barcelona Cove",
        body: BODIES[day] ?? "Jangan lupa bayar iuran kas bulan ini ya. Terima kasih 🙏",
        url: "/cash/dues",
      });
    }
  }
  return items;
}

/** Daftar id pengingat (untuk cancel saat sudah bayar). */
export const REMINDER_IDS: number[] = REMINDER_DAYS.map((d) => 1100 + d);
