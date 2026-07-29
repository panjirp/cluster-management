# Barcelona Cove — Portal Cluster

Web aplikasi manajemen cluster perumahan Barcelona Cove: pengaduan (dengan foto), perizinan (dokumen, konsen tetangga, booking aset, PDF resmi), uang kas (kepatuhan IPL, reminder WA, export CSV), peta klaster, direktori pengurus/satpam, dan info & acara komunitas.

## Stack

Next.js (App Router) · TypeScript · Prisma (SQLite) · NextAuth v4 · Tailwind + shadcn/ui · pdf-lib · next-themes (PWA-ready)

## Role

- **Warga**: mengajukan pengaduan & izin, melihat status miliknya, melihat laporan kas (read-only).
- **Admin/Pengurus**: mengelola pengaduan & perizinan (ubah status, beri tanggapan), mengelola data rumah & akun warga.
- **Bendahara**: mengelola transaksi kas (pemasukan/pengeluaran), iuran bulanan, dan nominal iuran.

## Menjalankan secara lokal

Membutuhkan Node.js ≥ 18.18 (disarankan 20 LTS).

```bash
npm install
cp .env.example .env   # lalu isi NEXTAUTH_SECRET
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Akun contoh (dari seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@barcelonacove.local | password123 |
| Bendahara | bendahara@barcelonacove.local | password123 |
| Warga | budi@barcelonacove.local | password123 |
