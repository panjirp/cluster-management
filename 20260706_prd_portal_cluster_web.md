# Product Requirement Document (PRD)
## Project: Portal Digital Klaster Perumahan (EcoCluster Hub)
**Version:** 4.0 (Final Comprehensive with Live CCTV & Dual Theme)  
**Author:** CRM Manager / Cluster Head[cite: 1]  
**Target Execution Platform:** Antigravity AI / Low-Code/AI Generator[cite: 1]  

---

## 1. Executive Summary & Feature Roadmap

Dokumen ini mendeskripsikan spesifikasi lengkap sistem portal digital klaster perumahan berbasis Web App (PWA)[cite: 1]. Sistem ini dirancang dengan gaya desain minimalis ala Google/Apple (clean, elegant, high-whitespace)[cite: 1] dan menggunakan Google Sheets sebagai database utama agar mudah dikelola oleh pengurus[cite: 1].

### Ringkasan Fitur Sistem (All Features Summary)
1. **PWA Capability (Add to Home Screen):** Warga bisa install aplikasi langsung dari browser HP tanpa Play Store/App Store[cite: 1].
2. **Theme Configuration (Light/Dark Mode):** Mendukung pergantian tema secara manual atau otomatis mendeteksi preferensi OS pengguna.
3. **Interactive Cluster Map:** Peta denah blok rumah interaktif yang terhubung langsung dengan status hunian dan kepatuhan IPL di Google Sheets[cite: 1].
4. **Smart Billing Reminder:** Sistem otomatisasi/trigger dari admin untuk mengirim pesan pengingat tagihan IPL via WhatsApp secara sopan[cite: 1].
5. **Community Feed & Event Portal:** Wadah informasi kegiatan warga dilengkapi dengan fitur RSVP kehadiran[cite: 1].
6. **Digital Bureaucracy & Permit Module:** Layanan mandiri bagi warga untuk mengurus izin kegiatan (tahlilan, khitanan, dll), izin renovasi, hingga surat pengantar RT/RW secara digital sampai cetak PDF resmi.
7. **Automated Asset Booking Engine:** Sistem peminjaman fasilitas bersama (tenda, kursi, sound system) yang terintegrasi langsung dengan form perizinan warga untuk mencegah bentrok jadwal.
8. **Cluster Directory:** Direktori digital yang menampilkan foto, profil, dan kontak WhatsApp aktif milik pengurus serta satpam klaster (lengkap dengan info *shift* kerja).
9. **Live CCTV Monitoring (EcoEye):** Fitur pemantauan CCTV area publik klaster secara real-time yang aman dan terproteksi privasinya.
10. **Ticketing Komplain ("Lapor Pak RT!"):** Fitur bagi warga untuk melaporkan kerusakan fasilitas umum atau gangguan ketertiban secara transparan beserta pelacakan statusnya.
11. **Digital Marketplace (Bazar Klaster):** Wadah etalase mandiri bagi warga untuk mempromosikan produk, makanan, atau jasa lokal antar sesama penghuni.
12. **Financial Transparency Dashboard:** Grafik interaktif yang membedah arus masuk keuangan (IPL) dan arus keluar (pengeluaran kas RT) secara riil[cite: 1].

---

## 2. Project Overview & Vision

### 2.1 Design Philosophy & Architecture
* **Design Language:** Mengadopsi prinsip desain minimalis. Mengutamakan kebersihan visual, penggunaan ruang putih (*whitespace*) yang lega, tipografi bersih (sans-serif), sudut tumpul (*high border-radius: 12px - 16px*), serta palet warna monokromatik dengan aksen warna fungsional yang sangat halus[cite: 1].
* **Deployment & Access:** Berbasis Web App yang dikonfigurasi penuh sebagai **PWA (Progressive Web App)**[cite: 1]. Aplikasi harus bisa berjalan lancar dalam mode *standalone* (tanpa address bar browser) setelah di-add ke home screen[cite: 1].
* **Data Backbone:** Menggunakan **Google Sheets sebagai Primary Database** (Read & Write secara *real-time*)[cite: 1]. File attachment (.pdf / .jpg) diunggah otomatis ke folder **Google Drive** klaster, dan sistem hanya menyimpan URL link-nya di dalam Google Sheets.

