## Academy Architecture

### Scope and boundaries

- Core provides: admins, candidates, RBAC (roles/permissions), shared infra (Prisma, S3, Mailer, logging).
- Academy provides: programs and webinars, plus enrollment/registration joins.

### Routes (namespaces)

- `/academy/programs/*` — create, list, details, update, delete, assign participants
- `/academy/webinars/*` — create, list, details, update, delete, code generation, broadcast, participants

### Permissions

- Program: `program.create`, `program.get`, `program.details`, `programs.update`, `program.delete`, `program.participants`, `program.assign`
- Webinar: `webinar.create`, `webinar.get`, `webinar.details`, `webinar.update`, `webinar.delete`, `webinar.code`, `webinar.participants.get`, `webinar.participants.delete`, `webinar.broadcast`
- Namespaced (preferred, gradual rollout): `academy.program.*`, `academy.webinar.*`

### Entities

- `core`: `admins`, `roles`, `permissions`, `admin_roles`, `role_permissions`, `candidates`
- `academy`: `programs`, `webinars`, `candidate_programs`, `candidate_webinars`

Relations
- `programs` 1—* `webinars`
- `candidates` *—* `programs` via `candidate_programs`
- `candidates` *—* `webinars` via `candidate_webinars`

### Business rules

- Enrollment prerequisite: a candidate must have attended (status = present/attended) at least one eligible webinar before enrolling into a program.
- Controllers must validate the prerequisite and return a 409/422 with guidance when unmet.
- Admin override is optional and, if enabled, must be audited with actor and reason.


