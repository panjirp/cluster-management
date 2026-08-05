# Setup VPS Ubuntu — Satu Perintah!

## Prasyarat
- VPS dengan Ubuntu 22.04+
- Domain `www.barcelonacove.web.id` sudah mengarah ke IP VPS
- API Key Mayar dari https://mayar.id

---

## Langkah 1 — Setup pertama kali

```bash
# Login ke VPS sebagai root
ssh root@IP_VPS_KAMU

# Jalankan setup otomatis (cuma satu perintah!)
curl -fsSL https://raw.githubusercontent.com/panjirp/cluster-management/master/deploy/setup-vps.sh | bash
```

Setup otomatis akan:
1. ✅ Install Docker + Docker Compose
2. ✅ Clone repo ke `/opt/cluster-management`
3. ✅ Buat file `.env` (kamu di-custom isinya)
4. ✅ Build & start PostgreSQL + App + Nginx
5. ✅ Setup database (migration + seed)
6. ✅ Output URL dan langkah SSL

---

## Langkah 2 — Setup SSL (setelah domain aktif)

```bash
# Login lagi ke VPS
ssh root@IP_VPS_KAMU
cd /opt/cluster-management

# Generate SSL certificate Let's Encrypt
docker compose exec nginx certbot certonly \
  --webroot -w /var/www/certbot \
  -d www.barcelonacove.web.id \
  --email admin@barcelonacove.web.id \
  --agree-tos --no-eff-email
```

---

## Langkah 3 — Cek aplikasi

Buka browser: **https://www.barcelonacove.web.id**

Login dengan:
| Email | Password |
|---|---|
| `admin@barcelonacove.local` | `password123` |
| `bendahara@barcelonacove.local` | `password123` |
| `warga@barcelonacove.local` | `password123` |

---

## Setelah itu — Update aplikasi

```bash
ssh root@IP_VPS_KAMU
cd /opt/cluster-management

# Pull kode terbaru
git pull origin master

# Restart
docker compose up -d --build

# Jika ada database migration baru:
docker compose exec app npx prisma migrate deploy
```

---

## Commands berguna

```bash
# Cek status semua service
docker compose ps

# Cek logs app
docker compose logs -f app

# Cek logs database
docker compose logs -f db

# Restart app saja
docker compose restart app

# Backup database
docker compose exec db pg_dump -U barcelona barcelonacove > backup_$(date +%F).sql
```

---

## Troubleshooting cepat

| Masalah | Perintah |
|---|---|
| App tidak bisa diakses | `docker compose ps` — cek apakah container `app` running |
| Database error | `docker compose logs db` |
| Port 80/443 diblokir | `ufw allow 80/tcp && ufw allow 443/tcp` |
| Domain belum ter-SSL | Cek DNS: `dig www.barcelonacove.web.id` |
