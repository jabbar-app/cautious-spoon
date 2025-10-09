## NestJS Onboarding — Backend Project Guide

This document will get you from zero NestJS experience to being able to discuss and work on this codebase at a senior level. It covers NestJS fundamentals, project-specific architecture, and concrete workflows you’ll use day-to-day.

---

### 1) Big Picture: What NestJS Is and How This App Uses It
- NestJS is an opinionated Node.js framework built on TypeScript and Express. It emphasizes modular architecture, dependency injection (DI), and decorators.
- This app follows a classic Nest setup:
  - `src/main.ts` bootstraps the HTTP server, sets global middleware, pipes, filters, and interceptors.
  - `src/app.module.ts` wires up feature modules (auth, admins, roles, permissions, candidates, programs, webinars, CDN) plus core modules (config, JWT, Prisma DB, logger, mailer).
  - Feature modules live under `src/modules/*` (controller + service + DTOs).
  - Cross-cutting concerns live under `src/common/*` and `src/core/*`.

Key runtime flow per request:
1) Incoming HTTP request hits global interceptors for logging and response envelope
2) Guards authenticate/authorize
3) Controller validates input (Zod via global pipe), delegates to Service
4) Service uses Prisma to talk to PostgreSQL
5) Interceptors wrap and serialize the response into a standard envelope
6) Global exception filter standardizes error responses

---

### 2) Entry Points and Global Middleware
- `src/main.ts` does the following:
  - Creates the app with `bufferLogs: true` and retrieves `LoggerService`
  - Adds `helmet()` and `cookie-parser`
  - Enables shutdown hooks and CORS (origin=true, credentials=true)
  - Registers global `ZodValidationPipe` (backed by `nestjs-zod`)
  - Registers global interceptors, in order: request/response logging, then response envelope
  - Registers `GlobalExceptionFilter`

What this means for you:
- All controller responses are shaped into a standard envelope `{ success, message, data, error, meta, pagination }`.
- All errors are standardized (never leak stack traces in production), with `meta.requestId` for traceability.
- Validation errors are surfaced through Zod output; do not write custom manual validation unless truly necessary.

---

### 3) Modules, Controllers, Services
- `AppModule` imports:
  - Core: `ConfigModule`, `CoreJwtModule`, `PrismaModule`, `LoggerModule`, `MailerModule`
  - Features: `AuthModule`, `AdminsModule`, `RolesModule`, `PermissionsModule`, `CdnModule`, `CandidatesModule`, `ProgramsModule`, `WebinarsModule`
- Patterns:
  - Controllers (`*.controller.ts`) accept/validate HTTP input and call Services
  - Services (`*.service.ts`) contain business logic and data access via Prisma
  - DTOs under module `dto/` are typically Zod-backed (see Zod section)

Read a concrete example:
- `src/modules/admins/admins.controller.ts`
- `src/modules/admins/admins.service.ts`
These show: guards + RBAC decorator, pagination, soft-deletes, and normalized outputs.

---

### 4) Validation with Zod (nestjs-zod)
- Global: `app.useGlobalPipes(new ZodValidationPipe())` in `main.ts`.
- DTOs use `createZodDto` and Zod schemas, e.g. `src/common/dto/list-query.dto.ts`:
  - Coerces numbers, supports boolean-ish query params, optional sorting syntax
- Benefits:
  - Strong, explicit schema at boundaries
  - Consistent error formatting handled by the global exception filter
- Guidance:
  - Always define DTO schemas for inputs (query, params, body)
  - Surface domain constraints through Zod (min/max, enums, transforms)

---

### 5) AuthN and AuthZ (JWT + RBAC)
- JWT:
  - Access tokens validated by guards (e.g., `src/common/guards/jwt-admin.guard.ts`)
  - Reads `Authorization: Bearer <token>` and verifies with `JWT_ACCESS_SECRET`
  - Injects `req.user = { sub, id, typ, email }`
- Token types:
  - `typ` can be `admin` or `superadmin`, enforced in `JwtAdminGuard`
