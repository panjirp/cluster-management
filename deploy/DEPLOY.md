# Deploy ke VPS — www.barcelonacove.web.id

## Prasyarat di VPS
- Ubuntu 22.04+ (atau Debian 12)
- Docker + Docker Compose terinstal
- Domain `www.barcelonacove.web.id` mengarah ke IP VPS
- Port 80 & 443 terbuka (HTTP/HTTPS)

---

## Langkah 1 — Persiapan Repo di VPS

```bash
# Masuk ke VPS via SSH
ssh root@<IP_VPS>

# Clone repo (atau update jika sudah ada)
cd /opt
git clone https://github.com/panjirp/cluster-management.git
cd cluster-management

# Buat env file dari template
cp deploy/.env.production.example .env
nano .env   # isi semua variabel yang dibutuhkan
```

---

## Langkah 2 — Isi `.env` di VPS

```bash
# Generate secrets
openssl rand -base64 32   # gunakan untuk NEXTAUTH_SECRET
openssl rand -base64 32   # gunakan untuk CRON_SECRET

# Setelah itu, pastikan di .env ada:
POSTGRES_USER=barcelona
POSTGRES_PASSWORD=<password-anda>
POSTGRES_DB=barcelonacove
NEXTAUTH_URL=https://www.barcelonacove.web.id
NEXTAUTH_SECRET=<yang-anda-generate>
CRON_SECRET=<yang-anda-generate>
MAYAR_API_KEY=<dari-mayar.id>
```

---

## Langkah 3 — Deploy dengan Docker Compose

```bash
cd /opt/cluster-management

# Build & start semua service (db, app, nginx)
docker compose up -d --build

# Cek status
docker compose ps

# Cek logs
docker compose logs -f app
```

---

## Langkah 4 — Setup Database (hanya pertama kali)

```bash
# Masuk ke container app
docker compose exec app sh

# Di dalam container:
npx prisma migrate deploy
npx prisma db seed

# Keluar
exit
```

---

## Langkah 5 — SSL Certificate (Let's Encrypt)

Nginx sudah dikonfigurasi untuk Let's Encrypt. Langsung akses domain untuk触发 verifikasi:

```bash
# Setelah DNS sudah mengarah ke VPS, jalankan:
docker compose exec nginx certbot certonly --webroot -w /var/www/certbot -d www.barcelonacove.web.id --email admin@barcelonacove.web.id --agree-tos --no-eff-email
```

---

## Langkah 6 — Update Aplikasi (setelah ada perubahan kode)

```bash
cd /opt/cluster-management
git pull origin master
docker compose up -d --build
docker compose exec app npx prisma migrate deploy   # jika ada migration baru
```

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| App tidak bisa konek ke DB | Cek `DATABASE_URL`, pastikan container `db` running |
| HTTPS tidak bisa | Pastikan port 80 & 443 terbuka di firewall VPS |
| Upload bukti pembayaran tidak bisa | Pastikan volume `uploads` terpasang, atau setup Netlify Blobs |
| Mayar error | Pastikan `MAYAR_API_KEY` sudah di-set di `.env` |

---

## Catatan Penting

1. **Domain harus mengarah ke VPS** sebelum Langkah 5 (SSL)
2. **Password PostgreSQL** di `.env` harus sama dengan di VPS
3. **Uploads disimpan di volume Docker** `uploads:/app/public/uploads` — bertahan meski container di-recreate
4. **Backup database secara berkala:**
   ```bash
   docker compose exec db pg_dump -U barcelona barcelonacove > backup_$(date +%F).sql
   ```
