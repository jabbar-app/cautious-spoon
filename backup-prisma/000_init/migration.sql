-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."superadmins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(50) DEFAULT '',
    "password" TEXT DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "superadmins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."superadmin_refresh_tokens" (
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
CREATE TABLE "public"."token_blacklists" (
    "id" BIGSERIAL NOT NULL,
    "refresh_token" TEXT DEFAULT '',
    "created_by" VARCHAR(50) DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "token_blacklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admins" (
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
CREATE TABLE "public"."permissions" (
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
CREATE TABLE "public"."roles" (
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
CREATE TABLE "public"."role_permissions" (
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
CREATE TABLE "public"."admin_roles" (
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

-- CreateTable
CREATE TABLE "public"."admin_candidates" (
    "id" BIGSERIAL NOT NULL,
    "id_admin" UUID NOT NULL,
    "id_candidate" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "admin_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."industries" (
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
CREATE TABLE "public"."occupations" (
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
CREATE TABLE "public"."skills" (
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
CREATE TABLE "public"."prefectures" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jp" VARCHAR(50) DEFAULT '',
    "idn" VARCHAR(50) DEFAULT '',
    "eng" VARCHAR(50) DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "prefectures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" BIGSERIAL NOT NULL,
    "city" VARCHAR(225) DEFAULT '',
    "country" VARCHAR(225) DEFAULT '',

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provinces" (
    "id" BIGSERIAL NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "capital" VARCHAR(100) NOT NULL,
    "p_bsni" VARCHAR(5) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cities" (
    "id" BIGSERIAL NOT NULL,
    "province_id" BIGINT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "capital" VARCHAR(100) NOT NULL,
    "k_bsni" VARCHAR(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."districts" (
    "id" BIGSERIAL NOT NULL,
    "city_id" BIGINT NOT NULL,
    "district" VARCHAR(100) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sub_districts" (
    "id" BIGSERIAL NOT NULL,
    "district_id" BIGINT NOT NULL,
    "sub_district" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(5) NOT NULL,

    CONSTRAINT "sub_districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blog_news" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT DEFAULT '',
    "category" TEXT DEFAULT '',
    "lang" TEXT DEFAULT '',
    "type" TEXT DEFAULT 'IND',
    "publish_date" TIMESTAMPTZ(6),
    "content" TEXT DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "link" TEXT DEFAULT '',
    "featured" BOOLEAN DEFAULT false,
    "is_visible" BOOLEAN DEFAULT true,
    "status" VARCHAR(50) DEFAULT 'draft',
    "views" BIGINT DEFAULT 0,
    "created_by" VARCHAR(225) DEFAULT '',
    "slug" VARCHAR(225) DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "blog_news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blog_news_tags" (
    "id" BIGSERIAL NOT NULL,
    "tags" JSONB[],
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "blog_news_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ssw_exam_infos" (
    "id" BIGSERIAL NOT NULL,
    "id_job_industry" UUID,
    "city" VARCHAR(225),
    "date" TEXT[],

    CONSTRAINT "ssw_exam_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_company" UUID,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "onboarding" BOOLEAN DEFAULT false,
    "name" VARCHAR(255) DEFAULT '',
    "department" VARCHAR(255) DEFAULT '',
    "phone" VARCHAR(20) DEFAULT '',
    "photo" TEXT DEFAULT '',
    "email_verified" BOOLEAN DEFAULT false,
    "email_verified_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN,
    "last_login" TIMESTAMPTZ(6),
    "website" TEXT DEFAULT '',
    "is_admin" BOOLEAN DEFAULT false,
    "password_updated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employer_refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "ip" VARCHAR(100),
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employer_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(225) DEFAULT '',
    "so_name" VARCHAR(225) DEFAULT '',
    "phone" VARCHAR(225) DEFAULT '',
    "website" VARCHAR(225) DEFAULT '',
    "prefecture" VARCHAR(225) DEFAULT '',
    "city" VARCHAR(225) DEFAULT '',
    "street" VARCHAR(225) DEFAULT '',
    "postal_code" VARCHAR(225) DEFAULT '',
    "description" TEXT DEFAULT '',
    "employee" VARCHAR(225) DEFAULT '',
    "industry" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cover" TEXT DEFAULT '',
    "logo" TEXT DEFAULT '',
    "contracts" JSONB[],
    "is_listed" BOOLEAN DEFAULT false,
    "director" VARCHAR(255) DEFAULT '',
    "country" VARCHAR(225) DEFAULT '',
    "status" VARCHAR(50) DEFAULT 'new_registered',
    "phase" VARCHAR(50) DEFAULT 'DEFAULT',
    "code" TEXT DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',
    "status_updated_at" TIMESTAMPTZ(6),
    "status_updated_by" VARCHAR(50) DEFAULT '',
    "type" VARCHAR(225) DEFAULT '',
    "line_business" VARCHAR(225) DEFAULT '',
    "establishment" VARCHAR(225) DEFAULT '',
    "fee" VARCHAR(225) DEFAULT '',

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidates" (
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

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidate_bookmark_webinars" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" UUID NOT NULL,
    "id_webinar" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "candidate_bookmark_webinars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidate_certificates" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" UUID,
    "tag" VARCHAR(100) DEFAULT '',
    "certificate_level" VARCHAR(100) DEFAULT '',
    "issue_date" TIMESTAMPTZ(6),
    "is_verified" BOOLEAN DEFAULT false,
    "verification_date" TIMESTAMPTZ(6),
    "id_admin_verificator" TEXT DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "candidate_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidate_skills" (
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
CREATE TABLE "public"."candidate_webinars" (
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
CREATE TABLE "public"."candidate_work_exps" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" UUID,
    "company" VARCHAR(255) DEFAULT '',
    "occupation" VARCHAR(255) DEFAULT '',
    "industry" VARCHAR(255) DEFAULT '',
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
CREATE TABLE "public"."candidate_refresh_tokens" (
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
CREATE TABLE "public"."programs" (
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
CREATE TABLE "public"."webinars" (
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
CREATE TABLE "public"."webinar_attendance_codes" (
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
CREATE TABLE "public"."candidate_screenings" (
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
CREATE TABLE "public"."program_interview_schedules" (
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
CREATE TABLE "public"."program_interview_enrollments" (
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
CREATE TABLE "public"."candidate_programs" (
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

-- CreateIndex
CREATE INDEX "idx_superadmin_refresh_tokens_admin_id" ON "public"."superadmin_refresh_tokens"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "uni_admins_email" ON "public"."admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uni_permissions_title" ON "public"."permissions"("title");

-- CreateIndex
CREATE UNIQUE INDEX "uni_roles_title" ON "public"."roles"("title");

-- CreateIndex
CREATE INDEX "idx_role_permissions_id_permission" ON "public"."role_permissions"("id_permission");

-- CreateIndex
CREATE INDEX "idx_admin_roles_id_role" ON "public"."admin_roles"("id_role");

-- CreateIndex
CREATE INDEX "idx_admin_refresh_tokens_admin_id" ON "public"."admin_refresh_tokens"("admin_id");

-- CreateIndex
CREATE INDEX "idx_provinces_capital" ON "public"."provinces"("capital");

-- CreateIndex
CREATE INDEX "idx_provinces_id" ON "public"."provinces"("id");

-- CreateIndex
CREATE INDEX "idx_provinces_p_bsni" ON "public"."provinces"("p_bsni");

-- CreateIndex
CREATE INDEX "idx_provinces_province" ON "public"."provinces"("province");

-- CreateIndex
CREATE INDEX "idx_cities_city" ON "public"."cities"("city");

-- CreateIndex
CREATE INDEX "idx_cities_id" ON "public"."cities"("id");

-- CreateIndex
CREATE INDEX "idx_cities_k_bsni" ON "public"."cities"("k_bsni");

-- CreateIndex
CREATE INDEX "idx_cities_province_id" ON "public"."cities"("province_id");

-- CreateIndex
CREATE INDEX "idx_districts_city_id" ON "public"."districts"("city_id");

-- CreateIndex
CREATE INDEX "idx_districts_district" ON "public"."districts"("district");

-- CreateIndex
CREATE INDEX "idx_districts_id" ON "public"."districts"("id");

-- CreateIndex
CREATE INDEX "idx_sub_districts_district_id" ON "public"."sub_districts"("district_id");

-- CreateIndex
CREATE INDEX "idx_sub_districts_id" ON "public"."sub_districts"("id");

-- CreateIndex
CREATE INDEX "idx_sub_districts_postal_code" ON "public"."sub_districts"("postal_code");

-- CreateIndex
CREATE INDEX "idx_sub_districts_sub_district" ON "public"."sub_districts"("sub_district");

-- CreateIndex
CREATE UNIQUE INDEX "uni_employers_email" ON "public"."employers"("email");

-- CreateIndex
CREATE INDEX "idx_employer_refresh_tokens_employer_id" ON "public"."employer_refresh_tokens"("employer_id");

-- CreateIndex
CREATE UNIQUE INDEX "uni_candidates_email" ON "public"."candidates"("email");

-- CreateIndex
CREATE UNIQUE INDEX "idx_candidates_webinars" ON "public"."candidate_bookmark_webinars"("id_candidate", "id_webinar");

-- CreateIndex
CREATE UNIQUE INDEX "idx_candidate_webinar" ON "public"."candidate_webinars"("id_candidate", "id_webinar");

-- CreateIndex
CREATE INDEX "idx_candidate_refresh_tokens_candidate_id" ON "public"."candidate_refresh_tokens"("candidate_id");

-- CreateIndex
CREATE INDEX "idx_programs_deleted_at" ON "public"."programs"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_webinars_deleted_at" ON "public"."webinars"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_webinar_code_valid" ON "public"."webinar_attendance_codes"("webinar_id", "valid_to");

-- CreateIndex
CREATE INDEX "idx_screening_candidate_webinar" ON "public"."candidate_screenings"("candidate_id", "webinar_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_interview_schedules_program_date" ON "public"."program_interview_schedules"("program_id");

-- CreateIndex
CREATE INDEX "idx_enrollment_program_status" ON "public"."program_interview_enrollments"("program_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_enrollment_candidate_schedule" ON "public"."program_interview_enrollments"("candidate_id", "interview_schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_candidate_program" ON "public"."candidate_programs"("id_candidate", "id_program");

-- AddForeignKey
ALTER TABLE "public"."superadmin_refresh_tokens" ADD CONSTRAINT "fk_superadmins_superadmin_refresh_tokens" FOREIGN KEY ("admin_id") REFERENCES "public"."superadmins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "fk_permissions_role_permissions" FOREIGN KEY ("id_permission") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "fk_roles_role_permissions" FOREIGN KEY ("id_role") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_roles" ADD CONSTRAINT "fk_admins_admin_roles" FOREIGN KEY ("id_admin") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_roles" ADD CONSTRAINT "fk_roles_admin_roles" FOREIGN KEY ("id_role") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_refresh_tokens" ADD CONSTRAINT "fk_admins_admin_refresh_tokens" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_candidates" ADD CONSTRAINT "fk_admins_admin_candidates" FOREIGN KEY ("id_admin") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_candidates" ADD CONSTRAINT "fk_candidates_admin_candidates" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."occupations" ADD CONSTRAINT "fk_job_industries_occupations" FOREIGN KEY ("id_job_indsutry") REFERENCES "public"."industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cities" ADD CONSTRAINT "fk_provinces_cities" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."districts" ADD CONSTRAINT "fk_cities_districts" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sub_districts" ADD CONSTRAINT "fk_districts_sub_districts" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employers" ADD CONSTRAINT "fk_companies_employer" FOREIGN KEY ("id_company") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employer_refresh_tokens" ADD CONSTRAINT "fk_employers_employer_refresh_tokens" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_bookmark_webinars" ADD CONSTRAINT "fk_candidates_candidate_bookmark_webinars" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_bookmark_webinars" ADD CONSTRAINT "fk_webinars_candidate_bookmark_webinars" FOREIGN KEY ("id_webinar") REFERENCES "public"."webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_skills" ADD CONSTRAINT "fk_candidates_candidate_skill" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_webinars" ADD CONSTRAINT "fk_candidates_candidate_webinar" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_webinars" ADD CONSTRAINT "fk_webinars_candidate_webinar" FOREIGN KEY ("id_webinar") REFERENCES "public"."webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_work_exps" ADD CONSTRAINT "fk_occupations_candidate_work_exps" FOREIGN KEY ("occupation") REFERENCES "public"."occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_work_exps" ADD CONSTRAINT "fk_industries_candidate_work_exps" FOREIGN KEY ("industry") REFERENCES "public"."industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_work_exps" ADD CONSTRAINT "fk_candidates_candidate_work_exps" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_refresh_tokens" ADD CONSTRAINT "fk_candidates_candidate_refresh_tokens" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webinar_attendance_codes" ADD CONSTRAINT "fk_webinars_attendance_code" FOREIGN KEY ("webinar_id") REFERENCES "public"."webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_screenings" ADD CONSTRAINT "fk_candidates_screenings" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_screenings" ADD CONSTRAINT "fk_webinars_screenings" FOREIGN KEY ("webinar_id") REFERENCES "public"."webinars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_screenings" ADD CONSTRAINT "fk_programs_screenings_assigned" FOREIGN KEY ("assigned_program_id") REFERENCES "public"."programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."program_interview_schedules" ADD CONSTRAINT "fk_programs_interview_schedules" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."program_interview_enrollments" ADD CONSTRAINT "fk_candidates_interview_enrollments" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."program_interview_enrollments" ADD CONSTRAINT "fk_programs_interview_enrollments" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."program_interview_enrollments" ADD CONSTRAINT "fk_interview_schedule_enrollments" FOREIGN KEY ("interview_schedule_id") REFERENCES "public"."program_interview_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_programs" ADD CONSTRAINT "fk_candidates_candidate_programs" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_programs" ADD CONSTRAINT "fk_programs_candidate_programs" FOREIGN KEY ("id_program") REFERENCES "public"."programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_programs" ADD CONSTRAINT "fk_candidate_programs_screening" FOREIGN KEY ("source_screening_id") REFERENCES "public"."candidate_screenings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

