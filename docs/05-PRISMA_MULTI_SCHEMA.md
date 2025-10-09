## Prisma: Single DB, Multiple Schemas

Key guidance on modeling, migrating, and seeding multiple schemas in one database.

### Modeling

- Use `@@schema("...")` at model level.
- Place shared entities in `core`; app entities in their schemas.

### Migrations and seeding

- One migration history can alter multiple schemas.
- Seed `core` RBAC first; then app seeds.

### Cross-schema relations

- Allowed; prefer referencing `core` identities from app schemas.

### Migration governance and conflict handling

- Migration table location
  - Use the default Prisma migrations table in the `public` schema (recommended) to track a single, global migration history.
  - Rationale: one source of truth across all schemas; simpler CI/CD and rollbacks.
  - Alternative: per-schema migration tables — NOT recommended here due to coordination overhead and cross-schema dependencies.

- Namespacing and file conventions
  - Prefix migration names with app/schema when helpful, e.g., `20251008_academy_add_webinar_capacity`.
  - Keep cross-schema changes in one migration to maintain referential integrity.

- Branching strategy
  - Avoid parallel migrations that alter the same models in different branches; rebase to linearize schema changes.
  - Require schema migration PRs to run `prisma migrate diff` against `main` in CI and fail on conflicts.

- Backfills and data transforms
  - Separate structural migrations from heavy backfills; run backfills via scripts or `prisma.$executeRaw` post-deploy.
  - Make backfills idempotent and resumable; guard with feature flags when user-visible.

- Rollback plan
  - Prefer forward-fixes; avoid destructive down migrations in production.
  - If a rollback is unavoidable, maintain backup/restore runbooks and test them periodically.

### Where to keep the migrations table

- Decision: keep Prisma’s migrations table in `public` (default). This centralizes migration state while allowing DDL in `core`, `academy`, `talent`, and `vacancy` schemas.

### Developer workflow

- Local
  - Update `prisma/schema.prisma` with `@@schema("...")` per model.
  - Run `prisma migrate dev --name <change>` to create a migration touching any schemas.
  - Run `prisma generate` and smoke test.

- CI/CD
  - Run `prisma migrate deploy` in an environment with the same database and permissions for all schemas.
  - Validate drift with `prisma migrate status`.
  - Lock deploys when schema PRs conflict; require rebase.

### Permissions and DDL rights

- Ensure the migration runner has privileges to create/alter objects in all app schemas.
- Schema creation should happen in an early migration (e.g., `CREATE SCHEMA academy;`).

### Seeding order and isolation

- Seed `core` (RBAC) first; then seed app schemas.
- Make seeds idempotent with `upsert` or defensive checks; safe to run multiple times.



