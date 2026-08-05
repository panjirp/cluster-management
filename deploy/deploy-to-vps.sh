#!/usr/bin/env bash
# deploy-to-vps.sh — Auto deploy cluster-management ke VPS
# Jalankan dari Hermes cron job

set -e

VPS_HOST="${VPS_HOST:?Set VPS_HOST env var}"
VPS_USER="${VPS_USER:-root}"
VPS_DIR="/opt/cluster-management"

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10"

echo "=== Deploy to VPS: $VPS_HOST ==="

# 1. Pull kode terbaru
echo "[1/5] Pulling latest code..."
ssh $SSH_OPTS $VPS_USER@$VPS_HOST "cd $VPS_DIR && git pull origin master"

# 2. Build & restart container
echo "[2/5] Building & restarting containers..."
ssh $SSH_OPTS $VPS_USER@$VPS_HOST "cd $VPS_DIR && docker compose up -d --build"

# 3. Tunggu app siap
echo "[3/5] Waiting for app..."
for i in $(seq 1 30); do
  if ssh $SSH_OPTS $VPS_USER@$VPS_HOST "curl -sf http://localhost:3000/api/auth/session > /dev/null 2>&1"; then
    echo "App is ready!"
    break
  fi
  sleep 3
done

# 4. Jalankan migration jika ada
echo "[4/5] Running migrations..."
ssh $SSH_OPTS $VPS_USER@$VPS_HOST "cd $VPS_DIR && docker compose exec -T app npx prisma migrate deploy || true"

# 5. Cek status
echo "[5/5] Status check..."
ssh $SSH_OPTS $VPS_USER@$VPS_HOST "cd $VPS_DIR && docker compose ps"

echo ""
echo "=== Deploy selesai ==="
echo "URL: https://www.barcelonacove.web.id"
