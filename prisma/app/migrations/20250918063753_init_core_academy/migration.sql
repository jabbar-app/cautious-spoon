-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "academy";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateTable
CREATE TABLE "academy"."candidate_webinars" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" UUID NOT NULL,
    "id_webinar" UUID NOT NULL,
    "status" VARCHAR(50) DEFAULT 'register',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "attended_at" TIMESTAMPTZ(6),

    CONSTRAINT "candidate_webinars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT DEFAULT '',
    "registration_date" TIMESTAMPTZ(6),
    "program_start_date" TIMESTAMPTZ(6),
    "training_center" TEXT DEFAULT '',
    "capacity" BIGINT,
    "description" TEXT DEFAULT '',
    "photo" TEXT DEFAULT '',
    "price" BIGINT,
    "duration" BIGINT,
    "category" VARCHAR(225) DEFAULT '',
    "status" VARCHAR(50) DEFAULT 'upcoming',
    "is_active" BOOLEAN DEFAULT true,
    "archived" BOOLEAN DEFAULT true,
    "formulir" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(225),
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(225),
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(225),

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."webinars" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT DEFAULT '',
    "registration_date" TIMESTAMPTZ(6),
    "webinar_date" TIMESTAMPTZ(6),
    "capacity" BIGINT,
    "description" TEXT DEFAULT '',
    "photo" TEXT DEFAULT '',
    "link" TEXT DEFAULT '',
    "price" BIGINT,
    "duration" BIGINT,
    "speakers" TEXT[],
    "category" TEXT DEFAULT '',
    "status" VARCHAR(50) DEFAULT 'upcoming',
    "is_visible" BOOLEAN DEFAULT true,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(225),
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(225),
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(225),

    CONSTRAINT "webinars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."webinar_attendance_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "webinar_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "valid_from" TIMESTAMPTZ(6),
    "valid_to" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "webinar_attendance_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."candidate_screenings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "webinar_id" UUID,
    "stage" VARCHAR(50) DEFAULT 'applied',
    "is_passed_test" BOOLEAN,
    "is_matches_requirement" BOOLEAN,
    "reject_reason_matches" TEXT,
    "reject_reason_not_passed" TEXT,
    "assigned_program_id" UUID,
    "assigned_by" VARCHAR(225),
    "assigned_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "candidate_screenings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."program_interview_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "program_id" UUID NOT NULL,
    "type" VARCHAR(50) DEFAULT 'online',
    "link" TEXT DEFAULT '',
    "location_label" TEXT DEFAULT '',
    "start_at" TIMESTAMPTZ(6),
    "end_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "program_interview_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."program_interview_enrollments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "interview_schedule_id" UUID NOT NULL,
    "status" VARCHAR(50) DEFAULT 'invited',
    "passed" BOOLEAN,
    "score" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "program_interview_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."candidate_programs" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" UUID NOT NULL,
    "id_program" UUID NOT NULL,
    "status" VARCHAR(50) DEFAULT 'register',
    "source_screening_id" UUID,
    "assigned_by" VARCHAR(225),
    "assigned_at" TIMESTAMPTZ(6),
    "assignment_reason" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(225),

    CONSTRAINT "candidate_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."candidate_bookmark_webinars" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" UUID NOT NULL,
    "id_webinar" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "candidate_bookmark_webinars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."superadmins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(50) DEFAULT '',
    "password" TEXT DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "superadmins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."superadmin_refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "ip" VARCHAR(100),
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "superadmin_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."token_blacklists" (
    "id" BIGSERIAL NOT NULL,
    "refresh_token" TEXT DEFAULT '',
    "created_by" VARCHAR(50) DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "token_blacklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."admins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(225) NOT NULL,
    "password" VARCHAR(225) NOT NULL,
    "name" VARCHAR(225) DEFAULT '',
    "phone" VARCHAR(225) DEFAULT '',
    "photo" VARCHAR(225) DEFAULT '',
    "last_login" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."permissions" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',
    "dynamic_title" TEXT DEFAULT '',
    "description" TEXT DEFAULT '',

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."roles" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',
    "description" TEXT DEFAULT '',

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."role_permissions" (
    "id_role" BIGINT NOT NULL,
    "id_permission" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id_role","id_permission")
);

-- CreateTable
CREATE TABLE "core"."admin_roles" (
    "id_admin" UUID NOT NULL,
    "id_role" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id_admin","id_role")
);

