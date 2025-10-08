## Platform Architecture (Core + Academy + Talent + Vacancy)

Consolidated high-level architecture and database layout for the multi-app platform.

### Goals

- Single repository with a shared Core serving multiple domain apps
- Single database with isolation via separate DB schemas: `core`, `academy`, `talent`, `vacancy`
- Clear ownership and boundaries; cross-app reuse through the Core
- Consistent auth, logging, and operational concerns across all apps

### Component diagram

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

- Schemas: `core` owns identity and RBAC; each app owns its domain entities in its schema
- Cross-schema relations allowed (e.g., `academy` referencing `core.candidates`)

```mermaid
erDiagram
  ADMIN ||--o{ ADMIN_ROLE : has
  ROLE  ||--o{ ADMIN_ROLE : includes
  ROLE  ||--o{ ROLE_PERMISSION : grants
  PERMISSION ||--o{ ROLE_PERMISSION : part_of

  CANDIDATE ||--o{ ACADEMY_ENROLLMENT : enrolls
  PROGRAM   ||--o{ ACADEMY_ENROLLMENT : includes
```


