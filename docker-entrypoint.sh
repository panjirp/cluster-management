#!/bin/sh
set -e

echo "[entrypoint] Menjalankan migrasi database..."
npx prisma migrate deploy

echo "[entrypoint] Memulai Next.js (mode production)..."
exec npx next start -H 0.0.0.0 -p 3000
