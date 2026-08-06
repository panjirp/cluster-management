const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

export function indonesianMonthName(month: number) {
  return MONTH_NAMES_ID[month - 1] ?? String(month);
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function buildWaLink(phone: string, text?: string) {
  const normalized = normalizePhone(phone);
  return text ? `https://wa.me/${normalized}?text=${encodeURIComponent(text)}` : `https://wa.me/${normalized}`;
}

export function buildDuesReminderText(
  blockNumber: string,
  month: string,
  year: number,
  amount: number,
  ownerName?: string | null
) {
  const nominal = formatRupiah(amount);
  const greeting = ownerName ? `Yth. Bapak/Ibu ${ownerName}` : `Yth. Warga Blok ${blockNumber}`;
  return `${greeting}, kami informasikan iuran bulan ${month} ${year} sebesar ${nominal} (Rumah Blok ${blockNumber}) belum terbayar. Mohon segera melakukan pembayaran melalui aplikasi cluster (menu Pembayaran Kas) atau hubungi bendahara. Terima kasih — Pengurus Barcelona Cove.`;
}

// ─── Fonnte WhatsApp Gateway ──────────────────────────────────────────────────

export class WhatsAppNotConfiguredError extends Error {}

type FonnteSendResult = {
  id?: string;
  status?: boolean;
  reason?: string;
};

/**
 * Kirim pesan WhatsApp via gateway Fonnte (https://fonnte.com).
 *
 * Token diambil dari env `FONNTE_TOKEN` (token device di dashboard Fonnte).
 * Nomor akan dinormalisasi ke format 62xxx.
 */
export async function sendWhatsAppMessage(phone: string, text: string): Promise<FonnteSendResult> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    throw new WhatsAppNotConfiguredError(
      "Gateway Fonnte belum dikonfigurasi. Set FONNTE_TOKEN di .env (token dari https://fonnte.com)."
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let res: Response;
  try {
    res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        target: normalizePhone(phone),
        message: text,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const data = (await res.json().catch(() => ({}))) as FonnteSendResult;
  if (!res.ok || data.status === false) {
    throw new Error(data.reason ? `Fonnte: ${data.reason}` : `Fonnte HTTP ${res.status}`);
  }
  return data;
}
