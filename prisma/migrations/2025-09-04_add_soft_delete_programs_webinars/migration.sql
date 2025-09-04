-- programs: add deleted_at, deleted_by
ALTER TABLE "programs"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "deleted_by" VARCHAR(225);

-- webinars: add deleted_at, deleted_by
ALTER TABLE "webinars"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "deleted_by" VARCHAR(225);

-- (Optional) indexes to speed up queries that filter on deleted_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = ANY (CURRENT_SCHEMAS(false))
      AND indexname = 'idx_programs_deleted_at'
  ) THEN
    CREATE INDEX "idx_programs_deleted_at" ON "programs" ("deleted_at");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = ANY (CURRENT_SCHEMAS(false))
      AND indexname = 'idx_webinars_deleted_at'
  ) THEN
    CREATE INDEX "idx_webinars_deleted_at" ON "webinars" ("deleted_at");
  END IF;
END $$;
