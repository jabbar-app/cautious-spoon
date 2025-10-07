/*
  Warnings:

  - You are about to alter the column `updated_by` on the `candidates` table. The data in that column could be lost. The data in that column will be cast from `VarChar(225)` to `VarChar(50)`.
  - You are about to alter the column `deleted_by` on the `candidates` table. The data in that column could be lost. The data in that column will be cast from `VarChar(225)` to `VarChar(50)`.

*/
-- DropForeignKey
ALTER TABLE "public"."candidate_refresh_tokens" DROP CONSTRAINT "fk_candidates_candidate_refresh_tokens";

-- DropForeignKey
ALTER TABLE "public"."employer_refresh_tokens" DROP CONSTRAINT "fk_employers_employer_refresh_tokens";

-- DropForeignKey
ALTER TABLE "public"."superadmin_refresh_tokens" DROP CONSTRAINT "fk_superadmins_superadmin_refresh_tokens";

-- AlterTable
ALTER TABLE "public"."candidates" ALTER COLUMN "updated_by" SET DEFAULT '',
ALTER COLUMN "updated_by" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "deleted_by" SET DEFAULT '',
ALTER COLUMN "deleted_by" SET DATA TYPE VARCHAR(50);

-- AddForeignKey
ALTER TABLE "public"."superadmin_refresh_tokens" ADD CONSTRAINT "fk_superadmins_superadmin_refresh_tokens" FOREIGN KEY ("admin_id") REFERENCES "public"."superadmins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_refresh_tokens" ADD CONSTRAINT "fk_candidates_candidate_refresh_tokens" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employer_refresh_tokens" ADD CONSTRAINT "fk_employers_employer_refresh_tokens" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
