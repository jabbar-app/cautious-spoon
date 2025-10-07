-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."admin_candidates" (
    "id" BIGSERIAL NOT NULL,
    "id_admin" UUID NOT NULL,
    "id_candidate" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "admin_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_companies" (
    "id_admin" VARCHAR(50),
    "id_company" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT ''
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
    "deleted_by" VARCHAR(50) DEFAULT ''
);

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(225) NOT NULL,
    "password" VARCHAR(225) NOT NULL,
    "name" VARCHAR(225) DEFAULT '',
    "phone" VARCHAR(225) DEFAULT '',
    "photo" VARCHAR(225) DEFAULT '',
    "email_verified" BOOLEAN DEFAULT false,
    "email_verified_at" TIMESTAMPTZ(6),
    "last_login" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "is_creator" BOOLEAN DEFAULT false,
    "is_consultant" BOOLEAN DEFAULT false,
    "is_marketing" BOOLEAN DEFAULT false,
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."application_histories" (
    "id" BIGSERIAL NOT NULL,
    "id_application" VARCHAR(50) NOT NULL DEFAULT 'not null',
    "status" VARCHAR(100) DEFAULT '',
    "notes" TEXT DEFAULT '',
    "interview_date" TIMESTAMPTZ(6),
    "attendance" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "application_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."applications" (
    "id" VARCHAR(50) NOT NULL,
    "id_candidate" VARCHAR(50) NOT NULL DEFAULT 'not null',
    "id_job_order" VARCHAR(50) NOT NULL DEFAULT 'not null',
    "id_vacancy" VARCHAR(50) DEFAULT '',
    "application_code" TEXT DEFAULT '',
    "scout_status" VARCHAR(50) DEFAULT '',
    "progress" VARCHAR(225) DEFAULT '',
    "status" VARCHAR(225) DEFAULT '',
    "status_updated_at" TIMESTAMPTZ(6),
    "status_updated_by" VARCHAR(50) DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blog_ids" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT,
    "category" TEXT,
    "publish_date" TIMESTAMPTZ(6),
    "content" TEXT,
    "tag" VARCHAR(50),
    "images" TEXT[],
    "link" TEXT,
    "featured" BOOLEAN,
    "visibility" BOOLEAN,
    "status" BIGINT,
    "views" BIGINT,

    CONSTRAINT "blog_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blog_news" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT DEFAULT '',
    "category" TEXT DEFAULT '',
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
CREATE TABLE "public"."blog_tags" (
    "id" BIGSERIAL NOT NULL,
    "tags" JSONB[],
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidate_bookmark_vacancies" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" VARCHAR(50) NOT NULL,
    "id_vacancy" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "candidate_bookmark_vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidate_bookmark_webinars" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" VARCHAR(50) NOT NULL,
    "id_webinar" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "candidate_bookmark_webinars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidate_certificates" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" VARCHAR(50),
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
CREATE TABLE "public"."candidate_programs" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" VARCHAR(50) NOT NULL,
    "id_program" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'register',
    "is_mcu" BOOLEAN DEFAULT false,
    "is_agree" BOOLEAN DEFAULT false,
    "documents" JSONB[],
    "payment" JSONB DEFAULT '{}',
    "is_passed_test" BOOLEAN,
    "is_matches_requirement" BOOLEAN,
    "reject_reason_matches" TEXT,
    "reject_reason_not_passed" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "test_schedule" TEXT DEFAULT '',

    CONSTRAINT "candidate_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidate_skills" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" VARCHAR(50),
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
CREATE TABLE "public"."candidate_vacancies" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" VARCHAR(50),
    "vacancy_id" VARCHAR(50),
    "status" VARCHAR(50) DEFAULT 'shortlisted',
    "application_code" VARCHAR(50) DEFAULT '',
    "scout_status" VARCHAR(50) DEFAULT '',
    "progress" TEXT DEFAULT '',
    "cancel_notes" TEXT DEFAULT '',
    "interview" JSONB DEFAULT '{}',
    "visa_history" TEXT DEFAULT '',
    "visa_notes" TEXT DEFAULT '',
    "visa_status" VARCHAR(50) DEFAULT '',
    "departure_notes" TEXT DEFAULT '',
    "waiting_departure_note" TEXT DEFAULT '',
    "failed_notes" TEXT DEFAULT '',
    "failed_reason" TEXT DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "candidate_vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidate_webinars" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" VARCHAR(50) NOT NULL,
    "id_webinar" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'register',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "candidate_webinars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidate_work_exps" (
    "id" BIGSERIAL NOT NULL,
    "id_candidate" VARCHAR(50),
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
CREATE TABLE "public"."candidates" (
    "id" VARCHAR(50) NOT NULL,
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

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."companies" (
    "id" VARCHAR(50) NOT NULL,
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
CREATE TABLE "public"."districts" (
    "id" BIGSERIAL NOT NULL,
    "city_id" BIGINT NOT NULL,
    "district" VARCHAR(100) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employers" (
    "id" VARCHAR(50) NOT NULL,
    "id_company" VARCHAR(50),
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
CREATE TABLE "public"."job_categories" (
    "id" BIGSERIAL NOT NULL,
    "category_ind" VARCHAR(225) DEFAULT '',
    "category_jpn" VARCHAR(225) DEFAULT '',
    "category_eng" VARCHAR(225) DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "job_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_consultants" (
    "id" BIGSERIAL NOT NULL,
    "id_job_order" VARCHAR(50) NOT NULL,
    "id_admin" UUID NOT NULL,

    CONSTRAINT "job_consultants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_industries" (
    "id" VARCHAR(50) NOT NULL,
    "industry_ind" TEXT,
    "industry_jpn" TEXT,
    "industry_eng" TEXT,
    "tag" VARCHAR(10),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "job_industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_orders" (
    "id" VARCHAR(50) NOT NULL,
    "id_employer" VARCHAR(50) DEFAULT '',
    "job_type" VARCHAR(225) DEFAULT '',
    "job_owner" VARCHAR(50) DEFAULT '',
    "job_title" VARCHAR(225) DEFAULT '',
    "request_reason" TEXT DEFAULT '',
    "status" VARCHAR(225) DEFAULT 'draft',
    "notes" TEXT DEFAULT '',
    "is_urgent" BOOLEAN DEFAULT false,
    "shortlist_deadline" VARCHAR(225) DEFAULT '',
    "is_allow_to_publish" BOOLEAN DEFAULT false,
    "is_display_company_name" BOOLEAN DEFAULT false,
    "join_expect_date" TIMESTAMPTZ(6),
    "recruitment_deadline" TIMESTAMPTZ(6),
    "company_handled_tax" BOOLEAN DEFAULT false,
    "salary" JSONB,
    "salary_remarks" VARCHAR(225) DEFAULT '',
    "deducions" JSONB[],
    "benefits" JSONB[],
    "allowances" JSONB[],
    "documents" JSONB[],
    "occupation" VARCHAR(225) DEFAULT '',
    "employment_type" VARCHAR(50) DEFAULT '',
    "orders" JSONB,
    "work_location" TEXT DEFAULT '',
    "position_level" VARCHAR(225) DEFAULT '',
    "job_description" TEXT DEFAULT '',
    "requirements" JSONB[],
    "working_hours" JSONB[],
    "marital_status" VARCHAR(50) DEFAULT '',
    "matching_items" JSONB,
    "job_order_code" VARCHAR(225) DEFAULT '',
    "currency" VARCHAR(100) DEFAULT '',
    "is_visible" BOOLEAN DEFAULT true,
    "last_opened_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',
    "status_updated_at" TIMESTAMPTZ(6),
    "status_updated_by" VARCHAR(50) DEFAULT '',
    "job_industry" VARCHAR(50) DEFAULT '',
    "phases" JSONB[],
    "job_category" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "job_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jp_blog_categories" (
    "id" BIGSERIAL NOT NULL,
    "titles" JSONB[],
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "jp_blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jp_blog_category_coms" (
    "title" TEXT
);

-- CreateTable
CREATE TABLE "public"."jp_blog_coms" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT,
    "category" TEXT,
    "publish_date" TIMESTAMPTZ(6),
    "content" TEXT,
    "tag" VARCHAR(50),
    "images" TEXT[],
    "link" TEXT,
    "featured" BOOLEAN,
    "visibility" BOOLEAN,
    "status" BIGINT,
    "views" BIGINT,

    CONSTRAINT "jp_blog_coms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jp_blog_tag_coms" (
    "title" TEXT
);

-- CreateTable
CREATE TABLE "public"."jp_blog_tags" (
    "title" TEXT
);

-- CreateTable
CREATE TABLE "public"."jp_news_categories" (
    "title" TEXT
);

-- CreateTable
CREATE TABLE "public"."jp_news_coms" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT,
    "category" TEXT,
    "publish_date" TIMESTAMPTZ(6),
    "content" TEXT,
    "tag" VARCHAR(50),
    "images" TEXT[],
    "link" TEXT,
    "featured" BOOLEAN,
    "visibility" BOOLEAN,
    "status" BIGINT,
    "views" BIGINT,

    CONSTRAINT "jp_news_coms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jp_news_tags" (
    "title" TEXT
);

-- CreateTable
CREATE TABLE "public"."jp_profile_scouts" (
    "id" BIGSERIAL NOT NULL,
    "id_profile" BIGINT,
    "id_company" VARCHAR(50),
    "id_vacancy" VARCHAR(50),
    "url_vacancy" VARCHAR(225),

    CONSTRAINT "jp_profile_scouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."link_invitations" (
    "id" SMALLSERIAL NOT NULL,
    "type" TEXT,
    "link" TEXT,
    "expired_time" TIMESTAMPTZ(6),

    CONSTRAINT "link_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" BIGSERIAL NOT NULL,
    "city" VARCHAR(225) DEFAULT '',
    "country" VARCHAR(225) DEFAULT '',

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."migration_version" (
    "id" BIGSERIAL NOT NULL,
    "version" BIGINT,

    CONSTRAINT "migration_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."news_ids" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT,
    "category" TEXT,
    "publish_date" TIMESTAMPTZ(6),
    "content" TEXT,
    "tag" VARCHAR(50),
    "images" TEXT[],
    "link" TEXT,
    "featured" BOOLEAN,
    "visibility" BOOLEAN,
    "status" BIGINT,
    "views" BIGINT,

    CONSTRAINT "news_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."occupations" (
    "id" VARCHAR(50) NOT NULL,
    "id_job_indsutry" VARCHAR(50),
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
CREATE TABLE "public"."pic_handle_clients" (
    "id_job_order" VARCHAR(50) NOT NULL,
    "id_admin" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50),
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50)
);

-- CreateTable
CREATE TABLE "public"."prefectures" (
    "id" VARCHAR(50) NOT NULL,
    "jp" VARCHAR(50) DEFAULT '',
    "idn" VARCHAR(50) DEFAULT '',
    "eng" VARCHAR(50) DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "prefectures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."programs" (
    "id" VARCHAR(50) NOT NULL,
    "title" TEXT DEFAULT '',
    "registration_date" TIMESTAMPTZ(6),
    "program_start_date" TIMESTAMPTZ(6),
    "training_centre" TEXT DEFAULT '',
    "capacity" BIGINT,
    "description" TEXT DEFAULT '',
    "photo" TEXT DEFAULT '',
    "price" BIGINT,
    "duration" BIGINT,
    "category" VARCHAR(225) DEFAULT '',
    "status" VARCHAR(50) DEFAULT 'upcoming',
    "created_by" VARCHAR(225),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN DEFAULT true,
    "is_visible" BOOLEAN DEFAULT true,
    "formulir" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "test_schedules" JSONB[],

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."role_permissions" (
    "id_role" BIGINT,
    "id_permission" BIGINT,
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT ''
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
CREATE TABLE "public"."ssw_exam_infos" (
    "id" BIGSERIAL NOT NULL,
    "id_job_industry" VARCHAR(50),
    "city" VARCHAR(225),
    "date" TEXT[],

    CONSTRAINT "ssw_exam_infos_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."superadmins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(50) DEFAULT '',
    "password" TEXT DEFAULT '',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "superadmins_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."vacancies" (
    "id" VARCHAR(50) NOT NULL,
    "id_job_order" VARCHAR(50) NOT NULL,
    "admin_publisher" VARCHAR(50) DEFAULT '',
    "title" VARCHAR(225) DEFAULT '',
    "type" VARCHAR(50) DEFAULT '',
    "work_type" VARCHAR(225) DEFAULT '',
    "open_position" INTEGER DEFAULT 0,
    "industry" VARCHAR(225) DEFAULT '',
    "occupation" VARCHAR(225) DEFAULT '',
    "pay_type" VARCHAR(50) DEFAULT '',
    "currency" VARCHAR(50) DEFAULT '',
    "min_salary" VARCHAR(225) DEFAULT '',
    "max_salary" VARCHAR(225) DEFAULT '',
    "work_location" VARCHAR(225) DEFAULT '',
    "description" TEXT DEFAULT '',
    "requirements" TEXT DEFAULT '',
    "phases" JSONB[],
    "is_display_company" BOOLEAN DEFAULT true,
    "images" JSONB[],
    "status" VARCHAR(50) DEFAULT '',
    "publish_end_date" TIMESTAMPTZ(6),
    "last_published_at" TIMESTAMPTZ(6),
    "vacancy_code" VARCHAR(225) DEFAULT '',
    "is_visible" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6),
    "created_by" VARCHAR(50) DEFAULT '',
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(50) DEFAULT '',
    "status_updated_at" TIMESTAMPTZ(6),
    "status_updated_by" VARCHAR(50) DEFAULT '',
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" VARCHAR(50) DEFAULT '',

    CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webinars" (
    "id" VARCHAR(50) NOT NULL,
    "id_program" VARCHAR(50),
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
    "created_by" VARCHAR(225),
    "absen_code" VARCHAR(15) DEFAULT '',
    "absen_valid_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN DEFAULT true,
    "is_generated" BOOLEAN DEFAULT false,

    CONSTRAINT "webinars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uni_admins_email" ON "public"."admins"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "idx_candidates_vacancies" ON "public"."candidate_bookmark_vacancies"("id_candidate" ASC, "id_vacancy" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "idx_candidates_webinars" ON "public"."candidate_bookmark_webinars"("id_candidate" ASC, "id_webinar" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "idx_candidate_program" ON "public"."candidate_programs"("id_candidate" ASC, "id_program" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "idx_candidate_vacancy" ON "public"."candidate_vacancies"("id_candidate" ASC, "vacancy_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "idx_candidate_webinar" ON "public"."candidate_webinars"("id_candidate" ASC, "id_webinar" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uni_candidates_email" ON "public"."candidates"("email" ASC);

-- CreateIndex
CREATE INDEX "idx_cities_city" ON "public"."cities"("city" ASC, "city" ASC);

-- CreateIndex
CREATE INDEX "idx_cities_id" ON "public"."cities"("id" ASC);

-- CreateIndex
CREATE INDEX "idx_cities_k_bsni" ON "public"."cities"("k_bsni" ASC);

-- CreateIndex
CREATE INDEX "idx_cities_province_id" ON "public"."cities"("province_id" ASC);

-- CreateIndex
CREATE INDEX "idx_districts_city_id" ON "public"."districts"("city_id" ASC);

-- CreateIndex
CREATE INDEX "idx_districts_district" ON "public"."districts"("district" ASC);

-- CreateIndex
CREATE INDEX "idx_districts_id" ON "public"."districts"("id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uni_employers_email" ON "public"."employers"("email" ASC);

-- CreateIndex
CREATE INDEX "idx_job_consultants_id" ON "public"."job_consultants"("id" ASC);

-- CreateIndex
CREATE INDEX "idx_provinces_capital" ON "public"."provinces"("capital" ASC);

-- CreateIndex
CREATE INDEX "idx_provinces_id" ON "public"."provinces"("id" ASC);

-- CreateIndex
CREATE INDEX "idx_provinces_p_bsni" ON "public"."provinces"("p_bsni" ASC);

-- CreateIndex
CREATE INDEX "idx_provinces_province" ON "public"."provinces"("province" ASC);

-- CreateIndex
CREATE INDEX "idx_sub_districts_district_id" ON "public"."sub_districts"("district_id" ASC);

-- CreateIndex
CREATE INDEX "idx_sub_districts_id" ON "public"."sub_districts"("id" ASC);

-- CreateIndex
CREATE INDEX "idx_sub_districts_postal_code" ON "public"."sub_districts"("postal_code" ASC);

-- CreateIndex
CREATE INDEX "idx_sub_districts_sub_district" ON "public"."sub_districts"("sub_district" ASC);

-- AddForeignKey
ALTER TABLE "public"."admin_candidates" ADD CONSTRAINT "fk_admins_admin_candidates" FOREIGN KEY ("id_admin") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_candidates" ADD CONSTRAINT "fk_candidates_admin_candidates" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_roles" ADD CONSTRAINT "fk_admins_admin_roles" FOREIGN KEY ("id_admin") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_roles" ADD CONSTRAINT "fk_roles_admin_roles" FOREIGN KEY ("id_role") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."application_histories" ADD CONSTRAINT "fk_applications_application_histories" FOREIGN KEY ("id_application") REFERENCES "public"."applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "fk_candidates_applications" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "fk_job_orders_applications" FOREIGN KEY ("id_job_order") REFERENCES "public"."job_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_bookmark_vacancies" ADD CONSTRAINT "fk_candidates_candidate_bookmark_vacancies" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_bookmark_vacancies" ADD CONSTRAINT "fk_vacancies_candidate_bookmark_vacancies" FOREIGN KEY ("id_vacancy") REFERENCES "public"."vacancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_bookmark_webinars" ADD CONSTRAINT "fk_candidates_candidate_bookmark_webinars" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_bookmark_webinars" ADD CONSTRAINT "fk_webinars_candidate_bookmark_webinars" FOREIGN KEY ("id_webinar") REFERENCES "public"."webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_programs" ADD CONSTRAINT "fk_candidates_candidate_programs" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_programs" ADD CONSTRAINT "fk_programs_candidate_programs" FOREIGN KEY ("id_program") REFERENCES "public"."programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_skills" ADD CONSTRAINT "fk_candidates_candidate_skill" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_vacancies" ADD CONSTRAINT "fk_candidates_candidate_vacancy" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_vacancies" ADD CONSTRAINT "fk_vacancies_candidate_vacancy" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_webinars" ADD CONSTRAINT "fk_candidates_candidate_webinar" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_webinars" ADD CONSTRAINT "fk_webinars_candidate_webinar" FOREIGN KEY ("id_webinar") REFERENCES "public"."webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_work_exps" ADD CONSTRAINT "fk_candidates_candidate_work_exps" FOREIGN KEY ("id_candidate") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cities" ADD CONSTRAINT "fk_provinces_cities" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."districts" ADD CONSTRAINT "fk_cities_districts" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employers" ADD CONSTRAINT "fk_companies_employer" FOREIGN KEY ("id_company") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_consultants" ADD CONSTRAINT "fk_admins_job_consultants" FOREIGN KEY ("id_admin") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_consultants" ADD CONSTRAINT "fk_job_orders_job_consultants" FOREIGN KEY ("id_job_order") REFERENCES "public"."job_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_orders" ADD CONSTRAINT "fk_employers_job_orders" FOREIGN KEY ("id_employer") REFERENCES "public"."employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jp_profile_scouts" ADD CONSTRAINT "fk_companies_jp_profile_scout" FOREIGN KEY ("id_company") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jp_profile_scouts" ADD CONSTRAINT "fk_vacancies_jp_profile_scout" FOREIGN KEY ("id_vacancy") REFERENCES "public"."vacancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."occupations" ADD CONSTRAINT "fk_job_industries_occupations" FOREIGN KEY ("id_job_indsutry") REFERENCES "public"."job_industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pic_handle_clients" ADD CONSTRAINT "fk_admins_pic_handle_clients" FOREIGN KEY ("id_admin") REFERENCES "public"."admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pic_handle_clients" ADD CONSTRAINT "fk_job_orders_pic_handle_clients" FOREIGN KEY ("id_job_order") REFERENCES "public"."job_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "fk_permissions_role_permissions" FOREIGN KEY ("id_permission") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "fk_roles_role_permissions" FOREIGN KEY ("id_role") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sub_districts" ADD CONSTRAINT "fk_districts_sub_districts" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vacancies" ADD CONSTRAINT "fk_job_orders_vacancies" FOREIGN KEY ("id_job_order") REFERENCES "public"."job_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webinars" ADD CONSTRAINT "fk_programs_webinars" FOREIGN KEY ("id_program") REFERENCES "public"."programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
