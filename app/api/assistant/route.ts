import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";

const shiftLabels: Record<string, string> = {
  PAGI: "Pagi",
  SIANG: "Siang",
  MALAM: "Malam",
  OFF: "Libur",
};

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(date);
}

// Fallback LLM: DeepSeek via OpenCode Zen (gratis, server-side)
async function askDeepSeek(question: string): Promise<string | null> {
  const base = process.env.OPENCODE_ZEN_BASE_URL?.replace(/\/+$/, "");
  const key = process.env.OPENCODE_ZEN_API_KEY;
  if (!base || !key) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "deepseek-v4-flash-free",
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah asisten portal warga Barcelona Cove (perumahan RT 003/RW 031). Jawab dalam bahasa Indonesia yang ramah, singkat (maks 4-5 kalimat), dan praktis. Boleh pakai emoji secukupnya. Jangan sebutkan bahwa kamu model AI/LLM. Jika ditanya hal di luar konteks warga/portal, jawab singkat dan sopan.",
          },
          { role: "user", content: question },
        ],
        max_tokens: 800,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    const reasoning: string | undefined = data?.choices?.[0]?.message?.reasoning_content;
    const answer = (content ?? "").trim();
    return answer.length > 0 ? answer : (reasoning ?? "").trim().slice(-600) || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const { message } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    }

    const q = message.toLowerCase();
    const suggestions = [
      "Siapa satpam jaga hari ini?",
      "Cara lapor pengaduan",
      "Acara terdekat",
      "Cara pinjam fasilitas",
      "Nomor darurat",
      "Cara aktifkan notifikasi",
    ];

    let reply = "";

    // Cari penghuni rumah: "bc 03 27 siapa", "bc0327", "blok 3 unit 27", dll.
    const houseMatch = q.match(/\bbc\s*(\d{1,2})[\s-]*(\d{1,2})\b/);
    if (houseMatch && !/(login|password|sandi|lupa|email|akun)/.test(q)) {
      const block = String(parseInt(houseMatch[1], 10)); // buang nol di depan
      const unit = houseMatch[2].padStart(2, "0");
      const blockNumber = `BC${block}-${unit}`;
      const house = await prisma.house.findUnique({
        where: { blockNumber },
        include: { residents: { select: { name: true, role: true } } },
      });
      if (!house) {
        reply = `Tidak ditemukan data rumah *${blockNumber}* (blok ${block} unit ${unit}).\n\nPastikan formatnya benar, contoh: *bc 03 27*, *bc0327*, atau *blok 3 unit 27*.`;
      } else {
        const names: string[] = [];
        if (house.residentName) {
          for (const n of house.residentName.split("/").map((s) => s.trim())) {
            if (!names.includes(n)) names.push(n);
          }
        }
        for (const r of house.residents) {
          if (!names.includes(r.name)) names.push(r.name);
        }
        reply = `🏠 Rumah *${house.blockNumber}* (Blok ${block} Unit ${unit}):\n${
          names.length > 0
            ? names.map((n) => `• ${n}`).join("\n")
            : "Belum ada nama yang tercatat di data warga."
        }`;
      }
    } else if (/(satpam|jaga|keamanan|shift)/.test(q)) {
      const satpam = await prisma.directoryMember.findMany({
        where: { roleType: "SATPAM", scheduleShift: { not: null } },
        orderBy: [{ scheduleShift: "asc" }, { fullName: "asc" }],
      });
      const onDuty = satpam.filter((s) => s.scheduleShift !== "OFF");
      if (onDuty.length === 0) {
        reply = "Saat ini belum ada jadwal satpam terdaftar. Cek menu **Direktori** untuk kontak pengurus.";
      } else {
        const lines = onDuty.map((s) => `• *${shiftLabels[s.scheduleShift ?? ""] ?? s.scheduleShift}*: ${s.fullName} (${s.phone})`);
        reply = `Berikut jadwal satpam yang tercatat saat ini:\n${lines.join("\n")}\n\nDetail lengkap ada di menu **Direktori**.`;
      }
    } else if (/(darurat|sos|emergency|keadaan)/.test(q)) {
      const setting = await prisma.setting.findUnique({ where: { id: "singleton" } });
      reply = `Untuk keadaan darurat:\n• Ketuk tombol merah **Darurat** di menu navigasi\n• Konfirmasi *"benar-benar darurat"* → pengurus langsung dapat notifikasi & WhatsApp${
        setting?.emergencyNotifyPhone ? ` (${setting.emergencyNotifyPhone})` : ""
      }\n\n⚠️ Gunakan hanya jika benar-benar darurat. Untuk kondisi mengancam nyawa, tetap hubungi *112* atau polisi/ambulans terlebih dahulu.`;
    } else if (/(pengaduan|lapor|keluhan|aduan)/.test(q)) {
      reply =
        "Cara melapor pengaduan:\n1. Buka menu **Pengaduan**\n2. Ketuk **Buat Pengaduan**\n3. Pilih kategori (Fasilitas, Keamanan, Kebisingan, Kebersihan, dll.)\n4. Isi judul & keterangan, boleh lampirkan foto\n5. Pengurus akan menindaklanjuti — statusnya bisa kamu pantau di halaman Pengaduan.";
    } else if (/(izin|perizinan|surat pengantar|renovasi|tamu)/.test(q)) {
      reply =
        "Cara mengajukan perizinan:\n1. Buka menu **Perizinan**\n2. Ketuk **Ajukan Izin**\n3. Pilih jenis izin (Renovasi, Acara, Tamu Kendaraan, Surat Pengantar, dll.)\n4. Lengkapi tanggal & dokumen pendukung\n5. Status persetujuan bisa dipantau di halaman Perizinan.";
    } else if (/(notif|push|pemberitahuan)/.test(q)) {
      reply =
        "Cara mengaktifkan notifikasi:\n• Buka aplikasi → **scroll ke bawah** → tap **\"Aktifkan Notifikasi\"** → **Izinkan** ✅\n\nDi HP Android, pastikan juga izin notifikasi aplikasi menyala di Pengaturan HP. Pengumuman penting dari pengurus akan muncul di lonceng notifikasi & push ke HP kamu.";
    } else if (/(login|password|sandi|lupa)/.test(q)) {
      reply =
        "Info akun:\n• Username = alamat email rumah, format `nomorrumah@barcelona.cove` (contoh: `bc0101@barcelona.cove`)\n• Password default: `barcelona123`\n• Saat login pertama, kamu **wajib ganti password**\n• Ganti password kapan saja lewat menu **Profil → Ganti Password**.";
    } else if (/(acara|event|kegiatan|agenda)/.test(q)) {
      const events = await prisma.event.findMany({
        where: { eventDate: { gte: new Date() } },
        orderBy: { eventDate: "asc" },
        take: 3,
      });
      if (events.length === 0) {
        reply = "Belum ada acara mendatang. Pantau menu **Info & Acara** untuk update terbaru.";
      } else {
        const lines = events.map(
          (e) => `• *${e.title}* — ${formatEventDate(e.eventDate)}${e.location ? ` (${e.location})` : ""}`
        );
        reply = `Acara terdekat:\n${lines.join("\n")}\n\nKetuk **Hadir** di detail acara biar pengurus tahu estimasi peserta!`;
      }
    } else if (/(fasilitas|booking|pinjam|sewa|casa|club|lapangan|olahraga|taman)/.test(q)) {
      reply =
        "Peminjaman fasilitas umum (*Casa Club*, *Lapangan Olahraga*, *Taman Bermain Anak*):\n1. Buka menu **Fasilitas** — lihat jadwal pemakaian\n2. Ketuk **Ajukan Pemakaian**\n3. Jenis izin otomatis *Acara*, pilih tanggal pemakaian\n4. Tunggu persetujuan pengurus — statusnya di halaman Perizinan.";
    } else if (/(cctv|kamera|pantau)/.test(q)) {
      reply = "Kamu bisa melihat pantauan kamera keamanan di menu **CCTV**. (Akses sesuai ketentuan pengurus.)";
    } else if (/(peta|map|denah|klaster)/.test(q)) {
      reply = "Denah / peta klaster bisa dilihat di menu **Peta Klaster**.";
    } else if (/(direktori|pengurus|kontak|telepon|hubungi)/.test(q)) {
      const members = await prisma.directoryMember.findMany({
        orderBy: [{ roleType: "asc" }, { position: "asc" }],
      });
      const lines = members.map((m) => `• *${m.fullName}* — ${m.position} (${m.phone})`);
      reply = `Kontak pengurus & satpam:\n${lines.join("\n")}\n\nBisa langsung telepon/WA. Detail lengkap di menu **Direktori**.`;
    } else if (/(iuran|kas|bayar|uang)/.test(q)) {
      reply =
        "Untuk saat ini, menu *Uang Kas* & *Pembayaran Kas* untuk warga sedang dinonaktifkan sementara oleh pengurus. Jika ada pertanyaan soal iuran, hubungi bendahara lewat menu **Direktori**.";
    } else if (/(surat|edaran|arsip)/.test(q)) {
      reply = "Arsip surat edaran resmi bisa dibuka di menu **Surat Edaran** (format PDF, bisa diunduh).";
    } else if (/(chat|forum|diskusi)/.test(q)) {
      reply = "Menu **Chat Warga** adalah grup percakapan satu-sama-lain seluruh warga. Kirim info, tanya-tanya, atau sekadar menyapa!";
    } else if (/(instagram|ig|sosmed|media sosial)/.test(q)) {
      reply = "Instagram resmi: **@barcelonacoveofficial** — link-nya ada di menu bawah aplikasi.";
    } else if (/(qr|kartu warga|identitas)/.test(q)) {
      reply = "Kartu Warga Digital (QR) ada di **Profil → Lihat Kartu Warga (QR)**. Tunjukkan ke satpam saat diminta.";
    } else {
      // Pertanyaan umum → jawab dengan DeepSeek (gratis via OpenCode Zen)
      const aiAnswer = await askDeepSeek(message.trim());
      reply =
        aiAnswer ??
        "Halo! 👋 Aku asisten portal Barcelona Cove. Aku bisa bantu soal:\n• Jadwal & kontak satpam\n• Cara lapor pengaduan / izin\n• Acara terdekat & pinjam fasilitas\n• Notifikasi, akun, surat edaran, dan lainnya\n\nCoba ketik salah satu topik di atas, atau pilih pertanyaan cepat di bawah.";
    }

    return NextResponse.json({ reply, suggestions });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
