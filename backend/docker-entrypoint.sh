#!/bin/sh
set -eu

MIGRATE_URL="${DIRECT_URL:-${DATABASE_URL:-}}"
if [ -z "$MIGRATE_URL" ]; then
  echo "DATABASE_URL or DIRECT_URL must be configured for database migrations." >&2
  exit 1
fi

echo "Running database migrations..."
DATABASE_URL="$MIGRATE_URL" timeout 120 npx prisma migrate deploy

echo "Starting NestJS server..."
exec "$@"
