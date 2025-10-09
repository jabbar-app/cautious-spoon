## Engineering Governance — Multi‑App Platform

### Purpose

Prevent technical debt and conflicts while multiple apps share one codebase and database.

### Source control and branching

- Use short‑lived feature branches; rebase frequently to avoid migration conflicts.
- One PR per logical change set (feature, migration); avoid omnibus PRs.

### Schema and migrations

- Prisma migrations table in `public`; one global linear history.
- Prefix migration names with app/schema when helpful.
- Separate structural DDL from heavy backfills; make backfills idempotent and resumable.
- Run `prisma migrate diff` in CI against `main` to detect drift/conflicts.

### Permissions and RBAC

- Namespaced keys (`academy.*`) for app features; maintain a mapping during transition from legacy keys.
- Document required permissions per endpoint in Swagger; include negative tests.

### API governance

- Namespace routes per app (`/academy/*`) and group Swagger tags accordingly.
- Enforce DTO validation on all inputs; ensure response DTOs match selections.

### Observability

- Standardized logging with correlation IDs; redact PII.
- Consistent error envelopes; global filters for unhandled errors.

### Security

- Enforce password policy and MFA for admin accounts; rate limit auth endpoints.
- Session management with idle/absolute timeouts; device/session listing; revoke flows.

### Documentation

- Keep numbered docs up to date; update ADRs for architectural decisions.
- Record operational runbooks for backup/restore, incident response.

### Testing

- CI: unit + e2e with seeded DB; block merges on failures.
- Include permission boundary tests and soft‑delete/restore scenarios.


