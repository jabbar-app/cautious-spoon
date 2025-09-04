-- Add soft-delete column to candidate_webinars
ALTER TABLE "candidate_webinars"
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;

-- Optional but recommended for query performance
CREATE INDEX IF NOT EXISTS "idx_candidate_webinars_deleted_at"
  ON "candidate_webinars" ("deleted_at");
