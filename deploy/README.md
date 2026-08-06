# Deploy ke VPS Ubuntu — www.barcelonacove.web.id

## Setup pertama kali (satu perintah)

```bash
# 1. Login ke VPS
ssh root@IP_VPS_KAMU

# 2. Download dan jalankan setup otomatis
curl -fsSL https://raw.githubusercontent.com/panjirp/cluster-management/master/deploy/setup-vps.sh | bash
```

Setup otomatis akan:
- Install Docker + Docker Compose
- Clone repo ini ke `/opt/cluster-management`
- Buat file `.env` (kamu akan diminta mengisi)
- Start semua service (PostgreSQL, app, nginx)
- Jalankan migration + seed database

---

## Yang kamu perlukan sebelum setup

1. **IP VPS** — misal `123.45.67.89`
2. **Domain `www.barcelonacove.web.id`** sudah mengarah ke IP VPS (cek di DNS provider)
3. **API Key Mayar** dari https://mayar.id (sandbox dulu)

---

## Setup manual (jika otomatis gagal)

### 1. Install Docker
```bash
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin
systemctl enable --now docker
```

### 2. Clone repo
```bash
cd /opt
git clone https://github.com/panjirp/cluster-management.git
cd cluster-management
```

### 3. Buat .env
```bash
cp deploy/.env.production.example .env
nano .env
```

Isi yang WAJIB:
```env
POSTGRES_PASSWORD=<password-anda>
NEXTAUTH_URL=https://www.barcelonacove.web.id
NEXTAUTH_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -base64 32)
MAYAR_API_KEY=<dari-mayar.id>
FONNTE_TOKEN=<dari-fonnte.com> (opsional, untuk kirim pengingat iuran via WhatsApp)
```

### 4. Start
```bash
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
```

### 5. SSL
```bash
docker compose exec nginx certbot certonly \
  --webroot -w /var/www/certbot \
  -d www.barcelonacove.web.id \
  --email admin@barcelonacove.web.id \
  --agree-tos --no-eff-email
```

---

## Setelah deploy

- Buka https://www.barcelonacove.web.id
- Login: `admin@barcelonacove.local` / `password123`
- User lain: `bendahara@barcelonacove.local` / `password123`, `warga@barcelonacove.local` / `password123`

---

## Update aplikasi

```bash
cd /opt/cluster-management
git pull origin master
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

---

## Troubleshooting

| Masalah | Cek |
|---|---|
| Port 80/443 diblokir | `ufw allow 80/tcp && ufw allow 443/tcp` |
| DB tidak nyambung | `docker compose logs db` |
| App error | `docker compose logs app` |
| SSL error | Pastikan domain sudah mengarah ke VPS |
