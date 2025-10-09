## Project Knowledge

### Overview
This repository is a NestJS backend using Prisma (PostgreSQL) with modular features for admins, candidates, programs, webinars, roles, and permissions. Cross‑cutting layers include configuration, logging, security, JWT, and a standardized response envelope.

### Runtime and Core Setup
- App bootstrap: `src/main.ts` configures Helmet, cookie parser, Zod pipes, global interceptors, and a global exception filter. Responses are wrapped by `ResponseEnvelopeInterceptor` and errors by `GlobalExceptionFilter`.
- Root module: `src/app.module.ts` imports `ConfigModule`, `CoreJwtModule`, `PrismaModule`, `LoggerModule`, `MailerModule`, and feature modules like `AuthModule`, `AdminsModule`, `CandidatesModule`, `ProgramsModule`, `WebinarsModule`, `RolesModule`, `PermissionsModule`, and `CdnModule`.
- Configuration: `src/core/config/config.module.ts` sets Nest Config as global with caching and env variable expansion.
- Logging: `src/core/logger` provides `LoggerService` and an HTTP `LoggingInterceptor` that logs request metadata, redacts secrets, and includes request context.

### Database Layer
- ORM: Prisma Client via `PrismaService` (`src/core/database/prisma.service.ts`) is marked `@Global` by `PrismaModule` and used across services.
- Data source: PostgreSQL configured in `prisma/schema.prisma` with many domain models, including RBAC tables: `roles`, `permissions`, `role_permissions`, `admin_roles`, and operational tables like `admin_refresh_tokens`, `token_blacklists`.
- Soft delete: Many tables implement a `deleted_at` nullable timestamp; services filter out deleted rows by default.

### Security, Auth, and RBAC
- JWT: `@nestjs/jwt` configured via `src/core/security/security.module.ts` and custom `CoreJwtModule`. Access tokens use `JWT_ACCESS_SECRET` and TTL; refresh tokens vary by user type.
- Guards:
  - `JwtAdminGuard`: validates access token and enforces `typ` ∈ {admin, superadmin}, attaching `{id, sub, typ, email}` to `req.user`.
  - `JwtCandidateGuard` and `JwtAnyGuard` exist for candidate or any-token contexts.
  - `PermissionsGuard`: enforces method/class `@Permissions(...)` metadata by checking admin roles and their permissions via Prisma, with superadmin bypass.
- Permissions decorators: primary decorator at `src/common/decorators/permissions.decorator.ts` defines metadata key `reqPerms`.
- Auth flows (`src/modules/auth`):
  - Admin: email/password → access token + rotating DB‑backed refresh tokens in `admin_refresh_tokens` (cookie `refresh_token`). Rotation on refresh; revoke on reset and logout.
  - Superadmin/employer/candidate: email/password → access token + JWT‑based refresh cookie per type, with a blacklist table (`token_blacklists`) used for rotation.
  - Email verification: employer and candidate registration sends signed verify links; verification endpoints update `email_verified` flags.
  - Password reset: signed reset tokens and dedicated reset handlers per user type; admin reset revokes active admin refresh tokens.

### Response & Error Conventions
- Successful responses: wrapped by `ResponseEnvelopeInterceptor` with fields `{ success, message, data, error, meta, pagination, links }`. If a handler returns a paginated shape `{ items, page, perPage, total, totalPages, nextCursor }`, the interceptor lifts pagination to `envelope.pagination` and puts `items` under `data`.
- Errors: `GlobalExceptionFilter` catches all errors and wraps them into the envelope with `error.code`, `error.details`, optional `error.fields`, and ecology data under `meta`.

### Feature Modules

#### Admins
- Controller: `src/modules/admins/admins.controller.ts` guarded by `JwtAdminGuard` and `PermissionsGuard`.
- Key routes:
  - GET `/admins` (`admin.get`): list with search/sort; returns paginated data.
  - GET `/admins/:id` (`admin.details`): single admin including role titles.
  - POST `/admins` (`admin.create`): create an admin; can seed roles.
  - PATCH `/admins/:id/roles` (`admin.roles.assign`): attach/detach roles with soft‑deleted revival.
  - PUT `/admins/:id_admin` (`admin.update`): update fields, optional password change.
  - DELETE `/admins/:id_admin` (`admin.delete`): soft delete and detach roles; attempts to revoke refresh tokens.
- Service highlights: robust role attach/detach transaction logic; soft‑delete awareness across queries.

