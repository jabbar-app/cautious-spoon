## Prisma: Single DB, Multiple Schemas

This guide describes how to model, migrate, and seed a single PostgreSQL database with multiple schemas for Core, Academy, Talent, and Vacancy.

### Modeling

- Use Prisma's `@@schema("...")` attribute at the model level to place tables in specific DB schemas.
- Share commonly referenced entities (e.g., `Admin`, `Candidate`, `Role`, `Permission`) in `core`.
- Namespace enums and permission keys to avoid collisions.

Example (illustrative only):

```prisma
// schema.prisma
// generator and datasource blocks omitted for brevity

model Admin {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@schema("core")
}

model Program {
  id        String   @id @default(cuid())
  title     String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@schema("academy")
}
```

### Migrations

- A single migration history can safely alter multiple schemas in one step.
- When adding a new app, introduce its schema and initial tables in one migration.
- Avoid renames across schemas in the same migration; split into clear steps.

Commands

```bash
# Create migration from changes in prisma/schema.prisma
npm run prisma:migrate

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

Recommended npm scripts in `package.json`:

```json
{
  "scripts": {
    "prisma:migrate": "prisma migrate dev --name update",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:gen": "prisma generate",
    "seed:rbac": "ts-node prisma/seed/permissions.ts"
  }
}
```

### Seeding

- Seed `core` RBAC first (roles and permissions with app namespaces: `academy.*`, `talent.*`, `vacancy.*`).
- Then seed app-specific baseline data (e.g., Academy demo programs).
- Use idempotent upserts; ensure seeds can run multiple times safely.

### Relations across schemas

- Prisma supports relations across models in different schemas as long as foreign keys are valid.
- Prefer referencing `core` entities from app schemas (e.g., `academy.Enrollment.candidateId -> core.Candidate.id`).
- Be explicit with relation fields and indices for performance.

### Testing and CI

- Initialize all schemas before running migrations in CI (Postgres creates schemas on first use by Prisma).
- Run e2e tests against a single DB instance with all schemas.

### Troubleshooting

- Introspection warnings may appear when non-Prisma-managed objects exist; keep schema ownership consistent.
- If `@@schema` is not applied, models go to the default schema (usually `public`). Enforce `@@schema` for all models to avoid drift.