- RBAC:
  - Decorator `@Permissions('perm.code')` on controller methods stores required permissions as metadata
  - `PermissionsGuard` resolves admin roles → permissions using Prisma joins across `admin_roles`, `roles`, `role_permissions`, `permissions`
  - Superadmin bypasses RBAC; admin requires exact permission hits
- Senior-level talking points:
  - Why guards? Guards run before route handlers; perfect for auth checks
  - Why metadata via decorators? Keeps authorization intent close to route definition
  - Performance considerations: Use selective Prisma queries and in-memory `Set` checks for required permission titles

---

### 6) Logging and Observability
- Interceptors:
  - `src/common/interceptors/logging.interceptor.ts` logs `[REQ]/[RES]/[ERR]` with requestId and user
  - `src/core/logger/logging.interceptor.ts` writes rich HTTP logs (method, path, params, query, redacted body, response time, status, user, requestId, optional Prisma metrics)
- Logger sink:
  - `src/core/logger/logger.service.ts` writes logs to MongoDB if `MONGODB_URI` is set, else warns and falls back to console
- Identifiers:
  - Request ID comes from `x-request-id` header or generated
- Senior-level talking points:
  - Why interceptors vs middleware? Interceptors can measure timing around handler execution and access the response status after handler runs
  - Redaction/truncation strategy to avoid leaking secrets and huge payloads
  - Indexes on log collection for queryability (timestamp, requestId, userId, path, statusCode)

---

### 7) Response Envelope and Error Handling
- Success envelope (`ResponseEnvelopeInterceptor`): wraps controller return into a standard structure; extracts pagination if the service returns a `{ items, page, perPage, total, totalPages, nextCursor }` shape
- Error envelope (`GlobalExceptionFilter`): standardizes error payloads and codes; hides stack in production; includes `meta.requestId` and `meta.version`
- Guidance:
  - Controllers should return raw domain data or a paginated shape; interceptors will wrap
  - Throw `HttpException` subclasses (e.g., `BadRequestException`, `NotFoundException`) with structured `code/details` when useful

---

### 8) Database Layer: Prisma + PostgreSQL
- `prisma/schema.prisma` defines the data model; datasource `db` points at `DATABASE_URL`
- `src/core/database/prisma.service.ts` extends `PrismaClient`, connects on module init
- Conventions in services:
  - Soft-delete aware queries: filter by `deleted_at: null`
  - Pagination: `count + findMany(skip/take)` and return paginated shape
  - Normalization for related data (e.g., stitch roles onto admin)
- Senior-level talking points:
  - Composite primary keys for join tables (e.g., `admin_roles` and `role_permissions`)
  - Handling BigInt IDs: envelope and serializers ensure JSON safety
  - Transactions for multi-step updates (`$transaction`), e.g., role attach/detach with revive semantics

---

### 9) Configuration and Security
- `ConfigModule` is global; `ConfigService` exposes JWT secrets/TTLs, cookie domain, MongoDB details, bcrypt rounds
- Security in `main.ts`:
  - `helmet()` HTTP headers
  - CORS: `origin: true, credentials: true`
  - Cookie parsing for potential cookie-based flows
