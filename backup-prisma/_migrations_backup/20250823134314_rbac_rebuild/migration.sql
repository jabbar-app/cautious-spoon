/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - Made the column `id_role` on table `role_permissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_permission` on table `role_permissions` required. This step will fail if there are existing NULL values in that column.

*/
-- RBAC cleanup (keeps all other app data intact)
BEGIN;

-- Dedup join rows so PKs/UNIQUE can be added safely
WITH d AS (
  SELECT ctid, ROW_NUMBER() OVER (PARTITION BY id_role, id_permission ORDER BY ctid) rn
  FROM role_permissions
)
DELETE FROM role_permissions rp USING d
WHERE rp.ctid = d.ctid AND d.rn > 1;

WITH d AS (
  SELECT ctid, ROW_NUMBER() OVER (PARTITION BY id_admin, id_role ORDER BY ctid) rn
  FROM admin_roles
)
DELETE FROM admin_roles ar USING d
WHERE ar.ctid = d.ctid AND d.rn > 1;

-- Clear old RBAC so we can seed a fresh set
DELETE FROM admin_roles;
DELETE FROM role_permissions;
DELETE FROM permissions;
DELETE FROM roles;

COMMIT;


-- DropIndex
DROP INDEX "public"."idx_cities_city";

-- AlterTable
ALTER TABLE "public"."admin_roles" ADD CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id_admin", "id_role");

-- AlterTable
ALTER TABLE "public"."role_permissions" ALTER COLUMN "id_role" SET NOT NULL,
ALTER COLUMN "id_permission" SET NOT NULL,
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id_role", "id_permission");

-- CreateTable
CREATE TABLE "public"."admin_refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "ip" VARCHAR(100),
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_admin_refresh_tokens_admin_id" ON "public"."admin_refresh_tokens"("admin_id");

-- CreateIndex
CREATE INDEX "idx_admin_roles_id_role" ON "public"."admin_roles"("id_role");

-- CreateIndex
CREATE INDEX "idx_cities_city" ON "public"."cities"("city");

-- CreateIndex
CREATE UNIQUE INDEX "uni_permissions_title" ON "public"."permissions"("title");

-- CreateIndex
CREATE INDEX "idx_role_permissions_id_permission" ON "public"."role_permissions"("id_permission");

-- CreateIndex
CREATE UNIQUE INDEX "uni_roles_title" ON "public"."roles"("title");

-- AddForeignKey
ALTER TABLE "public"."admin_refresh_tokens" ADD CONSTRAINT "fk_admins_admin_refresh_tokens" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
