import {
  LayoutDashboard,
  MessageSquareWarning,
  FileCheck2,
  Wallet,
  Map,
  MapPin,
  Contact,
  CalendarDays,
  Home,
  Users,
  Video,
  History,
  Upload,
  Send,
  Siren,
  Megaphone,
  MessageCircle,
  Bell,
  Landmark,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat Warga", icon: MessageCircle },
  { href: "/complaints", label: "Pengaduan", icon: MessageSquareWarning },
  { href: "/permits", label: "Perizinan", icon: FileCheck2 },
  { href: "/cash", label: "Uang Kas", icon: Wallet },
  { href: "/cash/dues/proof-submit", label: "Pembayaran Kas", icon: Upload },
  { href: "/map", label: "Peta Klaster", icon: Map },
  { href: "/cctv", label: "CCTV", icon: Video },
  { href: "/facilities", label: "Fasilitas", icon: Landmark },
  { href: "/directory", label: "Direktori", icon: Contact },
  { href: "/events", label: "Info & Acara", icon: CalendarDays },
  { href: "/letters", label: "Surat Edaran", icon: FileText },
  { href: "/notifications", label: "Notifikasi", icon: Bell },
  { href: "/emergency", label: "Darurat", icon: Siren },
];

export const bendaharaNavItems: NavItem[] = [
  { href: "/cash/dues/reminders", label: "Kirim Pengingat WA", icon: Send },
  { href: "/admin/emergency", label: "Sinyal Darurat", icon: Siren },
];

export const adminNavItems: NavItem[] = [
  { href: "/admin/houses", label: "Data Rumah", icon: Home },
  { href: "/admin/residents", label: "Data Warga", icon: Users },
  { href: "/admin/emergency", label: "Sinyal Darurat", icon: Siren },
  { href: "/admin/notifications", label: "Kirim Pengumuman", icon: Megaphone },
  { href: "/admin/letters", label: "Surat Edaran", icon: FileText },
  { href: "/admin/map-editor", label: "Editor Posisi Peta", icon: MapPin },
  { href: "/admin/activity-log", label: "Log Aktivitas", icon: History },
  { href: "/admin/payment-proofs", label: "Review Bukti", icon: FileCheck2 },
];