- JWT secrets and TTLs via env: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`
- Senior-level habits:
  - Never hardcode secrets; use environment variables (12-factor)
  - Principle of least privilege in permissions; define fine-grained `permissions.title`
  - Audit fields (`created_by`, `updated_by`, `deleted_by`) are consistently set in services

---

### 10) API Design Conventions in This Repo
- Routing: plural resource names (e.g., `admins`)
- Guards: `@UseGuards(JwtAdminGuard, PermissionsGuard)` at controller or route level
- Permissions: `@Permissions('domain.action')`, e.g., `admin.get`, `admin.create`
- List endpoints accept query params: `page`, `perPage`, `search`, `sort`, `all`, `select=options`
- Sorting format: `field,-otherField` parsed by `common/utils/sort.ts`
- Soft delete vs hard delete: prefer soft delete (set `deleted_at`) and detach relationships; revoke tokens when applicable

---

### 11) Running Locally
- Requirements: Node 18+, PostgreSQL, optionally MongoDB for structured logs
- Install deps:
  - `npm install`
- Database setup:
  - Point `DATABASE_URL` to your Postgres instance
  - Initial migration (if starting fresh): generate or apply existing migrations
    - Using `README.md` guidance (Windows PowerShell style):
      - `npx prisma migrate diff --from-empty --to-url "$env:DATABASE_URL" --script --output prisma\migrations\000_init\migration.sql`
      - `npx prisma migrate resolve --applied 000_init`
      - `npx prisma migrate status`
      - `npx prisma migrate deploy`
      - `npx prisma generate`
  - Seed RBAC data:
    - `npm run seed:rbac` (runs `ts-node prisma/seed.ts`)
- Start server:
  - Dev: `npm run start:dev`
  - Prod: `npm run start:prod`
- Tests:
  - Unit: `npm run test`
  - E2E: `npm run test:e2e`

Environment variables (common):
- `DATABASE_URL` (PostgreSQL)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`
- `MONGODB_URI`, `MONGODB_DB` (optional, for HTTP log sink)
- `COOKIE_DOMAIN`, `BCRYPT_SALT_ROUNDS`
- `API_VERSION`, `LOG_API_PREFIXES`, `LOG_BODY_MAX` (optional logging/envelope tuning)

---

### 12) Code Walkthrough: Admins Module Highlights
- Controller: `GET /admins`, `GET /admins/:id`, `PATCH /admins/:id/roles`, `POST /admins`, `DELETE /admins/:id_admin`, `PUT /admins/:id_admin`
- Guards and permissions on every route
- Service:
  - `list`: search, sort, options mode, pagination; returns paginated shape for envelope to pick up
  - `findById`: projects safe fields, stitches in roles
  - `setRoles`: attach/detach via transaction, revive soft-deleted links, return current roles
  - `create`: bcrypt hashing with configurable cost; optional role assignment
  - `update`: email conflict detection; selective field updates; optional password rehash
  - `softDeleteAdmin`: set `deleted_at`, detach roles, revoke refresh tokens when table present

Interview-ready talking points:
- Why normalize role data shape for clients (DX, stability, envelope serialization)
- Tradeoffs of composite PKs vs surrogate IDs in join tables
- Soft-delete propagation patterns and token revocation strategy

---

### 13) Common Pitfalls and Best Practices
- Always return plain objects or the paginated shape; let the envelope handle wrapping
- Keep DTO schemas the single source of truth for inputs
- Use guards for auth, not in controllers/services
- Prefer `$transaction` for multi-step writes
- Redact secrets in logs; never log raw credentials
- BigInt handling: let the envelope/serializer handle safe JSON conversion
- Keep `deleted_at` checks in all “active list” queries

---

### 14) Extending the System: How to Add a New Feature
1) Create a new module: controller + service + DTOs under `src/modules/<feature>`
2) Wire it into `AppModule`
3) Define DTOs via Zod, add guards/permissions where needed
4) Implement service with Prisma queries, soft-delete aware
5) Return either a resource or the paginated shape; avoid leaking internal fields
6) Add permissions into RBAC seed and wire roles as needed
7) Optional: add logging and metrics specific to new workflows

---

### 15) Glossary (Quick Recall)
- Guard: Pre-handler check (auth/authorization)
- Interceptor: Around-handler logic (logging, response shaping)
- Filter: Exception-to-response mapping
- Pipe: Input validation/transformation
- DTO: Data Transfer Object (schema-bound input type)
- Module: Logical unit grouping controllers/services/providers

---

### 16) Senior Interview Prep — Suggested Deep Dives
- Explain Nest DI and provider scopes; why most services are singleton here
- Compare middleware vs guard vs interceptor vs filter responsibilities
- Discuss CQRS vs CRUD services; when you’d adopt CQRS in Nest
- Prisma query performance: N+1 avoidance, selective selects, composite indexes
- End-to-end error strategy: domain codes, i18n readiness, envelope contract
- Security: JWT rotation, refresh token revocation, soft-delete implications
- Observability: structured logs, correlation IDs, and tracing plans

---

If anything here drifts from the code, prefer the code. Start by reading `src/main.ts`, `src/app.module.ts`, and a representative module (e.g., `admins`). Then iterate with tests and real requests to cement understanding.