### 2.2 Theme Configuration (Dynamic Light / Dark Mode)
Sistem wajib mendukung dual-theme switcher yang menyimpan preferensi tema yang dipilih warga ke dalam `localStorage` browser untuk mencegah efek *flicker*.

| Element Name | Light Mode Token | Dark Mode Token |
| :--- | :--- | :--- |
| **Main Background** | Pure White (`#FFFFFF`) | Pitch Black / Charcoal (`#121212`) |
| **Sidebar / Drawer** | Light Gray (`#F8F9FA`) | Deep Gray (`#1E1E1E`) |
| **Card / Box Container**| Off-White (`#FFFFFF`) | Dark Charcoal (`#1D1D1F`) |
| **Primary Text** | Carbon Black (`#1D1D1F`) | Chalk White (`#E3E3E3`) |
| **Secondary Text** | Slate Gray (`#5F6368`) | Muted Gray (`#9AA0A6`) |
| **Border / Divider** | Ultra-Light Gray (`#F1F3F4`) | Hard Charcoal (`#2D2D30`) |

---

## 3. Product Feature Specifications

### 3.1 Module: Interactive Cluster Map & Billing
* Visualisasi denah menggunakan SVG, di mana ID Elemen SVG (`path_id`) dipetakan ke kolom `kavling_id` di Google Sheets[cite: 1].
* **Color-Coded Status:** 
  * *Lunas:* Light Mode (`#E6F4EA`) / Dark Mode (`#0C2915`)[cite: 1].
  * *Menunggak:* Light Mode (`#FCE8E6`) / Dark Mode (`#2D1210`)[cite: 1].
  * *Kosong:* Light Mode (`#F1F3F4`) / Dark Mode (`#2A2B2D`)[cite: 1].
* **Admin Trigger Pengingat:** Tombol kirim pengingat di dashboard admin yang men-generate link `wa.me/` dinamis berisi template pesan penagihan IPL yang sopan[cite: 1].

### 3.2 Module: Layanan Surat & Perizinan Mandiri (Termasuk Booking Aset)
* **Workflow:** Warga mengisi form perizinan -> Mengunduh draf -> Menandatangani & mengunggah kembali (wajib menyertakan foto izin tetangga kiri-kanan khusus untuk izin renovasi) -> Admin klik Approve/Reject -> Surat izin resmi format PDF terbit dengan cap digital klaster.
* **Asset Booking Integration:** Jika warga memilih jenis perizinan yang membutuhkan mobilisasi massa (e.g., Acara Pengajian, Pernikahan), sistem secara dinamis menampilkan opsi peminjaman aset klaster (Tenda RT, Kursi, Sound System) dengan validasi tanggal otomatis di database agar tidak bentrok.

### 3.3 Module: Cluster Directory (Pengurus & Satpam)
* Halaman direktori formal berisi kartu profil (grid minimalis) untuk mengenalkan jajaran pengurus klaster dan personel keamanan kepada warga.
* Menyediakan tombol cepat (CTA) untuk langsung melakukan panggilan telepon (`tel:`) atau chat WhatsApp (`wa.me`) tanpa warga harus menyalin nomor manual.
* Menampilkan status dinamis satpam yang sedang bertugas hari ini berdasarkan jadwal *shift* (Pagi/Malam).

