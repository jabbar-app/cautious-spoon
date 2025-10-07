-- 001_load_legacy_data
-- Assumptions:
-- - You already renamed your original "public" to "legacy" and created a fresh "public".
-- - Extensions:
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- 0) helper: robust copier with FK maps + column remaps + type handling
CREATE OR REPLACE FUNCTION public._copy_legacy_table(
    tgt_table text,
    src_schema text,
    pk_map_table text DEFAULT NULL,
    fk_maps jsonb DEFAULT '[]'::jsonb,    -- e.g. [{"column":"id_candidate","target":"candidates"}]
    col_maps jsonb DEFAULT '[]'::jsonb    -- e.g. [{"target":"archived","source":"is_visible"}]
) RETURNS void AS $BODY$
DECLARE
  tgt_schema text := 'public';
  src_table  text := quote_ident(src_schema) || '.' || quote_ident(tgt_table);
  col_rec record;
  cols text := '';
  sels text := '';
  join_sql text := '';
  first boolean := true;

  fk jsonb; fk_col text; fk_target text; fk_map text; map_reg regclass; map_alias text;
  cm jsonb; cm_target text; cm_source text;

  tgt_data_type text; tgt_udt_name text;
  src_exists boolean; src_data_type text; src_udt_name text;
  elem_type text;
