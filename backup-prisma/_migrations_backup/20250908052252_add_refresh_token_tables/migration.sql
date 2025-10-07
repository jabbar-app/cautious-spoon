BEGIN;

-- Make sure gen_random_uuid() is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS superadmins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(50) DEFAULT '',
  password varchar DEFAULT '',
  created_at timestamptz,
  updated_at timestamptz
);

-- Clean up any partial attempts (safe in dev; no-op if none exist)
DROP TABLE IF EXISTS "candidate_refresh_tokens" CASCADE;
DROP TABLE IF EXISTS "employer_refresh_tokens" CASCADE;
DROP TABLE IF EXISTS "superadmin_refresh_tokens" CASCADE;

-- 1) superadmin_refresh_tokens (UUID → UUID)
CREATE TABLE "superadmin_refresh_tokens" (
  "id"         uuid           NOT NULL DEFAULT gen_random_uuid(),
  "admin_id"   uuid           NOT NULL,
  "token_hash" varchar(255)   NOT NULL,
  "issued_at"  timestamptz(6) NOT NULL,
  "expires_at" timestamptz(6) NOT NULL,
  "revoked_at" timestamptz(6),
  "ip"         varchar(100),
  "user_agent" varchar(255),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "superadmin_refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_superadmin_refresh_tokens_admin_id"
  ON "superadmin_refresh_tokens" ("admin_id");

ALTER TABLE "superadmin_refresh_tokens"
  ADD CONSTRAINT "fk_superadmins_superadmin_refresh_tokens"
  FOREIGN KEY ("admin_id") REFERENCES "superadmins"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- 2) candidate_refresh_tokens (VARCHAR(50) → VARCHAR(50))
CREATE TABLE "candidate_refresh_tokens" (
  "id"           uuid           NOT NULL DEFAULT gen_random_uuid(),
  "candidate_id" varchar(50)    NOT NULL,
  "token_hash"   varchar(255)   NOT NULL,
  "issued_at"    timestamptz(6) NOT NULL,
  "expires_at"   timestamptz(6) NOT NULL,
  "revoked_at"   timestamptz(6),
  "ip"           varchar(100),
  "user_agent"   varchar(255),
  "created_at"   timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "candidate_refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_candidate_refresh_tokens_candidate_id"
  ON "candidate_refresh_tokens" ("candidate_id");

ALTER TABLE "candidate_refresh_tokens"
  ADD CONSTRAINT "fk_candidates_candidate_refresh_tokens"
  FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- 3) employer_refresh_tokens (VARCHAR(50) → VARCHAR(50))
CREATE TABLE "employer_refresh_tokens" (
  "id"          uuid           NOT NULL DEFAULT gen_random_uuid(),
  "employer_id" varchar(50)    NOT NULL,
  "token_hash"  varchar(255)   NOT NULL,
  "issued_at"   timestamptz(6) NOT NULL,
  "expires_at"  timestamptz(6) NOT NULL,
  "revoked_at"  timestamptz(6),
  "ip"          varchar(100),
  "user_agent"  varchar(255),
  "created_at"  timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "employer_refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_employer_refresh_tokens_employer_id"
  ON "employer_refresh_tokens" ("employer_id");

ALTER TABLE "employer_refresh_tokens"
  ADD CONSTRAINT "fk_employers_employer_refresh_tokens"
  FOREIGN KEY ("employer_id") REFERENCES "employers"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT;
