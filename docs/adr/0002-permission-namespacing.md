## ADR 0002: Permission Namespacing Strategy

Date: 2025-10-08

### Status

Proposed

### Context

Current permission keys are flat (e.g., `program.create`, `webinar.get`). As multiple apps (Academy, Talent, Vacancy) are introduced, we need unambiguous permissions and grouping for admin UX and reporting.

### Decision

Adopt namespaced permission keys: `<app>.<resource>.<action>`, e.g., `academy.program.create`, `academy.webinar.get`. Keep backward compatibility by continuing to seed legacy keys for now and gradually migrate controllers to the new keys (support both during transition).

### Consequences

- Pros
  - Clear separation per app
  - Easier role templates per app
  - Future-proofing for cross-app collisions

- Cons
  - Temporary duplication during migration
  - Requires updates in controllers/guards and seed scripts

### Implementation Notes

- Extend `prisma/seed/permissions.ts` to include both legacy and namespaced Academy permissions.
- When updating controllers, accept either key in the guard until all roles are migrated.
- Later, remove legacy keys once migration is complete.


