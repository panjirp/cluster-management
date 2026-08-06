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
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/complaints", label: "Pengaduan", icon: MessageSquareWarning },
  { href: "/permits", label: "Perizinan", icon: FileCheck2 },
  { href: "/cash", label: "Uang Kas", icon: Wallet },
  { href: "/cash/dues/proof-submit", label: "Pembayaran Kas", icon: Upload },
  { href: "/map", label: "Peta Klaster", icon: Map },
  { href: "/cctv", label: "CCTV", icon: Video },
  { href: "/directory", label: "Direktori", icon: Contact },
  { href: "/events", label: "Info & Acara", icon: CalendarDays },
];

export const bendaharaNavItems: NavItem[] = [
  { href: "/cash/dues/reminders", label: "Kirim Pengingat WA", icon: Send },
];

export const adminNavItems: NavItem[] = [
  { href: "/admin/houses", label: "Data Rumah", icon: Home },
  { href: "/admin/residents", label: "Data Warga", icon: Users },
  { href: "/admin/map-editor", label: "Editor Posisi Peta", icon: MapPin },
  { href: "/admin/activity-log", label: "Log Aktivitas", icon: History },
  { href: "/admin/payment-proofs", label: "Review Bukti", icon: FileCheck2 },
];
