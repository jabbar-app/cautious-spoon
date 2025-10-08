## Academy Architecture

This document focuses on the Academy app, its boundaries with Core, routes, permissions, and entities.

### Scope and boundaries

- Core provides: admins, candidates, RBAC (roles/permissions), shared infra (Prisma, S3, Mailer, logging).
- Academy provides: programs and webinars, plus enrollment/registration joins.

### Routes (suggested namespaces)

- `/academy/programs/*`
  - Create, list, details, update, delete, assign participants
- `/academy/webinars/*`
  - Create, list, details, update, delete, code generation, broadcast, participants

These can be realized by adding a global route prefix `academy` or by scoping controllers under an `AcademyModule` that registers prefixed routers.

### Permissions (enforced by Guards)

- Program: `program.create`, `program.get`, `program.details`, `programs.update`, `program.delete`, `program.participants`, `program.assign`
- Webinar: `webinar.create`, `webinar.get`, `webinar.details`, `webinar.update`, `webinar.delete`, `webinar.code`, `webinar.participants.get`, `webinar.participants.delete`, `webinar.broadcast`

Recommendation: adopt namespaced keys later like `academy.program.create` while keeping compatibility with current keys.

### Core + Academy entities (from Prisma)

- `core`: `admins`, `roles`, `permissions`, `admin_roles`, `role_permissions`, `candidates`
- `academy`: `programs`, `webinars`, `candidate_programs`, `candidate_webinars`

Relations
- `programs` 1—* `webinars`
- `candidates` *—* `programs` via `candidate_programs`
- `candidates` *—* `webinars` via `candidate_webinars`

### Operational considerations

- Soft delete columns (`deleted_at`, `deleted_by`) present on programs/webinars; ensure queries filter if needed.
- Indexes: `idx_programs_deleted_at`, `idx_webinars_deleted_at` already in place.
- Seeding: add Academy permissions to seed list; system_admin should get all permissions by default.

### Next steps

- Optionally prefix API routes under `/academy`.
- Transition permission keys to an `academy.*` namespace with backward compatibility mapping.
- Add request/response DTO validation coverage for new endpoints as they are added.
