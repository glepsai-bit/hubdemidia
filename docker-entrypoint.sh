#!/bin/sh
# Entrypoint do container: aplica migrations Prisma e então executa o CMD.
# Idempotente — `prisma migrate deploy` só roda as pendentes.
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "▶ Aplicando migrations (prisma migrate deploy)..."
  prisma migrate deploy
else
  echo "⚠ DATABASE_URL não definida — pulando migrate."
fi

exec "$@"
