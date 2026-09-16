#!/bin/sh
set -eu

echo "========================================="
echo " DESTINY / CONNECTION RAVE"
echo " Container starting..."
echo "========================================="

if [ "${RUN_DB_MIGRATIONS:-true}" = "true" ]; then
  echo "[DB] Applying Prisma migrations..."
  npx prisma migrate deploy
fi

echo "[APP] Starting Next.js"
exec "$@"

