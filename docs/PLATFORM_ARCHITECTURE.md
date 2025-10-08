## Platform Architecture (Core + Academy + Talent + Vacancy)

This document describes a high-level architecture for a multi-app platform sharing a single database with multiple database schemas. Phase 1 focuses on Core and Academy; Talent and Vacancy will be added later.

### Goals

- Single repository with a shared Core serving multiple domain apps
- Single database for operational simplicity, with isolation via separate DB schemas: `core`, `academy`, `talent`, `vacancy`
- Clear ownership and boundaries; cross-app reuse through the Core
- Consistent auth, logging, and operational concerns across all apps

### Recommended architecture

- Monorepo with a single NestJS runtime (modular), organized by feature modules
- One Prisma schema with per-model `@@schema("...")` to place tables in specific DB schemas
- Single migration history that can touch multiple schemas in one change
- Optional route scoping by app namespace: `/academy/*`, `/talent/*`, `/vacancy/*`
- Strong RBAC in Core, app-specific permissions for each app

Rationale
- Keeps complexity lower than microservices while supporting clean boundaries
- Supports cross-schema relations (e.g., `academy` referencing `core` user/candidate)
- Enables later extraction into separate services if needed

### High-level component diagram

```mermaid
flowchart LR
  subgraph Clients
    AdminUI
    AcademyUI
    TalentUI
    VacancyUI
  end

  AdminUI --> API
  AcademyUI --> API
  TalentUI --> API
  VacancyUI --> API

  subgraph API[NestJS Application]
    direction LR
    G[HTTP Layer]
    INT[Global Interceptors]
    GUARDS[Authn/Authz Guards]
    CTRL[Controllers]
    SVC[Services]

    subgraph Core[Core Modules]
      CFG[Config]
      LOG[Logger]
      SEC[Security]
      JWT[JWT]
      RBAC[RBAC: Roles & Permissions]
      PRISMA[PrismaService]
      MAIL[Mailer]
      S3[S3 Storage]
    end

    subgraph Apps[Application Feature Modules]
      ACADEMY[Academy]
      TALENT[Talent]
      VACANCY[Vacancy]
    end
  end

  API --> DB[(PostgreSQL)]
  SVC --> PRISMA
  SVC --> S3
  SVC --> MAIL

  CTRL --> SVC
  G --> INT --> GUARDS --> CTRL

  classDef core fill:#eef7ff,stroke:#6ea8fe,color:#0a2540;
  classDef app fill:#f6fff0,stroke:#63a46c,color:#0a2c0a;
  class PRISMA,MAIL,S3,RBAC,JWT,SEC,LOG,CFG core;
  class ACADEMY,TALENT,VACANCY app;
```

### Database layout

- Single Postgres database with schemas: `core`, `academy`, `talent`, `vacancy`
- Shared entities go in `core` (e.g., users/admins/candidates, roles, permissions, audit)
- App-specific entities live in their app schema (e.g., `academy.Program`)
- Cross-schema foreign keys permitted; Prisma supports this via cross-model relations

```mermaid
erDiagram
  %% Core schema
  ADMIN ||--o{ ADMIN_ROLE : has
  ROLE  ||--o{ ADMIN_ROLE : includes
  ROLE  ||--o{ ROLE_PERMISSION : grants
  PERMISSION ||--o{ ROLE_PERMISSION : part_of

  CANDIDATE ||--o{ ACADEMY_ENROLLMENT : enrolls
  PROGRAM   ||--o{ ACADEMY_ENROLLMENT : includes

  %% Ownership notes
  %% ADMIN/ROLE/PERMISSION/CANDIDATE belong to schema=core
  %% PROGRAM/ACADEMY_ENROLLMENT belong to schema=academy

  ADMIN {
    string   id PK
    string   email
    string   name
    datetime createdAt
    datetime updatedAt
  }

  ROLE {
    string   id PK
    string   name
    string   description
  }

  PERMISSION {
    string   id PK
    string   key
    string   description
  }

  ADMIN_ROLE {
    string   adminId FK
    string   roleId  FK
  }

  ROLE_PERMISSION {
    string   roleId       FK
    string   permissionId FK
  }

  CANDIDATE {
    string   id PK
    string   email
    string   name
    datetime createdAt
  }

  PROGRAM {
    string   id PK
    string   title
    string   slug
    datetime createdAt
    datetime updatedAt
    datetime deletedAt
  }

  ACADEMY_ENROLLMENT {
    string   candidateId FK
    string   programId   FK
    datetime enrolledAt
  }
```

### Module boundaries and ownership

- Core owns: authentication, authorization (RBAC), user/admin/candidate, logging, mail, file storage, security, shared utilities
- Academy owns: curriculum entities (programs, webinars/lessons), enrollments, completion tracking
- Talent, Vacancy to define their own entities later; re-use `core` entities (e.g., candidate)

### API namespace strategy

- Route prefixes per app:
  - `/core/*` for administrative core endpoints (optional; admins could also be top-level)
  - `/academy/*` for learning endpoints
  - `/talent/*` and `/vacancy/*` later

### Authorization strategy

- Permissions defined in `core` (e.g., `academy.programs.read`), assigned to roles
- Guards enforce app/module-level permissions; feature modules declare required permissions

### Observability and cross-cutting

- Structured logging with request context IDs
- Global error filters and response envelope
- Metrics/tracing can be added via interceptors/middleware

### Evolution path

- Start single runtime (modular monolith)
- If needed, split apps into independent services behind an API gateway; keep DB shared or migrate to separate DBs per service


