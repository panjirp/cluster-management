# 🚀 Panduan Deploy ke VPS (Docker + Docker Compose)

Aplikasi web portal cluster ini di-deploy dengan **Docker + Docker Compose**:
**PostgreSQL + Next.js (app) + Nginx (reverse proxy + SSL Let's Encrypt)**.

---

## 0. Prasyarat di VPS
- OS: **Ubuntu 22.04 / 24.04** (atau Debian)
- **Docker** & **Docker Compose plugin** terpasang:
  ```bash
  sudo apt update && sudo apt install -y docker.io docker-compose-v2
  sudo systemctl enable --now docker
  ```
- **Git** sudah terpasang (`sudo apt install -y git`)
- **Domain** sudah mengarah (DNS record **A**) ke IP publik VPS

---

## 1. Arahkan DNS
Di panel DNS domain kamu, buat record **A**:
| Name | Type | Value |
|------|------|-------|
| `@` (atau subdomain mis. `portal`) | A | `<IP_PUBLIK_VPS>` |

Tunggu hingga DNS propagate (beberapa menit–jam).

---

## 2. Clone & siapkan environment
```bash
cd /opt
git clone https://github.com/panjirp/cluster-management.git
cd cluster-management
git checkout master
```

Buat file `.env` dari contoh, lalu **isi nilainya**:
```bash
cp .env.production.example .env
nano .env
```
Yang wajib diisi:
- `POSTGRES_PASSWORD` (password kuat)
- `NEXTAUTH_URL` = `https://domainkamu.com`
- `NEXTAUTH_SECRET` = hasil `openssl rand -base64 32`
- `MAYAR_API_KEY`, `NETLIFY_*` sesuai kebutuhan

> ⚠️ **Penting:** Ganti `YOUR_DOMAIN` di `nginx/nginx.conf` dengan domain asli kamu
> (muncul di 2 tempat).

---

## 3. Jalankan aplikasi (tanpa SSL dulu, tes HTTP)
```bash
docker compose up -d --build
```
Cek status:
```bash
docker compose ps
docker compose logs -f app
```
Tes lewat browser: `http://IP_VPS:80` — pastikan login page muncul sebelum lanjut ke SSL.

---

## 4. Pasang SSL Let's Encrypt (certbot)
Jalankan certbot sekali untuk domain (webroot):
```bash
docker run --rm -v $(pwd)/nginx/certbot/www:/var/www/certbot \
  -v $(pwd)/nginx/certbot/conf:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d YOUR_DOMAIN --email email@kamu.com --agree-tos --no-eff-email
```
Setelah sertifikat jadi, aktifkan & muat ulang Nginx:
```bash
docker compose down
docker compose up -d
```
Sekarang akses via **https://YOUR_DOMAIN** — SSL aktif.

> **Perbarui SSL otomatis** (crontab, jalankan tiap bulan):
> ```bash
> 0 3 1 * * docker run --rm -v $(pwd)/nginx/certbot/www:/var/www/certbot -v $(pwd)/nginx/certbot/conf:/etc/letsencrypt certbot/certbot renew --webroot -w /var/www/certbot && docker exec $(docker ps -qf name=nginx) nginx -s reload
> ```

---

## 5. Update aplikasi (setiap ada perubahan kode)
```bash
cd /opt/cluster-management
git pull
docker compose up -d --build
# Migrasi dijalankan otomatis oleh entrypoint (prisma migrate deploy)
```

---

## 6. Catatan penting
- **Migrasi DB** dijalankan otomatis setiap container app start (`docker-entrypoint.sh`).
- **Data DB** tersimpan di volume `pgdata`; aman saat container di-recreate.
- **Upload file** memakai Netlify Blobs saat ini. Jika `NETLIFY_SITE_ID`/`NETLIFY_BLOBS_TOKEN`
  dikosongkan, fitur upload bukti pembayaran rentan gagal di VPS mandiri — untuk produksi
  penuh, isi credentials Netlify tersebut, atau hubungi pengembang untuk ganti ke penyimpanan lokal.
- **GitHub token** lama yang tertanam di URL remote `origin` sebaiknya di-rotate (lihat keamanan).
- Setelah up, lakukan **seed** akun admin bila perlu:
  ```bash
  docker compose exec app npx tsx prisma/seed.ts
  ```

---

## Troubleshooting cepat
| Masalah | Solusi |
|---------|--------|
| `app` restart melulu | `docker compose logs app` — biasanya masalah koneksi/secret DB |
| 502 Bad Gateway dari nginx | pastikan `app` healthy: `docker compose ps` |
| Certbot gagal | pastikan DNS sudah mengarah & port 80 terbuka |
| Login selalu gagal | pastikan `NEXTAUTH_SECRET` konsisten & DB sudah di-seed |
