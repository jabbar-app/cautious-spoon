#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Ensure clean migrations dir (optional; comment out if you want to keep history)
rm -rf prisma/migrations/*
mkdir -p prisma/migrations/000_init

# Generate SQL that exactly matches prisma/schema.prisma
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/000_init/migration.sql

# Lock file
echo '# prisma migration lock' > prisma/migrations/migration_lock.toml

echo "[ok] Generated prisma/migrations/000_init/migration.sql from schema.prisma"
