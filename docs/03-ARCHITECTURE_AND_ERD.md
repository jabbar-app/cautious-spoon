## Architecture and ERD (Core + Academy)

### Runtime architecture

```mermaid
flowchart LR
  subgraph API[NestJS Application]
    direction LR
    G[HTTP Layer]
    I[Interceptors]
    U[Auth Guards]
    CTRL[Controllers]
    SVC[Services]
  end

  G --> I --> U --> CTRL --> SVC
  SVC --> PRISMA[(Prisma)]
  SVC --> S3[(S3 Storage)]
  SVC --> MAIL[(Mailer)]
```

### Core + Academy ERD (from prisma/schema.prisma)

```mermaid
erDiagram
  ADMINS ||--o{ ADMIN_ROLES : has
  ROLES  ||--o{ ADMIN_ROLES : includes
  ROLES  ||--o{ ROLE_PERMISSIONS : grants
  PERMISSIONS ||--o{ ROLE_PERMISSIONS : includes
  PROGRAMS ||--o{ WEBINARS : schedules
  CANDIDATES ||--o{ CANDIDATE_PROGRAMS : enrolls
  PROGRAMS   ||--o{ CANDIDATE_PROGRAMS : includes
  CANDIDATES ||--o{ CANDIDATE_WEBINARS : registers
  WEBINARS   ||--o{ CANDIDATE_WEBINARS : includes
  %% Business rule: enrollment requires prior webinar attendance

  %% Talent (illustrative future scope)
  CANDIDATES ||--o{ TALENT_PROFILES : owns
  TALENT_PROFILES ||--o{ TALENT_SKILLS : lists

  %% Vacancy (illustrative future scope)
  EMPLOYERS ||--o{ JOB_ORDERS : posts
  CANDIDATES ||--o{ APPLICATIONS : submits
  JOB_ORDERS ||--o{ APPLICATIONS : receives
```

Illustrative future entities

- Talent
  - `TALENT_PROFILES` — 1:1 with `CANDIDATES` storing extended profile attributes
  - `TALENT_SKILLS` — N:1 skills linked to `TALENT_PROFILES`
- Vacancy
  - `EMPLOYERS` — organizations or employer accounts that post jobs
  - `JOB_ORDERS` — jobs created by employers
  - `APPLICATIONS` — candidate applications to job orders, with statuses and timestamps