### 3.4 Module: Live CCTV Monitoring (EcoEye)
* **Grid Streaming Minimalis:** Halaman berisi grid kartu kamera dengan aspek rasio video 16:9 yang bersih, sudut melengkung 12px, dan indikator teks kecil berkedip di pojok kiri atas bertuliskan `• LIVE`.
* **Single-Click Maximize:** Saat salah satu feed CCTV di-tap/klik, video akan membesar (*fullscreen* atau modal drawer) untuk menampilkan kontrol digital zoom.
* **Security & Optimization:** Sistem di portal bertindak sebagai HTML5 Video Player ringan yang memuat URL stream web-friendly (HLS `.m3u8` / WebRTC) yang sudah dikonversi via pihak ketiga. Akses dibatasi hanya untuk user tervalidasi (warga resmi).

### 3.5 Module: "Lapor Pak RT!" (Ticketing Komplain & Kerusakan Fasum)
* Warga dapat membuat laporan komplain (jalan bolong, lampu mati, gangguan ketertiban) dengan mengisi deskripsi, tag nomor blok, dan upload foto bukti.
* Laporan masuk ke dashboard admin dan statusnya bisa dipantau secara transparan oleh seluruh warga dengan indikator: `[Pending]` -> `[Diproses]` -> `[Selesai]`.

### 3.6 Module: Digital Marketplace (Bazar Klaster)
* Halaman etalase produk/jasa lokal milik warga klaster dengan interaktif grid yang bersih.
* Warga bisa mendaftarkan, mengedit, atau menghapus produk jualan mereka sendiri secara mandiri. Tombol beli akan langsung mengarah ke chat WhatsApp penjual.

### 3.7 Module: Financial Transparency & Analytics
* Dashboard finansial khusus untuk pengurus (dan ringkasannya untuk warga) yang membaca data riil dari Google Sheets menggunakan chart interaktif (Library Chart.js / Recharts)[cite: 1]:
    1. *Donut Chart:* Persentase Kepatuhan IPL Bulan Berjalan (% lunas vs % menunggak)[cite: 1].
    2. *Bar Chart:* Tren Pendapatan IPL vs Pengeluaran Kas Bulanan[cite: 1].
    3. *Data Export:* Tombol untuk mengunduh seluruh rekapitulasi keuangan menjadi file `.xlsx` atau `.csv`[cite: 1].

---

## 4. Google Sheets Complete Database Schema

Sistem AI wajib mengonfigurasi koneksi ke satu Google Workbook dengan struktur sheet sebagai berikut:

#### Sheet 1: `warga_directory`
| Kolom | Deskripsi |
| :--- | :--- |
| `kavling_id` | ID Unik (contoh: A-01, A-02)[cite: 1] |
| `nama_penghuni` | Nama Lengkap Warga[cite: 1] |
| `no_whatsapp` | Nomor HP aktif (format: 628xxx)[cite: 1] |
| `status_huni` | Ditempati / Kosong / Dikontrakkan[cite: 1] |
| `email_warga` | Email terdaftar untuk login[cite: 1] |

#### Sheet 2: `ipl_ledger`
| Kolom | Deskripsi |
| :--- | :--- |
| `invoice_id` | ID Tagihan otomatis (e.g., IPL-2026-05-A01)[cite: 1] |
| `kavling_id` | Foreign Key ke `warga_directory`[cite: 1] |
| `periode_bulan` | Format Bulan & Tahun (e.g., Mei 2026)[cite: 1] |
| `nominal_tagihan`| Angka riil tarif IPL[cite: 1] |
| `status_bayar` | Lunas / Menunggak / Review[cite: 1] |
| `tanggal_bayar` | Timestamp konfirmasi pembayaran[cite: 1] |

#### Sheet 3: `permit_submissions`
| Kolom | Deskripsi |
| :--- | :--- |
| `submission_id` | ID Pengajuan Unik (e.g., PERMIT-2026-001) |
| `kavling_id` | ID Rumah pengaju |
| `permit_type` | Izin Kegiatan / Izin Renovasi / Surat Pengantar |
| `form_data_json`| Data dinamis inputan warga (Nama acara, tanggal, dll) |
| `raw_doc_url` | URL file template + tanda tangan warga di Google Drive |
| `final_doc_url` | URL file Surat Resmi PDF yang sudah di-approve Admin |
| `status_review` | 'Pending' / 'Approved' / 'Rejected' |
| `admin_notes` | Catatan dari pengurus jika dokumen ditolak |

