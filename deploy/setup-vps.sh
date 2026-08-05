#!/bin/bash
# setup-vps.sh — Setup otomatis VPS Ubuntu untuk cluster-management
# Jalankan sebagai root di VPS: bash setup-vps.sh

set -e

echo "=== Setup VPS Ubuntu untuk cluster-management ==="

# 1. Update system
echo "[1/7] Updating system..."
apt-get update -qq && apt-get upgrade -y -qq

# 2. Install dependencies
echo "[2/7] Installing dependencies..."
apt-get install -y -qq curl git ufw

# 3. Install Docker
echo "[3/7] Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  usermod -aG docker root
  systemctl enable --now docker
else
  echo "Docker already installed"
fi

# 4. Install Docker Compose plugin
echo "[4/7] Installing Docker Compose..."
if ! docker compose version &>/dev/null; then
  apt-get install -y -qq docker-compose-plugin
fi

# 5. Clone repo
echo "[5/7] Cloning repository..."
if [ -d "/opt/cluster-management" ]; then
  echo "Repo exists, updating..."
  cd /opt/cluster-management && git pull
else
  cd /opt
  git clone https://github.com/panjirp/cluster-management.git
  cd cluster-management
fi

# 6. Setup .env jika belum ada
echo "[6/7] Setting up .env..."
if [ ! -f ".env" ]; then
  cp deploy/.env.production.example .env
  echo ""
  echo "=== EDIT .env SEKARANG ==="
  echo "nano .env"
  echo ""
  echo "Yang WAJIB diisi:"
  echo "  POSTGRES_PASSWORD=<password-anda>"
  echo "  NEXTAUTH_SECRET=$(openssl rand -base64 32)"
  echo "  CRON_SECRET=$(openssl rand -base64 32)"
  echo "  MAYAR_API_KEY=<dari-mayar.id>"
  echo ""
  read -p "Sudah diisi? (y/n): " confirm
  if [ "$confirm" != "y" ]; then
    echo "Isi .env dulu, lalu jalankan: docker compose up -d --build"
    exit 1
  fi
fi

# 7. Start services
echo "[7/7] Starting services..."
docker compose up -d --build

# Wait for DB
echo "Waiting for database..."
for i in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U barcelona > /dev/null 2>&1; then
    echo "Database ready!"
    break
  fi
  sleep 2
done

# Setup DB (first time only)
echo "Running migrations & seed..."
docker compose exec -T app npx prisma migrate deploy || true
docker compose exec -T app npx prisma db seed || true

# Show status
echo ""
echo "=== Setup selesai ==="
docker compose ps
echo ""
echo "Cek logs: docker compose logs -f app"
echo "Domain: https://www.barcelonacove.web.id"
echo ""
echo "=== Langkah selanjutnya ==="
echo "1. Pastikan DNS domain mengarah ke IP VPS ini"
echo "2. Setup SSL: docker compose exec nginx certbot certonly --webroot -w /var/www/certbot -d www.barcelonacove.web.id --email admin@barcelonacove.web.id --agree-tos --no-eff-email"
