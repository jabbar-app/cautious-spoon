## ADR 0001: Single Database with Multiple Schemas

Date: 2025-10-08

### Status

Accepted

### Context

We will build multiple applications (Academy, Talent, Vacancy) that share common platform capabilities (Core). We want operational simplicity, consistent data governance, and the ability to share entities such as users/candidates across apps while preserving clear ownership boundaries.

### Decision

Use one PostgreSQL database with multiple schemas: `core`, `academy`, `talent`, `vacancy`. Place shared entities in `core`; place app-specific entities in their respective schemas. Manage the entire model via a single Prisma project. Allow cross-schema relations where needed.

### Consequences

- Pros
  - Simplified operations (one DB endpoint, one connection pool)
  - Easy cross-app joins and transactions
  - Clear logical boundaries through schemas while avoiding microservice overhead
  - Unified migrations and seed tooling

- Cons
  - Blast radius of DB outages spans all apps
  - Governance: need conventions to prevent accidental cross-app coupling
  - Migration discipline required to avoid unsafe changes across schemas

### Implementation Notes

- Prisma models use `@@schema("schema_name")` to place tables
- Shared Prisma enums/types live in `core`
- RBAC permission keys should be namespaced (e.g., `academy.programs.read`)
- Seed scripts initialize base RBAC and per-app permissions

### Alternatives Considered

- Separate databases per app
  - Pros: stronger isolation, independent lifecycle
  - Cons: complex cross-app data access, more infra cost and ops overhead

- Single database, single schema
  - Pros: simplest physically
  - Cons: no structural boundary; higher risk of unwanted coupling