#### Sheet 4: `asset_booking`
| Kolom | Deskripsi |
| :--- | :--- |
| `booking_id` | ID Booking otomatis |
| `submission_id` | Foreign Key ke `permit_submissions` |
| `asset_name` | Nama Aset (Tenda / Kursi / Sound System) |
| `borrow_date` | Tanggal Mulai Pinjam |
| `return_date` | Tanggal Pengembalian |

#### Sheet 5: `cluster_directory`
| Kolom | Deskripsi |
| :--- | :--- |
| `member_id` | ID Unik Personel (e.g., STAFF-001) |
| `role_type` | 'Pengurus' / 'Satpam' |
| `position` | Jabatan (Ketua RT, Bendahara, Danru Satpam, Anggota) |
| `full_name` | Nama Lengkap |
| `phone_number` | Nomor WhatsApp aktif |
| `photo_url` | Link foto profil di Google Drive |
| `schedule_shift`| Pagi / Malam / Off (Khusus Satpam) |

#### Sheet 6: `cctv_streams`
| Kolom | Deskripsi |
| :--- | :--- |
| `cctv_id` | ID Unik Kamera (e.g., CCTV-01) |
| `location_name` | Nama Lokasi (e.g., "Gerbang Utama - Masuk", "Fasum Lapangan") |
| `stream_url` | URL Streaming Web-Friendly (HLS `.m3u8` / WebRTC / Embed Link) |
| `status_operational`| TRUE / FALSE (Untuk mendeteksi jika kamera sedang maintenance) |

#### Sheet 7: `complaints_ticketing`
| Kolom | Deskripsi |
| :--- | :--- |
| `ticket_id` | ID Laporan (e.g., TKT-001) |
| `kavling_id` | ID Rumah pelapor |
| `category` | Kerusakan Fasum / Gangguan Ketertiban / Lainnya |
| `description` | Detail laporan |
| `photo_url` | Link foto bukti di Google Drive |
| `status` | 'Pending' / 'Diproses' / 'Selesai' |

#### Sheet 8: `marketplace_items`
| Kolom | Deskripsi |
| :--- | :--- |
| `item_id` | ID Produk/Jasa |
| `kavling_id` | ID Rumah penjual |
| `item_name` | Nama Produk / Jasa |
| `price` | Harga Produk |
| `image_url` | Link foto produk di Google Drive |
| `status_active` | TRUE / FALSE (jika stok habis) |

#### Sheet 9: `cash_outflow`
| Kolom | Deskripsi |
| :--- | :--- |
| `expense_id` | ID Pengeluaran Kas (e.g., EXP-001) |
| `date` | Tanggal Pengeluaran |
| `amount` | Nominal Pengeluaran |
| `category` | Keamanan / Kebersihan / Perbaikan / Operasional |
| `notes` | Keterangan pengeluaran |

---

## 5. Security & Privacy Guardrails (UU PDP Compliance)
* **Data Masking:** Saat warga biasa mengakses Peta Klaster atau modul CCTV, detail nama di kavling rumah orang lain wajib disamarkan (e.g., "Blok B/04 - Rumah Keluarga B*** - Status IPL: Lunas")[cite: 1]. Detail informasi lengkap tanpa sensor hanya bisa dibuka oleh user yang tervalidasi sebagai akun Admin Pengurus atau pemilik asli kavling tersebut[cite: 1].
* **CCTV Privacy Boundaries:** Kamera yang terhubung ke portal dilarang keras menyorot area privat (teras/jendela) rumah warga secara langsung, dan hanya dialokasikan untuk memantau area publik klaster.