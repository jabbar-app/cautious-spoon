## Architecture and ERD

This document provides a high-level architecture view of the backend and a draft ERD inferred from the current module layout and migration names. Once the database schema is finalized, we can refine the ERD directly from `prisma/schema.prisma`.

### High-level architecture

```mermaid
flowchart LR
  subgraph Clients
    A[Admin UI]
    B[Candidate UI]
    C[Public (CDN consumers)]
  end

  A --> G
  B --> G
  C --> G

  subgraph API[NestJS Application]
    direction LR
    G[HTTP Layer]
    I[Global Interceptors]
    U[Auth Guards (JWT, Role/Permission)]
    CTRL[Controllers]
    SVC[Services]
  end

  G --> I --> U --> CTRL --> SVC

  subgraph Core[Core Modules]
    direction TB
    CFG[ConfigModule]
    LOG[LoggerModule]
    SEC[SecurityModule]
    JWT[JwtModule]
    PRISMA[Database (PrismaService)]
    MAIL[MailerModule]
    S3[S3 Storage Module]
  end

  subgraph Features[Feature Modules]
    direction TB
    M_AUTH[AuthModule]
    M_ADM[AdminsModule]
    M_CAND[CandidatesModule]
    M_CDN[CDNModule]
    M_PERM[PermissionsModule]
    M_PROG[ProgramsModule]
    M_RBAC[RBAC Helpers]
    M_ROLES[RolesModule]
    M_WEB[WebinarsModule]
  end

  CTRL -.uses .-> Features
  SVC  -.uses .-> Core

  SVC --> PRISMA
  SVC --> S3
  SVC --> MAIL

  classDef core fill:#eef7ff,stroke:#6ea8fe,stroke-width:1px,color:#0a2540;
  classDef feat fill:#f6fff0,stroke:#63a46c,stroke-width:1px,color:#0a2c0a;
  class PRISMA,MAIL,S3,JWT,SEC,LOG,CFG core;
  class M_AUTH,M_ADM,M_CAND,M_CDN,M_PERM,M_PROG,M_RBAC,M_ROLES,M_WEB feat;
```

Notes
- Controllers apply global interceptors and auth guards (JWT and permission-based) before delegating to services.
- Services collaborate with Core modules: `PrismaService` for DB, `S3Module` for object storage, `MailerModule` for email.
- Feature modules encapsulate business domains: admins, auth, candidates, CDN, permissions/RBAC, programs, roles, webinars.

### Core + Academy ERD (from prisma/schema.prisma)

```mermaid
erDiagram
  %% RBAC (Core)
  ADMINS ||--o{ ADMIN_ROLES : has
  ROLES  ||--o{ ADMIN_ROLES : includes
  ROLES  ||--o{ ROLE_PERMISSIONS : grants
  PERMISSIONS ||--o{ ROLE_PERMISSIONS : includes

  %% Academy
  PROGRAMS ||--o{ WEBINARS : schedules
  CANDIDATES ||--o{ CANDIDATE_PROGRAMS : enrolls
  PROGRAMS   ||--o{ CANDIDATE_PROGRAMS : includes
  CANDIDATES ||--o{ CANDIDATE_WEBINARS : registers
  WEBINARS   ||--o{ CANDIDATE_WEBINARS : includes

  ADMINS {
    uuid     id PK
    string   email
    string   password
    boolean  email_verified
    timestamptz created_at
    timestamptz? updated_at
  }

  ROLES {
    bigint   id PK
    string   title UNIQUE
    string   description
    timestamptz? created_at
    timestamptz? updated_at
  }

  PERMISSIONS {
    bigint   id PK
    string   title UNIQUE
    string   description
  }

  ADMIN_ROLES {
    uuid     id_admin FK
    bigint   id_role  FK
    timestamptz? created_at
    PK id_admin+id_role
  }

  ROLE_PERMISSIONS {
    bigint   id_role FK
    bigint   id_permission FK
    PK id_role+id_permission
  }

  CANDIDATES {
    string   id PK
    string   email
    string   name
    timestamptz? created_at
    timestamptz? updated_at
  }

  PROGRAMS {
    string   id PK
    string   title
    timestamptz? registration_date
    timestamptz? program_start_date
    string   training_centre
    bigint?  capacity
    string   description
    string   photo
    bigint?  price
    bigint?  duration
    string   category
    string   status
    boolean? is_visible
    boolean? is_active
    string[] formulir
    json[]   test_schedules
    timestamptz? created_at
    timestamptz? updated_at
    timestamptz? deleted_at
  }

  WEBINARS {
    string   id PK
    string?  id_program FK
    string   title
    timestamptz? registration_date
    timestamptz? webinar_date
    bigint?  capacity
    string   description
    string   photo
    string   link
    bigint?  price
    bigint?  duration
    string[] speakers
    string   category
    string   status
    boolean? is_visible
    boolean? is_active
    string   absen_code
    timestamptz? absen_valid_date
    timestamptz? created_at
    timestamptz? updated_at
    timestamptz? deleted_at
  }

  CANDIDATE_PROGRAMS {
    bigint   id PK
    string   id_candidate FK
    string   id_program   FK
    string   status
    boolean? is_mcu
    boolean? is_agree
    json[]   documents
    json?    payment
    boolean? is_passed_test
    boolean? is_matches_requirement
    string?  test_schedule
    timestamptz? created_at
    timestamptz? updated_at
    UNIQUE id_candidate+id_program
  }

  CANDIDATE_WEBINARS {
    bigint   id PK
    string   id_candidate FK
    string   id_webinar   FK
    string   status
    timestamptz? created_at
    timestamptz? updated_at
    timestamptz? deleted_at
    UNIQUE id_candidate+id_webinar
  }
```

### Keeping the ERD in sync

When schema changes, regenerate the ERD from `prisma/schema.prisma` and update the diagram above. One option is to adopt an automated generator during local development (e.g., a Prisma ERD generator) and paste the Mermaid output here so GitHub can render it.

### Next steps to refine

- Replace the draft ERD with the exact entities and relations from `prisma/schema.prisma`.
- If admins have a single role instead of many-to-many, replace `ADMIN_ROLE` with a direct `roleId` on `ADMIN`.
- Add any missing entities (e.g., audit logs) if present in the schema.