BEGIN
  -- build col remap index in a temp hash table (jsonb_each_text is fine inline)

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

    SELECT data_type, udt_name INTO tgt_data_type, tgt_udt_name
    FROM information_schema.columns
    WHERE table_schema=tgt_schema AND table_name=tgt_table AND column_name=col_rec.column_name;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema=src_schema AND table_name=tgt_table AND column_name=col_rec.column_name
    ) INTO src_exists;

    IF src_exists THEN
      SELECT data_type, udt_name INTO src_data_type, src_udt_name
      FROM information_schema.columns
      WHERE table_schema=src_schema AND table_name=tgt_table AND column_name=col_rec.column_name;
    ELSE
      src_data_type := NULL; src_udt_name := NULL;
    END IF;

    -- primary key mapping
    IF col_rec.column_name = 'id' AND pk_map_table IS NOT NULL THEN
      cols := cols || quote_ident(col_rec.column_name);
      sels := sels || 'pm.new_id';
      join_sql := join_sql || format(' LEFT JOIN %I pm ON pm.old_id = l.id ', pk_map_table);
      CONTINUE;
    END IF;

    -- explicit column remap?
    cm_target := NULL; cm_source := NULL;
    FOR cm IN SELECT * FROM jsonb_array_elements(col_maps)
    LOOP
      IF (cm->>'target') = col_rec.column_name THEN
        cm_target := cm->>'target';
        cm_source := cm->>'source';
        EXIT;
      END IF;
    END LOOP;

    IF cm_target IS NOT NULL THEN
      cols := cols || quote_ident(col_rec.column_name);
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema=src_schema AND table_name=tgt_table AND column_name=cm_source
      ) THEN
        -- simple source passthrough (types should align or be handled by casts below)
        sels := sels || format('l.%I', cm_source);
      ELSE
        sels := sels || 'NULL';
      END IF;
      CONTINUE;
    END IF;

    -- FK mapping?
    fk_col := NULL; fk_target := NULL;
    FOR fk IN SELECT * FROM jsonb_array_elements(fk_maps)
    LOOP
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
      -- fall through if no map
    END IF;

    -- plain column (or no map available)
    cols := cols || quote_ident(col_rec.column_name);
    IF NOT src_exists THEN
      -- column not in legacy → NULL (lets DEFAULTs apply if any)
      sels := sels || 'NULL';
    ELSE
      -- ARRAY target but non-ARRAY source: wrap
      IF tgt_data_type='ARRAY' AND src_data_type <> 'ARRAY' THEN
        elem_type := CASE WHEN tgt_udt_name LIKE '\_%' THEN substr(tgt_udt_name, 2) ELSE 'text' END;
        sels := sels || format(
          'CASE WHEN l.%1$I IS NULL OR l.%1$I = '''' THEN NULL ELSE ARRAY[l.%1$I]::%2$s[] END',
          col_rec.column_name, elem_type
        );
      -- JSON/JSONB target but non-JSON source: cast with NULL on empty string
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

  -- skip if legacy table missing
  IF to_regclass(src_schema || '.' || tgt_table) IS NULL THEN
    RAISE NOTICE 'Legacy table %.% not found. Skipping.', src_schema, tgt_table;
    RETURN;
  END IF;

  EXECUTE format('INSERT INTO %I.%I (%s) SELECT %s FROM %s l %s',
                 tgt_schema, tgt_table, cols, sels, src_table, join_sql);
END;
$BODY$ LANGUAGE plpgsql;

-- 1) mapping tables for UUID bases
CREATE TABLE IF NOT EXISTS public._map_candidates (old_id text PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS public._map_programs   (old_id text PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS public._map_webinars   (old_id text PRIMARY KEY, new_id uuid UNIQUE NOT NULL);

INSERT INTO public._map_candidates(old_id, new_id)
SELECT id::text, gen_random_uuid() FROM legacy.candidates
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO public._map_programs(old_id, new_id)
SELECT id::text, gen_random_uuid() FROM legacy.programs
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO public._map_webinars(old_id, new_id)
SELECT id::text, gen_random_uuid() FROM legacy.webinars
ON CONFLICT (old_id) DO NOTHING;

-- UUID maps for domain masters
CREATE TABLE IF NOT EXISTS public._map_job_industries (old_id text PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS public._map_occupations   (old_id text PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS public._map_prefectures   (old_id text PRIMARY KEY, new_id uuid UNIQUE NOT NULL);

INSERT INTO public._map_job_industries(old_id, new_id)
SELECT id::text, gen_random_uuid() FROM legacy.job_industries
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO public._map_occupations(old_id, new_id)
SELECT id::text, gen_random_uuid() FROM legacy.occupations
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO public._map_prefectures(old_id, new_id)
SELECT id::text, gen_random_uuid() FROM legacy.prefectures
ON CONFLICT (old_id) DO NOTHING;

-- map tables (must be before occupations)
CREATE TABLE IF NOT EXISTS public._map_job_industries (old_id text PRIMARY KEY, new_id uuid UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS public._map_occupations   (old_id text PRIMARY KEY, new_id uuid UNIQUE NOT NULL);

INSERT INTO public._map_job_industries(old_id, new_id)
SELECT id::text, gen_random_uuid() FROM legacy.job_industries
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO public._map_occupations(old_id, new_id)
SELECT id::text, gen_random_uuid() FROM legacy.occupations
ON CONFLICT (old_id) DO NOTHING;


-- 2) Import bases with renames (programs/webinars/candidates)
SELECT public._copy_legacy_table('programs', 'legacy', '_map_programs',
  '[]'::jsonb,
  '[{"target":"training_center","source":"training_centre"},{"target":"archived","source":"is_visible"}]'::jsonb);

SELECT public._copy_legacy_table('webinars', 'legacy', '_map_webinars',
  '[]'::jsonb,
  '[{"target":"archived","source":"is_visible"}]'::jsonb);

SELECT public._copy_legacy_table('candidates', 'legacy', '_map_candidates',
  '[]'::jsonb,
  '[]'::jsonb);

-- 3) Datasets & content (straight copy)
SELECT public._copy_legacy_table('provinces', 'legacy', NULL, '[]'::jsonb, '[]'::jsonb);
SELECT public._copy_legacy_table('cities', 'legacy', NULL, '[]'::jsonb, '[]'::jsonb);
SELECT public._copy_legacy_table('districts', 'legacy', NULL, '[]'::jsonb, '[]'::jsonb);
SELECT public._copy_legacy_table('sub_districts', 'legacy', NULL, '[]'::jsonb, '[]'::jsonb);

SELECT public._copy_legacy_table('job_industries', 'legacy', '_map_job_industries', '[]'::jsonb, '[]'::jsonb);

SELECT public._copy_legacy_table('occupations', 'legacy', '_map_occupations',
  '[{"column":"id_job_indsutry","target":"job_industries"}]'::jsonb,
  '[]'::jsonb);
-- SELECT public._copy_legacy_table('occupations',   'legacy', '_map_occupations',
--   '[]'::jsonb,
--   '[{"target":"id_job_indsutry","source":"id_job_indsutry"}]'::jsonb);
SELECT public._copy_legacy_table('prefectures', 'legacy', '_map_prefectures', '[]'::jsonb, '[]'::jsonb);

-- SELECT public._copy_legacy_table('blog_news', 'legacy', NULL, '[]'::jsonb, '[]'::jsonb);
-- SELECT public._copy_legacy_table('blog_tags', 'legacy', NULL, '[]'::jsonb, '[]'::jsonb);

-- 4) Candidate joins (FK maps)
SELECT public._copy_legacy_table('candidate_programs', 'legacy', NULL,
  '[{"column":"id_candidate","target":"candidates"},{"column":"id_program","target":"programs"}]'::jsonb,
  '[]'::jsonb);

SELECT public._copy_legacy_table('candidate_webinars', 'legacy', NULL,
  '[{"column":"id_candidate","target":"candidates"},{"column":"id_webinar","target":"webinars"}]'::jsonb,
  '[]'::jsonb);

SELECT public._copy_legacy_table('candidate_bookmark_webinars', 'legacy', NULL,
  '[{"column":"id_candidate","target":"candidates"},{"column":"id_webinar","target":"webinars"}]'::jsonb,
  '[]'::jsonb);

SELECT public._copy_legacy_table('candidate_skills', 'legacy', NULL,
  '[{"column":"id_candidate","target":"candidates"}]'::jsonb,
  '[]'::jsonb);

SELECT public._copy_legacy_table('candidate_work_exps', 'legacy', NULL,
  '[{"column":"id_candidate","target":"candidates"}]'::jsonb,
  '[]'::jsonb);

-- 5) Normalize schedules from legacy.programs.test_schedules → program_interview_schedules
DROP TABLE IF EXISTS public._tmp_schedule_map;
CREATE TABLE public._tmp_schedule_map (
  program_old_id  text NOT NULL,
  old_schedule_id text,
  new_schedule_id uuid NOT NULL
);

-- Materialize normalized rows (avoid CTE scoping + avoid jsonb[] casts)
DROP TABLE IF EXISTS public._tmp_norm_schedules;
CREATE TABLE public._tmp_norm_schedules (
  old_program_id  text        NOT NULL,
  old_id          text,
  type_norm       text,
  link            text,
  location_label  text,
  start_at        timestamptz,
  end_at          timestamptz
);

INSERT INTO public._tmp_norm_schedules (
  old_program_id, old_id, type_norm, link, location_label, start_at, end_at
)
SELECT
  p.id::text AS old_program_id,
  NULLIF(js_txt::jsonb->>'id','') AS old_id,
  CASE
    WHEN (js_txt::jsonb->>'type') ILIKE 'online%'  THEN 'online'
    WHEN (js_txt::jsonb->>'type') ILIKE 'offline%' THEN 'offline'
    ELSE COALESCE(js_txt::jsonb->>'type','online')
  END AS type_norm,
  COALESCE(js_txt::jsonb->>'link','') AS link,
  CASE
    WHEN (js_txt::jsonb->>'type') ILIKE 'offline_%' THEN split_part(js_txt::jsonb->>'type', '_', 2)
    WHEN (js_txt::jsonb->>'type') ILIKE 'offline %' THEN split_part(js_txt::jsonb->>'type', ' ', 2)
    ELSE ''
  END AS location_label,
  NULLIF(js_txt::jsonb->>'start_date','')::timestamptz AS start_at,
  NULLIF(js_txt::jsonb->>'end_date','')::timestamptz   AS end_at
FROM legacy.programs p
CROSS JOIN LATERAL (
  /* Build ONE jsonb array no matter the original type, then emit TEXT elements.
     No casts on the column itself → no jsonb[]→jsonb errors. */
  SELECT elem_txt
  FROM jsonb_array_elements_text(
    CASE
      WHEN p.test_schedules IS NULL THEN '[]'::jsonb
      WHEN pg_typeof(p.test_schedules)::text LIKE '%[]'
           THEN to_jsonb(p.test_schedules)            -- any array → jsonb array
      ELSE
        CASE
          WHEN jsonb_typeof(to_jsonb(p.test_schedules))='array'
               THEN to_jsonb(p.test_schedules)        -- json/jsonb that is an array
          ELSE '[]'::jsonb
        END
    END
  ) AS t(elem_txt)
) AS x(js_txt);

-- Insert normalized schedules
INSERT INTO public.program_interview_schedules
  (program_id, type, link, location_label, start_at, end_at, is_active, created_at, updated_at)
SELECT mp.new_id, n.type_norm, n.link, n.location_label, n.start_at, n.end_at, TRUE, now(), now()
FROM public._tmp_norm_schedules n
JOIN public._map_programs mp ON mp.old_id = n.old_program_id;

-- Build schedule map for enrollments
INSERT INTO public._tmp_schedule_map(program_old_id, old_schedule_id, new_schedule_id)
SELECT n.old_program_id, n.old_id, s.id
FROM public._tmp_norm_schedules n
JOIN public._map_programs mp ON mp.old_id = n.old_program_id
JOIN public.program_interview_schedules s
  ON s.program_id = mp.new_id
 AND s.type IS NOT DISTINCT FROM n.type_norm
 AND s.link IS NOT DISTINCT FROM n.link
 AND s.location_label IS NOT DISTINCT FROM n.location_label
 AND s.start_at IS NOT DISTINCT FROM n.start_at
 AND s.end_at   IS NOT DISTINCT FROM n.end_at;

-- optional: clean the normalized rows table now or at migration end
-- DROP TABLE IF EXISTS public._tmp_norm_schedules;


-- -- 6) Enrollments from candidate_programs.test_schedule
-- INSERT INTO public.program_interview_enrollments (candidate_id, program_id, interview_schedule_id, status, created_at, updated_at)
-- SELECT mc.new_id, mp.new_id, sm.new_schedule_id, 'invited', now(), now()
-- FROM legacy.candidate_programs l
-- JOIN public._map_candidates mc ON mc.old_id = l.id_candidate::text
-- JOIN public._map_programs   mp ON mp.old_id = l.id_program::text
-- JOIN public._tmp_schedule_map sm
--   ON sm.program_old_id = l.id_program::text
--  AND sm.old_schedule_id = NULLIF(l.test_schedule::text,'')
-- ON CONFLICT ON CONSTRAINT uniq_enrollment_candidate_schedule DO NOTHING;

-- -- 7) Screenings from candidate_programs → candidate_screenings
-- INSERT INTO public.candidate_screenings (
--   candidate_id, assigned_program_id, is_passed_test, is_matches_requirement,
--   reject_reason_matches, reject_reason_not_passed, created_at, updated_at
-- )
-- SELECT mc.new_id, mp.new_id,
--        l.is_passed_test,
--        l.id_matches_requirements,
--        NULLIF(l.reject_reason_matches,''),
--        NULLIF(l.reject_reason_not_passed,''),
--        now(), now()
-- FROM legacy.candidate_programs l
-- JOIN public._map_candidates mc ON mc.old_id = l.id_candidate::text
-- LEFT JOIN public._map_programs mp ON mp.old_id = l.id_program::text
-- WHERE l.is_passed_test IS NOT NULL
--    OR l.id_matches_requirements IS NOT NULL
--    OR COALESCE(l.reject_reason_matches,'') <> ''
--    OR COALESCE(l.reject_reason_not_passed,'') <> '';

-- 8) Documents from candidate_programs → candidates.document.program_document[]
WITH docs_src AS (
  SELECT
    l.id_candidate::text AS cand_old_id,
    CASE
      WHEN l.documents IS NULL THEN '[]'::jsonb
      WHEN pg_typeof(l.documents)::text LIKE '%[]'
           THEN to_jsonb(l.documents)
      ELSE
        CASE
          WHEN jsonb_typeof(to_jsonb(l.documents))='array' THEN to_jsonb(l.documents)
          ELSE '[]'::jsonb
        END
    END AS js_arr
  FROM legacy.candidate_programs l
),
agg AS (
  SELECT mc.new_id AS candidate_id,
         jsonb_agg(t.elem_txt::jsonb) AS program_docs
  FROM docs_src s
  JOIN public._map_candidates mc ON mc.old_id = s.cand_old_id
  CROSS JOIN LATERAL jsonb_array_elements_text(s.js_arr) AS t(elem_txt)
  GROUP BY mc.new_id
)
UPDATE public.candidates c
SET document = jsonb_set(
  COALESCE(c.document,'{}'::jsonb),
  '{program_document}',
  COALESCE(a.program_docs,'[]'::jsonb),
  true
)
FROM agg a
WHERE a.candidate_id = c.id;

-- 9) Cleanup
DROP TABLE IF EXISTS public._tmp_schedule_map;
DROP TABLE IF EXISTS public._map_candidates;
DROP TABLE IF EXISTS public._map_programs;
DROP TABLE IF EXISTS public._map_webinars;
DROP FUNCTION IF EXISTS public._copy_legacy_table(text, text, text, jsonb, jsonb);
