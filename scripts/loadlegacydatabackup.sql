-- 001_load_legacy_data: migrate data from legacy schema into new UUID-based schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name='legacy') THEN
    RAISE NOTICE 'Schema legacy not found. Skipping legacy data import.';
    RETURN;
  END IF;

  -- Mapping tables for UUID-flipped models
  CREATE TABLE IF NOT EXISTS public._map_applications (old_id varchar(50) PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
  INSERT INTO public._map_applications(old_id, new_id)
  SELECT DISTINCT l.id, gen_random_uuid() FROM legacy.applications l
  ON CONFLICT (old_id) DO NOTHING;

  CREATE TABLE IF NOT EXISTS public._map_candidates (old_id varchar(50) PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
  INSERT INTO public._map_candidates(old_id, new_id)
  SELECT DISTINCT l.id, gen_random_uuid() FROM legacy.candidates l
  ON CONFLICT (old_id) DO NOTHING;

  CREATE TABLE IF NOT EXISTS public._map_companies (old_id varchar(50) PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
  INSERT INTO public._map_companies(old_id, new_id)
  SELECT DISTINCT l.id, gen_random_uuid() FROM legacy.companies l
  ON CONFLICT (old_id) DO NOTHING;

  CREATE TABLE IF NOT EXISTS public._map_employers (old_id varchar(50) PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
  INSERT INTO public._map_employers(old_id, new_id)
  SELECT DISTINCT l.id, gen_random_uuid() FROM legacy.employers l
  ON CONFLICT (old_id) DO NOTHING;

  CREATE TABLE IF NOT EXISTS public._map_job_industries (old_id varchar(50) PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
  INSERT INTO public._map_job_industries(old_id, new_id)
  SELECT DISTINCT l.id, gen_random_uuid() FROM legacy.job_industries l
  ON CONFLICT (old_id) DO NOTHING;

  CREATE TABLE IF NOT EXISTS public._map_job_orders (old_id varchar(50) PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
  INSERT INTO public._map_job_orders(old_id, new_id)
  SELECT DISTINCT l.id, gen_random_uuid() FROM legacy.job_orders l
  ON CONFLICT (old_id) DO NOTHING;

  CREATE TABLE IF NOT EXISTS public._map_occupations (old_id varchar(50) PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
  INSERT INTO public._map_occupations(old_id, new_id)
  SELECT DISTINCT l.id, gen_random_uuid() FROM legacy.occupations l
  ON CONFLICT (old_id) DO NOTHING;

  CREATE TABLE IF NOT EXISTS public._map_prefectures (old_id varchar(50) PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
  INSERT INTO public._map_prefectures(old_id, new_id)
  SELECT DISTINCT l.id, gen_random_uuid() FROM legacy.prefectures l
  ON CONFLICT (old_id) DO NOTHING;

  CREATE TABLE IF NOT EXISTS public._map_programs (old_id varchar(50) PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
  INSERT INTO public._map_programs(old_id, new_id)
  SELECT DISTINCT l.id, gen_random_uuid() FROM legacy.programs l
  ON CONFLICT (old_id) DO NOTHING;

  CREATE TABLE IF NOT EXISTS public._map_vacancies (old_id varchar(50) PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
  INSERT INTO public._map_vacancies(old_id, new_id)
  SELECT DISTINCT l.id, gen_random_uuid() FROM legacy.vacancies l
  ON CONFLICT (old_id) DO NOTHING;

  CREATE TABLE IF NOT EXISTS public._map_webinars (old_id varchar(50) PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
  INSERT INTO public._map_webinars(old_id, new_id)
  SELECT DISTINCT l.id, gen_random_uuid() FROM legacy.webinars l
  ON CONFLICT (old_id) DO NOTHING;

  -- Generic copier: builds a dynamic INSERT SELECT that
  -- - rewrites `id` via pk_map
  -- - rewrites FK columns via fk_maps (JSON)
  -- - uses legacy columns when they exist, else NULL
  -- Fallback-aware copier: only joins a _map_* table if it exists
    -- Fallback- and type-aware copier
    CREATE OR REPLACE FUNCTION public._copy_legacy_table(
        tgt_table text,
        src_schema text,
        pk_map_table text DEFAULT NULL,
        fk_maps jsonb DEFAULT '[]'::jsonb
    ) RETURNS void AS $BODY$
    DECLARE
    tgt_schema text := 'public';
    src_table text := quote_ident(src_schema) || '.' || quote_ident(tgt_table);
    col_rec record;
    cols text := '';
    sels text := '';
    join_sql text := '';
    first boolean := true;

    fk jsonb;
    fk_col text;
    fk_target text;
    fk_map text;
    map_reg regclass;
    map_alias text;

    tgt_data_type text;
    tgt_udt_name text;
    src_exists boolean;
    src_data_type text;
    src_udt_name text;
    elem_type text;
    BEGIN
    -- Build column list using target (public) table metadata
    FOR col_rec IN
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = tgt_schema AND table_name = tgt_table
        ORDER BY ordinal_position
    LOOP
        IF NOT first THEN
        cols := cols || ', ';
        sels := sels || ', ';
        END IF;
        first := false;

        -- Lookup types
        SELECT data_type, udt_name
        INTO tgt_data_type, tgt_udt_name
        FROM information_schema.columns
        WHERE table_schema = tgt_schema AND table_name = tgt_table AND column_name = col_rec.column_name;

        SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = src_schema AND table_name = tgt_table AND column_name = col_rec.column_name
        ) INTO src_exists;

        IF src_exists THEN
        SELECT data_type, udt_name
            INTO src_data_type, src_udt_name
        FROM information_schema.columns
        WHERE table_schema = src_schema AND table_name = tgt_table AND column_name = col_rec.column_name;
        ELSE
        src_data_type := NULL;
        src_udt_name := NULL;
        END IF;

        -- Primary key mapping
        IF col_rec.column_name = 'id' AND pk_map_table IS NOT NULL THEN
        cols := cols || quote_ident(col_rec.column_name);
        sels := sels || 'pm.new_id';
        join_sql := join_sql || format(' LEFT JOIN %I pm ON pm.old_id = l.id ', pk_map_table);
        CONTINUE;
        END IF;

        -- FK mapping if configured
        fk_col := NULL; fk_target := NULL;
        FOR fk IN SELECT * FROM jsonb_array_elements(fk_maps) LOOP
        IF (fk->>'column') = col_rec.column_name THEN
            fk_col := fk->>'column';
            fk_target := fk->>'target';
            EXIT;
        END IF;
        END LOOP;

        IF fk_col IS NOT NULL THEN
        fk_map := '_map_' || fk_target;
        SELECT to_regclass(tgt_schema || '.' || fk_map) INTO map_reg;

        IF map_reg IS NOT NULL THEN
            map_alias := fk_map;
            cols := cols || quote_ident(col_rec.column_name);
            sels := sels || quote_ident(map_alias) || '.new_id';
            join_sql := join_sql || format(' LEFT JOIN %s %s ON %s.old_id = l.%I ', fk_map, map_alias, map_alias, fk_col);
            CONTINUE;
        END IF;
        -- If no mapping table exists, fall through to source handling
        END IF;

        -- Plain columns
        cols := cols || quote_ident(col_rec.column_name);
        IF NOT src_exists THEN
        sels := sels || 'NULL';
        ELSE
        -- ARRAY target but non-ARRAY source: wrap as single-element array with NULL on empty string
        IF tgt_data_type = 'ARRAY' AND src_data_type <> 'ARRAY' THEN
            elem_type := CASE WHEN tgt_udt_name LIKE '\_%' THEN substr(tgt_udt_name, 2) ELSE 'text' END;
            sels := sels || format(
            'CASE WHEN l.%1$I IS NULL OR l.%1$I = '''' THEN NULL ELSE ARRAY[l.%1$I]::%2$s[] END',
            col_rec.column_name, elem_type
            );

        -- JSON/JSONB target but non-JSON source: cast, NULL on empty string
        ELSIF (tgt_data_type IN ('json','jsonb')) AND (src_data_type NOT IN ('json','jsonb')) THEN
            sels := sels || format(
            'CASE WHEN l.%1$I IS NULL OR l.%1$I = '''' THEN NULL ELSE l.%1$I::%2$s END',
            col_rec.column_name, tgt_data_type
            );

        ELSE
            sels := sels || format('l.%I', col_rec.column_name);
        END IF;
        END IF;

    END LOOP;

    -- Skip if legacy table missing
    IF to_regclass(src_schema || '.' || tgt_table) IS NULL THEN
        RAISE NOTICE 'Legacy table %.% not found. Skipping.', src_schema, tgt_table;
        RETURN;
    END IF;

    EXECUTE format('INSERT INTO %I.%I (%s) SELECT %s FROM %s l %s',
                    tgt_schema, tgt_table, cols, sels, src_table, join_sql);
    END;
    $BODY$ LANGUAGE plpgsql;


  -- Call copier in FK-safe order (parents first)
  PERFORM public._copy_legacy_table('programs', 'legacy', '_map_programs', '[]'::jsonb);
  PERFORM public._copy_legacy_table('candidates', 'legacy', '_map_candidates', '[]'::jsonb);
  PERFORM public._copy_legacy_table('candidate_programs', 'legacy', NULL,
    '[{"column":"id_candidate","target":"candidates"},{"column":"id_program","target":"programs"}]'::jsonb);

  PERFORM public._copy_legacy_table('admins', 'legacy', NULL, '[]'::jsonb);
  PERFORM public._copy_legacy_table('admin_candidates', 'legacy', NULL,
    '[{"column":"id_admin","target":"admins"},{"column":"id_candidate","target":"candidates"}]'::jsonb);

  PERFORM public._copy_legacy_table('companies', 'legacy', '_map_companies', '[]'::jsonb);
  PERFORM public._copy_legacy_table('employers', 'legacy', '_map_employers',
    '[{"column":"id_company","target":"companies"}]'::jsonb);

  PERFORM public._copy_legacy_table('job_orders', 'legacy', '_map_job_orders',
    '[{"column":"id_employer","target":"employers"}]'::jsonb);

  PERFORM public._copy_legacy_table('vacancies', 'legacy', '_map_vacancies',
    '[{"column":"id_job_order","target":"job_orders"}]'::jsonb);

  PERFORM public._copy_legacy_table('applications', 'legacy', '_map_applications',
    '[{"column":"id_candidate","target":"candidates"},{"column":"id_job_order","target":"job_orders"},{"column":"id_vacancy","target":"vacancies"}]'::jsonb);

  PERFORM public._copy_legacy_table('application_histories', 'legacy', NULL,
    '[{"column":"id_application","target":"applications"}]'::jsonb);

  PERFORM public._copy_legacy_table('candidate_bookmark_vacancies', 'legacy', NULL,
    '[{"column":"id_candidate","target":"candidates"},{"column":"id_vacancy","target":"vacancies"}]'::jsonb);

  PERFORM public._copy_legacy_table('candidate_skills', 'legacy', NULL,
    '[{"column":"id_candidate","target":"candidates"}]'::jsonb);

  PERFORM public._copy_legacy_table('webinars', 'legacy', '_map_webinars',
    '[{"column":"id_program","target":"programs"}]'::jsonb);

  PERFORM public._copy_legacy_table('candidate_bookmark_webinars', 'legacy', NULL,
    '[{"column":"id_candidate","target":"candidates"},{"column":"id_webinar","target":"webinars"}]'::jsonb);

  -- Master data that flipped to UUID
  PERFORM public._copy_legacy_table('job_industries', 'legacy', '_map_job_industries', '[]'::jsonb);
  PERFORM public._copy_legacy_table('occupations', 'legacy', '_map_occupations', '[{"column":"id_job_indsutry","target":"job_industries"}]'::jsonb);
  PERFORM public._copy_legacy_table('prefectures', 'legacy', '_map_prefectures', '[]'::jsonb);

  -- The rest (bigint IDs etc.) import 1:1 without pk_map
  PERFORM public._copy_legacy_table('blog_ids', 'legacy', NULL, '[]'::jsonb);
  PERFORM public._copy_legacy_table('blog_news', 'legacy', NULL, '[]'::jsonb);
  PERFORM public._copy_legacy_table('blog_tags', 'legacy', NULL, '[]'::jsonb);
  PERFORM public._copy_legacy_table('provinces', 'legacy', NULL, '[]'::jsonb);
  PERFORM public._copy_legacy_table('cities', 'legacy', NULL, '[]'::jsonb);
  PERFORM public._copy_legacy_table('districts', 'legacy', NULL, '[]'::jsonb);
  PERFORM public._copy_legacy_table('sub_districts', 'legacy', NULL, '[]'::jsonb);
--   PERFORM public._copy_legacy_table('permissions', 'legacy', NULL, '[]'::jsonb);
--   PERFORM public._copy_legacy_table('roles', 'legacy', NULL, '[]'::jsonb);
--   PERFORM public._copy_legacy_table('role_permissions', 'legacy', NULL, '[]'::jsonb);
--   PERFORM public._copy_legacy_table('job_consultants', 'legacy', NULL, '[{"column":"id_company","target":"companies"}]'::jsonb);
--   PERFORM public._copy_legacy_table('job_consultants', 'legacy', NULL, '[{"column":"id_job_order","target":"job_orders"}]'::jsonb);
--   PERFORM public._copy_legacy_table('jp_profile_scouts', 'legacy', NULL, '[{"column":"id_candidate","target":"candidates"}]'::jsonb);
--   PERFORM public._copy_legacy_table('pic_handle_clients', 'legacy', NULL, '[{"column":"id_admin","target":"admins"},{"column":"id_company","target":"companies"}]'::jsonb);
--   PERFORM public._copy_legacy_table('token_blacklists', 'legacy', NULL, '[]'::jsonb);

END $$;
