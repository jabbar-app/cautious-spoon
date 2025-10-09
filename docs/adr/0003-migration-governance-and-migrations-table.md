## ADR 0003: Migration Governance and Prisma Migrations Table Location

Date: 2025-10-08

### Status

Accepted

### Context

We maintain a single database with multiple schemas (`core`, `academy`, `talent`, `vacancy`). Prisma tracks migrations with a migrations table. We need to decide where that table lives and define governance to avoid conflicts and drift.

### Decision

- Keep Prisma’s migrations table in the `public` schema (default), with one global linear migration history.
- Require migrations to be linearized on `main` (no parallel divergent histories).
- Allow migrations to touch multiple schemas; include schema creation early in the history.

### Consequences

- Pros
  - Single source of truth for migration state
  - Simpler deploys and rollbacks across all app schemas
  - Easier auditability of schema evolution

- Cons
  - All apps share one migration stream; coordination required

### Governance Rules

1. Branching: Rebase schema branches to avoid concurrent edits on the same models.
2. CI Checks: Run `prisma migrate diff` against `main`; fail PRs on conflicts/drift.
3. Naming: Prefix migration names with schema/app context when helpful.
4. Separation: Split structural DDL from heavy backfills; make backfills idempotent.
5. Privileges: Ensure migration runner has rights on all schemas.
6. Rollbacks: Prefer forward-fix; maintain backup/restore runbooks.

### Alternatives Considered

- Per-schema migration tables
  - Pros: isolation per app
  - Cons: complex coordination and cross-schema ref integrity; rejected


