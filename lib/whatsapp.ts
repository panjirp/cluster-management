function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

export function buildWaLink(phone: string, text?: string) {
  const normalized = normalizePhone(phone);
  return text ? `https://wa.me/${normalized}?text=${encodeURIComponent(text)}` : `https://wa.me/${normalized}`;
}

export function buildDuesReminderUrl(
  phone: string,
  blockNumber: string,
  month: string,
  year: number,
  amount: number
) {
  const nominal = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    amount
  );
  const text = `Yth. Warga Blok ${blockNumber}, kami informasikan iuran bulan ${month} ${year} sebesar ${nominal} belum terbayar. Mohon segera melakukan pembayaran. Terima kasih — Pengurus Barcelona Cove.`;
  return buildWaLink(phone, text);
}
