# Barcelona Cove — Portal Cluster

Web aplikasi manajemen cluster perumahan Barcelona Cove: pengaduan (dengan foto), perizinan (dokumen, konsen tetangga, booking aset, PDF resmi), uang kas (kepatuhan IPL, reminder WA, export CSV), peta klaster, direktori pengurus/satpam, dan info & acara komunitas.

## Stack

Next.js (App Router) · TypeScript · Prisma (PostgreSQL) · NextAuth v4 · Tailwind + shadcn/ui · pdf-lib · next-themes (PWA-ready)

## Role

- **Warga**: mengajukan pengaduan & izin, melihat status miliknya, melihat laporan kas (read-only).
- **Admin/Pengurus**: mengelola pengaduan & perizinan (ubah status, beri tanggapan), mengelola data rumah & akun warga.
- **Bendahara**: mengelola transaksi kas (pemasukan/pengeluaran), iuran bulanan, dan nominal iuran.

## Menjalankan secara lokal

Membutuhkan Node.js ≥ 20.9 dan PostgreSQL yang sudah jalan (lokal atau remote).

```bash
npm install
cp .env.example .env   # sesuaikan DATABASE_URL, lalu isi NEXTAUTH_SECRET
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Deploy ke production

```bash
npm run build   # juga menjalankan `prisma migrate deploy`
npm start
```

`npm start` menyalakan server Node.js yang harus tetap hidup selama aplikasi diakses (pakai process manager seperti PM2, atau platform seperti Netlify/Vercel yang menanganinya otomatis) — bukan aplikasi statis yang bisa langsung disalin ke document root web server (Apache/IIS/htdocs).

### Akun contoh (dari seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@barcelonacove.local | password123 |
| Bendahara | bendahara@barcelonacove.local | password123 |
| Warga | budi@barcelonacove.local | password123 |