#### Candidates
- Controller: `src/modules/candidates/candidates.controller.ts` guarded by `JwtAdminGuard` and `PermissionsGuard`.
- Key routes:
  - POST `/candidates` (`candidate.create`): create candidate with generated `talent_id`.
  - GET `/candidates` (`candidate.get`): list with extensive domain filters (gender, age, education, domicile, experience, skills).
  - GET `/candidates/:id` (`candidate.details`): extended details with enriched relations.
  - PUT `/candidates/:id` (`candidate.update`), DELETE `/candidates/:id` (`candidate.delete`).
  - Ownership: POST/PATCH `/candidates/:id/admins` to attach/detach owner admins.
  - Nested resources: skills and work experiences CRUD; webinar and vacancy attach/detach.
- Service highlights: rich post‑query filtering, ID normalization for BigInt, ownership link management with revive/soft‑delete patterns.

#### Programs
- Controller: `src/modules/programs/programs.controller.ts` guarded by `JwtAdminGuard` and `PermissionsGuard`.
- Key routes:
  - POST `/programs` (`program.create`), GET `/programs` (`program.get`), GET `/programs/:id_program` (`program.details`).
  - PUT `/programs/:id_program` (`programs.update`), DELETE `/programs/:id_program` (`program.delete`).
  - Participants: GET `/programs/:id_program/participants` (`program.participants`), POST to assign (`program.assign`).
- Service: list with soft‑delete filter, pagination, and participants listing; details enforce not‑deleted.

#### Webinars
- Controller: `src/modules/webinars/webinars.controller.ts` guarded by `JwtAdminGuard` and `PermissionsGuard`.
- Key routes:
  - Standalone CRUD: POST `/webinars` (`webinar.create`), GET `/webinars` with optional `programId` (`webinar.get`), GET/PUT/DELETE `/webinars/:id_webinar`.
  - Code: POST `/webinars/:id_webinar/code` (`webinar.code`) creates a 6‑digit code with TTL.
  - Participants: GET `/webinars/:id_webinar/participants` with search/status filters; DELETE participant rows.
  - Broadcast: GET `/webinars/:id_webinar/broadcast` (`webinar.broadcast`).
- Service: soft‑delete aware queries; enriches participant data by joining candidate info; utility to assign webinar into a program.

#### Roles and Permissions
- `roles` module: list/create/update, soft delete, and `attachPermissions` to link permissions via `role_permissions` with create/revive/detach semantics.
- `permissions` module: list/get/update, soft delete. Permissions are referenced by title strings in controllers via `@Permissions(...)` and validated in `PermissionsGuard`.

### Auth Module
- Controller `src/modules/auth/auth.controller.ts` exposes:
  - Superadmin: `POST /auth/superadmin/login`, `POST /auth/superadmin/refresh`, `POST /auth/superadmin/logout`.
  - Admin: `POST /auth/admin/login`, `POST /auth/admin/refresh`, `POST /auth/admin/logout`, `POST /auth/admin/forgot`, `POST /auth/admin/reset`.
  - Employer: register/login/refresh/logout/verify/resend/forgot/reset analogous endpoints.
  - Candidate: register/login/refresh/logout/verify/resend/forgot/reset analogous endpoints.
- Service `src/modules/auth/auth.service.ts` implements rotating refresh for admins (DB) and JWT refresh with blacklist for other types, email verification, password resets, and minimal profiles.

### Cross-cutting Utilities
- `common/utils`: helpers for URL building, crypto, sorting, serialization/redaction.
- Interceptors and filters provide standardized logging and response shapes; large integers are expected to be stringified at the edge.

### Environment Variables (expected)
- JWT: `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_TTL`, `JWT_EMAIL_VERIFY_SECRET`, `JWT_RESET_SECRET`.
- Database: `DATABASE_URL`.
- Security and logging: `NODE_ENV`, `LOG_BODY_MAX`, `API_VERSION`.
- Bcrypt: `BCRYPT_ROUNDS`.

### Business Logic Highlights
- RBAC: Admin routes protected by JWT and permission checks; superadmin bypasses RBAC.
- Soft delete: Consistent `deleted_at` checks and revive semantics on link tables to prevent duplication while enabling restore.
- Candidate search: rich domain filters (gender, JLPT/NAT/JFT/nurse certs, domicile, age, education, experiences).
- Token lifecycle: admin refresh tokens rotate and are stored server‑side; JWT refresh for employer/candidate/superadmin is rotated and blacklisted.

### API Surface (selected)
This section lists the most important public endpoints with their permissions. See the controllers for full details.
- Admins: `/admins` (list/create/details/update/delete/roles)
- Candidates: `/candidates` (list/create/details/update/delete/owners/skills/work-exps/webinars/vacancies)
- Programs: `/programs` (CRUD, participants, assign)
- Webinars: `/webinars` (CRUD, code, participants, broadcast)
- Roles: `/roles` (list/details/create/update/delete, patch permissions)
- Permissions: `/permissions` (list/details/update)
- Auth: `/auth/*` for admin, superadmin, employer, candidate flows



