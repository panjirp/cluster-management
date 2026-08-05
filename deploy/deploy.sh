#!/usr/bin/env sh
# deploy.sh — Deploy cluster-management ke VPS

set -e

echo "=== cluster-management deploy ==="

# 1. Cek .env ada
if [ ! -f .env ]; then
  echo "ERROR: File .env tidak ada. Copy dari deploy/.env.production.example dan isi dengan benar."
  exit 1
fi

# 2. Build & start
echo "Building & starting services..."
docker compose up -d --build

# 3. Tunggu DB siap
echo "Menunggu database..."
for i in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U "${POSTGRES_USER:-barcelona}" > /dev/null 2>&1; then
    echo "Database siap!"
    break
  fi
  sleep 2
done

# 4. Migrasi & seed (hanya jika migration baru)
echo "Running migrations..."
docker compose exec -T app npx prisma migrate deploy || true

# 5. Seed users (hanya jika belum ada)
echo "Seeding users..."
docker compose exec -T app npx prisma db seed || true

echo ""
echo "=== Deploy selesai ==="
echo "Akses: https://www.barcelonacove.web.id"
echo "Logs:  docker compose logs -f app"
