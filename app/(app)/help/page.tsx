import type { Metadata } from "next";
import Link from "next/link";
import {
  MessageSquareWarning,
  FileCheck2,
  Wallet,
  Map,
  Video,
  Contact,
  CalendarDays,
  KeyRound,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Bantuan" };

const sections = [
  {
    icon: MessageSquareWarning,
    title: "Pengaduan",
    href: "/complaints",
    body: "Laporkan masalah di lingkungan cluster (kebersihan, keamanan, fasilitas, dll). Admin akan memproses dan memberi tanggapan — kamu akan dapat notifikasi kalau statusnya berubah.",
  },
  {
    icon: FileCheck2,
    title: "Perizinan",
    href: "/permits",
    body: "Ajukan izin renovasi, kegiatan/acara, tamu/kendaraan, atau surat pengantar RT/RW. Untuk izin kegiatan, kamu bisa sekalian booking aset (tenda, kursi, sound system). Setelah disetujui, surat resmi PDF akan otomatis dibuat.",
  },
  {
    icon: Wallet,
    title: "Uang Kas",
    href: "/cash",
    body: "Lihat transparansi kas cluster (pemasukan/pengeluaran) dan status iuran bulanan rumahmu. Bendahara bisa menambah transaksi manual atau menarik data dari Google Sheets.",
  },
  {
    icon: Map,
    title: "Peta Klaster",
    href: "/map",
    body: "Lihat denah cluster dan status hunian tiap rumah. Klik atau arahkan kursor ke tiap titik untuk detail.",
  },
  {
    icon: Video,
    title: "CCTV",
    href: "/cctv",
    body: "Pantau kamera keamanan cluster secara langsung (kalau sudah dikonfigurasi oleh admin).",
  },
  {
    icon: Contact,
    title: "Direktori",
    href: "/directory",
    body: "Kontak cepat pengurus RT/RW dan petugas keamanan — bisa langsung telepon atau chat WhatsApp.",
  },
  {
    icon: CalendarDays,
    title: "Info & Acara",
    href: "/events",
    body: "Info pengumuman dan acara cluster. Kamu bisa konfirmasi kehadiran (RSVP) untuk acara yang ada.",
  },
  {
    icon: KeyRound,
    title: "Profil & Keamanan",
    href: "/profile",
    body: "Ganti password dan perbarui nomor WhatsApp lewat menu Profil Saya (klik nama kamu di pojok kiri atas). Jangan bagikan password ke siapa pun.",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bantuan</h1>
        <p className="text-sm text-muted-foreground">Penjelasan singkat tiap menu di Barcelona Cove</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Card className="h-full transition-all duration-200 hover:border-primary/40 hover:shadow-md">
              <CardContent className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <section.icon className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="flex items-center justify-between font-medium">
                    {section.title}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </p>
                  <p className="text-sm text-muted-foreground">{section.body}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