-- CreateTable
CREATE TABLE "core"."admin_refresh_tokens" (
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

-- CreateTable
CREATE TABLE "core"."admin_candidate" (
    "id" BIGSERIAL NOT NULL,
    "id_admin" UUID NOT NULL,
    "id_candidate" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "admin_candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."candidates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(225) NOT NULL,
    "password" VARCHAR(225) NOT NULL,
    "onboarding" BOOLEAN DEFAULT false,
    "verified" JSONB DEFAULT '{}',
    "talent_id" VARCHAR(100) DEFAULT '',
    "name" VARCHAR(225) DEFAULT '',
    "sex" VARCHAR(10) DEFAULT '',
    "address_info" JSONB DEFAULT '{}',
    "birth_info" JSONB DEFAULT '{}',
    "document" JSONB DEFAULT '{}',
    "education" JSONB DEFAULT '{}',
    "phone" VARCHAR(50) DEFAULT '',
    "marital_status" VARCHAR(225) DEFAULT '',
    "religion" VARCHAR(225) DEFAULT '',
    "email_verified" BOOLEAN DEFAULT false,
    "email_verified_at" TIMESTAMPTZ(6),
    "last_login" TIMESTAMPTZ(6),
    "status" INTEGER DEFAULT 1,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "password_updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_by" VARCHAR(50) DEFAULT '',
    "created_by" VARCHAR(225),

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."candidate_refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "ip" VARCHAR(100),
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."candidate_skills" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" UUID,
    "name" VARCHAR(225) DEFAULT '',
    "tag" VARCHAR(50) DEFAULT '',
    "certificate" TEXT DEFAULT '',
    "level" VARCHAR(100) DEFAULT '',
    "issue_date" TIMESTAMPTZ(6),
    "is_verified" BOOLEAN DEFAULT false,
    "verification_date" TIMESTAMPTZ(6),
    "id_admin_verificator" VARCHAR(50) DEFAULT '',
    "status" VARCHAR(5),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "candidate_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."candidate_work_exps" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" UUID,
    "company" VARCHAR(255) DEFAULT '',
    "occupation" UUID,
    "industry" UUID,
    "start_year" VARCHAR(50) DEFAULT '',
    "start_month" VARCHAR(50) DEFAULT '',
    "end_year" VARCHAR(50) DEFAULT '',
    "end_month" VARCHAR(50) DEFAULT '',
    "so" VARCHAR(255) DEFAULT '',
    "description" TEXT DEFAULT '',
    "certificate" TEXT DEFAULT '',
    "certificate_test" TEXT DEFAULT '',
    "is_verified" BOOLEAN DEFAULT false,
    "field" TEXT DEFAULT '',
    "tag" VARCHAR(50) DEFAULT '',
    "status" VARCHAR(5),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "candidate_work_exps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."industries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "industry_ind" TEXT,
    "industry_jpn" TEXT,
    "industry_eng" TEXT,
    "tag" VARCHAR(10),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."occupations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_job_indsutry" UUID,
    "occupation_ind" TEXT,
    "occupation_jpn" TEXT,
    "occupation_eng" TEXT,
    "tag" VARCHAR(10),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "occupations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."skills" (
    "id" BIGSERIAL NOT NULL,
    "skill_ind" VARCHAR(225) DEFAULT '',
    "skill_eng" VARCHAR(225) DEFAULT '',
    "skill_jpn" VARCHAR(225) DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."prefectures" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jp" VARCHAR(50) DEFAULT '',
    "idn" VARCHAR(50) DEFAULT '',
    "eng" VARCHAR(50) DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "prefectures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."locations" (
    "id" BIGSERIAL NOT NULL,
    "city" VARCHAR(225) DEFAULT '',
    "country" VARCHAR(225) DEFAULT '',

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."provinces" (
    "id" BIGSERIAL NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "capital" VARCHAR(100) NOT NULL,
    "p_bsni" VARCHAR(5) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."cities" (
    "id" BIGSERIAL NOT NULL,
    "province_id" BIGINT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "capital" VARCHAR(100) NOT NULL,
    "k_bsni" VARCHAR(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."districts" (
    "id" BIGSERIAL NOT NULL,
    "city_id" BIGINT NOT NULL,
    "district" VARCHAR(100) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."sub_districts" (
    "id" BIGSERIAL NOT NULL,
    "district_id" BIGINT NOT NULL,
    "sub_district" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(5) NOT NULL,

    CONSTRAINT "sub_districts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "idx_candidate_webinar" ON "academy"."candidate_webinars"("id_candidate", "id_webinar");

-- CreateIndex
CREATE INDEX "idx_programs_deleted_at" ON "academy"."programs"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_webinars_deleted_at" ON "academy"."webinars"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_webinar_code_valid" ON "academy"."webinar_attendance_codes"("webinar_id", "valid_to");

-- CreateIndex
CREATE INDEX "idx_screening_candidate_webinar" ON "academy"."candidate_screenings"("candidate_id", "webinar_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_interview_schedules_program_date" ON "academy"."program_interview_schedules"("program_id");

-- CreateIndex
CREATE INDEX "idx_enrollment_program_status" ON "academy"."program_interview_enrollments"("program_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_enrollment_candidate_schedule" ON "academy"."program_interview_enrollments"("candidate_id", "interview_schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_candidate_program" ON "academy"."candidate_programs"("id_candidate", "id_program");

-- CreateIndex
CREATE UNIQUE INDEX "idx_candidates_webinars" ON "academy"."candidate_bookmark_webinars"("id_candidate", "id_webinar");

-- CreateIndex
CREATE INDEX "idx_superadmin_refresh_tokens_admin_id" ON "core"."superadmin_refresh_tokens"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "uni_admins_email" ON "core"."admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uni_permissions_title" ON "core"."permissions"("title");

-- CreateIndex
CREATE UNIQUE INDEX "uni_roles_title" ON "core"."roles"("title");

-- CreateIndex
CREATE INDEX "idx_role_permissions_id_permission" ON "core"."role_permissions"("id_permission");

-- CreateIndex
CREATE INDEX "idx_admin_roles_id_role" ON "core"."admin_roles"("id_role");

-- CreateIndex
CREATE INDEX "idx_admin_refresh_tokens_admin_id" ON "core"."admin_refresh_tokens"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "uni_candidates_email" ON "core"."candidates"("email");

-- CreateIndex
CREATE INDEX "candidate_refresh_tokens_candidate_id_idx" ON "core"."candidate_refresh_tokens"("candidate_id");

-- CreateIndex
CREATE INDEX "idx_provinces_capital" ON "core"."provinces"("capital");

-- CreateIndex
CREATE INDEX "idx_provinces_id" ON "core"."provinces"("id");

-- CreateIndex
CREATE INDEX "idx_provinces_p_bsni" ON "core"."provinces"("p_bsni");

-- CreateIndex
CREATE INDEX "idx_provinces_province" ON "core"."provinces"("province");

-- CreateIndex
CREATE INDEX "idx_cities_city" ON "core"."cities"("city");

-- CreateIndex
CREATE INDEX "idx_cities_id" ON "core"."cities"("id");

-- CreateIndex
CREATE INDEX "idx_cities_k_bsni" ON "core"."cities"("k_bsni");

-- CreateIndex
CREATE INDEX "idx_cities_province_id" ON "core"."cities"("province_id");

-- CreateIndex
CREATE INDEX "idx_districts_city_id" ON "core"."districts"("city_id");

-- CreateIndex
CREATE INDEX "idx_districts_district" ON "core"."districts"("district");

-- CreateIndex
CREATE INDEX "idx_districts_id" ON "core"."districts"("id");

-- CreateIndex
CREATE INDEX "idx_sub_districts_district_id" ON "core"."sub_districts"("district_id");

-- CreateIndex
CREATE INDEX "idx_sub_districts_id" ON "core"."sub_districts"("id");

-- CreateIndex
CREATE INDEX "idx_sub_districts_postal_code" ON "core"."sub_districts"("postal_code");

-- CreateIndex
CREATE INDEX "idx_sub_districts_sub_district" ON "core"."sub_districts"("sub_district");

-- AddForeignKey
ALTER TABLE "academy"."candidate_webinars" ADD CONSTRAINT "candidate_webinars_id_candidate_fkey" FOREIGN KEY ("id_candidate") REFERENCES "core"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."candidate_webinars" ADD CONSTRAINT "candidate_webinars_id_webinar_fkey" FOREIGN KEY ("id_webinar") REFERENCES "academy"."webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."webinar_attendance_codes" ADD CONSTRAINT "webinar_attendance_codes_webinar_id_fkey" FOREIGN KEY ("webinar_id") REFERENCES "academy"."webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."candidate_screenings" ADD CONSTRAINT "fk_candidates_screenings" FOREIGN KEY ("candidate_id") REFERENCES "core"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."candidate_screenings" ADD CONSTRAINT "fk_webinars_screenings" FOREIGN KEY ("webinar_id") REFERENCES "academy"."webinars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."candidate_screenings" ADD CONSTRAINT "fk_programs_screenings_assigned" FOREIGN KEY ("assigned_program_id") REFERENCES "academy"."programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."program_interview_schedules" ADD CONSTRAINT "fk_programs_interview_schedules" FOREIGN KEY ("program_id") REFERENCES "academy"."programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."program_interview_enrollments" ADD CONSTRAINT "fk_candidates_interview_enrollments" FOREIGN KEY ("candidate_id") REFERENCES "core"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."program_interview_enrollments" ADD CONSTRAINT "fk_programs_interview_enrollments" FOREIGN KEY ("program_id") REFERENCES "academy"."programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."program_interview_enrollments" ADD CONSTRAINT "fk_interview_schedule_enrollments" FOREIGN KEY ("interview_schedule_id") REFERENCES "academy"."program_interview_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."candidate_programs" ADD CONSTRAINT "fk_candidates_candidate_programs" FOREIGN KEY ("id_candidate") REFERENCES "core"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."candidate_programs" ADD CONSTRAINT "fk_programs_candidate_programs" FOREIGN KEY ("id_program") REFERENCES "academy"."programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."candidate_programs" ADD CONSTRAINT "fk_candidate_programs_screening" FOREIGN KEY ("source_screening_id") REFERENCES "academy"."candidate_screenings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."candidate_bookmark_webinars" ADD CONSTRAINT "fk_candidates_candidate_bookmark_webinars" FOREIGN KEY ("id_candidate") REFERENCES "core"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."candidate_bookmark_webinars" ADD CONSTRAINT "fk_webinars_candidate_bookmark_webinars" FOREIGN KEY ("id_webinar") REFERENCES "academy"."webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."superadmin_refresh_tokens" ADD CONSTRAINT "superadmin_refresh_tokens_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "core"."superadmins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."role_permissions" ADD CONSTRAINT "role_permissions_id_permission_fkey" FOREIGN KEY ("id_permission") REFERENCES "core"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."role_permissions" ADD CONSTRAINT "role_permissions_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "core"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."admin_roles" ADD CONSTRAINT "admin_roles_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "core"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."admin_roles" ADD CONSTRAINT "admin_roles_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "core"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "core"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."admin_candidate" ADD CONSTRAINT "admin_candidate_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "core"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."admin_candidate" ADD CONSTRAINT "admin_candidate_id_candidate_fkey" FOREIGN KEY ("id_candidate") REFERENCES "core"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."candidate_refresh_tokens" ADD CONSTRAINT "candidate_refresh_tokens_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "core"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."candidate_skills" ADD CONSTRAINT "fk_candidates_candidate_skill" FOREIGN KEY ("id_candidate") REFERENCES "core"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."candidate_work_exps" ADD CONSTRAINT "candidate_work_exps_occupation_fkey" FOREIGN KEY ("occupation") REFERENCES "core"."occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."candidate_work_exps" ADD CONSTRAINT "candidate_work_exps_industry_fkey" FOREIGN KEY ("industry") REFERENCES "core"."industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."candidate_work_exps" ADD CONSTRAINT "candidate_work_exps_id_candidate_fkey" FOREIGN KEY ("id_candidate") REFERENCES "core"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."occupations" ADD CONSTRAINT "occupations_id_job_indsutry_fkey" FOREIGN KEY ("id_job_indsutry") REFERENCES "core"."industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."cities" ADD CONSTRAINT "fk_provinces_cities" FOREIGN KEY ("province_id") REFERENCES "core"."provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."districts" ADD CONSTRAINT "fk_cities_districts" FOREIGN KEY ("city_id") REFERENCES "core"."cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."sub_districts" ADD CONSTRAINT "fk_districts_sub_districts" FOREIGN KEY ("district_id") REFERENCES "core"."districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
