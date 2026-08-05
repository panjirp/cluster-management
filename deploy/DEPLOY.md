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

# Pastikan di .env ada:
POSTGRES_USER=barcelona
POSTGRES_PASSWORD=<password-anda>
POSTGRES_DB=barcelonacove
NEXTAUTH_URL=https://www.barcelonacove.web.id
NEXTAUTH_SECRET=<yang-anda-generate>
CRON_SECRET=<yang-anda-generate>
MAYAR_API_KEY=<dari-mayar.id>
```

---

## Langkah 3 — Deploy pertama kali dengan Docker Compose

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

Nginx sudah dikonfigurasi untuk Let's Encrypt:

```bash
# Setelah DNS sudah mengarah ke VPS:
docker compose exec nginx certbot certonly \
  --webroot -w /var/www/certbot \
  -d www.barcelonacove.web.id \
  --email admin@barcelonacove.web.id \
  --agree-tos --no-eff-email
```

---

## Langkah 6 — Auto-Deploy dengan Cron Job (Hermes)

Setelah setup pertama selesai, kamu bisa setup auto-deploy dari Hermes:

1. Isi `deploy/.env.vps` dengan `VPS_HOST` dan `VPS_USER`
2. Di Hermes, buat cron job dengan:
   - **Schedule:** sesuai kebutuhan (misal `0 2 * * *` untuk jam 2 malam)
   - **Script:** `deploy/deploy-to-vps.sh`
   - **Environment:** `VPS_HOST=<ip-vps>`, `VPS_USER=root`

Script akan otomatis:
- SSH ke VPS
- `git pull origin master`
- `docker compose up -d --build`
- `prisma migrate deploy`
- Cek status container

---

## Update Manual (tanpa cron)

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
| Upload bukti pembayaran tidak bisa | Pastikan volume `uploads` terpasang |
| Mayar error | Pastikan `MAYAR_API_KEY` sudah di-set di `.env` |

---

## Catatan Penting

1. **Domain harus mengarah ke VPS** sebelum Langkah 5 (SSL)
2. **Password PostgreSQL** di `.env` harus sama dengan di VPS
3. **Uploads disimpan di volume Docker** `uploads:/app/public/uploads`
4. **Backup database secara berkala:**
   ```bash
   docker compose exec db pg_dump -U barcelona barcelonacove > backup_$(date +%F).sql
   ```
