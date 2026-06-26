#!/bin/sh
set -e

# Apply pending migrations (idempotent and safe to run on every boot).
echo "Running database migrations…"
node_modules/.bin/prisma migrate deploy

# Seed only when explicitly requested. The seed resets subscription data,
# so it must never run automatically against an existing production database.
if [ "$RUN_SEED" = "true" ]; then
  echo "Seeding database (RUN_SEED=true)…"
  node_modules/.bin/prisma db seed
fi

echo "Starting server…"
exec "$@"
