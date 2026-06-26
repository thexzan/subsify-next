#!/bin/sh
# Note: no blanket `set -e` — we handle each step explicitly so a failure is
# logged loudly and exits non-zero (visible in Coolify), instead of the
# container vanishing with no explanation.

PRISMA="node_modules/.bin/prisma"

# 1. Wait for the database to accept connections. MySQL often boots slower than
#    the app container, so migrating immediately would crash-loop. Poll
#    `migrate status` (it connects to the DB) until it stops failing on
#    connection, up to a bounded number of attempts.
echo "Waiting for the database to become reachable…"
ATTEMPTS=30
i=1
while [ "$i" -le "$ATTEMPTS" ]; do
  # `migrate status` exits 0 when up-to-date and 1 when migrations are pending,
  # but both mean the DB is reachable. A connection failure prints a P1001
  # error. So: if the output does NOT contain a connection error, the DB is up.
  OUT=$("$PRISMA" migrate status 2>&1)
  if ! echo "$OUT" | grep -q "P1001"; then
    echo "Database is reachable."
    break
  fi
  if [ "$i" -eq "$ATTEMPTS" ]; then
    echo "ERROR: database not reachable after ${ATTEMPTS} attempts. Last output:"
    echo "$OUT"
    exit 1
  fi
  echo "  …not ready yet (attempt ${i}/${ATTEMPTS}), retrying in 2s"
  i=$((i + 1))
  sleep 2
done

# 2. Apply pending migrations (idempotent, safe on every boot).
echo "Running database migrations…"
if ! "$PRISMA" migrate deploy; then
  echo "ERROR: 'prisma migrate deploy' failed. Refusing to start the server"
  echo "against an unmigrated database."
  exit 1
fi

# 3. Seed only when explicitly requested (the seed resets subscription data, so
#    it must never run automatically against an existing database).
if [ "$RUN_SEED" = "true" ]; then
  echo "Seeding database (RUN_SEED=true)…"
  if ! "$PRISMA" db seed; then
    echo "ERROR: 'prisma db seed' failed."
    exit 1
  fi
fi

echo "Starting server…"
exec "$@"
