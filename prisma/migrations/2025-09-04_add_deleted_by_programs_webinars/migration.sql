-- prisma/migrations/2025-09-04_add_deleted_by_programs_webinars/migration.sql

-- Add deleted_by to programs
ALTER TABLE "programs"
  ADD COLUMN IF NOT EXISTS "deleted_by" VARCHAR(225);

-- Add deleted_by to webinars
ALTER TABLE "webinars"
  ADD COLUMN IF NOT EXISTS "deleted_by" VARCHAR(225);
