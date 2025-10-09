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
  CANDIDATES ||--o{ CANDIDATE_PROGRAMS : enrolls
  PROGRAMS   ||--o{ CANDIDATE_PROGRAMS : includes
  CANDIDATES ||--o{ CANDIDATE_WEBINARS : registers
  WEBINARS   ||--o{ CANDIDATE_WEBINARS : includes
  WEBINARS   ||--o{ WEBINAR_ATTENDANCE_CODES : has
  CANDIDATES ||--o{ CANDIDATE_BOOKMARK_WEBINARS : bookmarks
  WEBINARS   ||--o{ CANDIDATE_BOOKMARK_WEBINARS : bookmarked
  CANDIDATES ||--o{ CANDIDATE_SCREENINGS : screened
  WEBINARS   ||--o{ CANDIDATE_SCREENINGS : source
  PROGRAMS   ||--o{ CANDIDATE_SCREENINGS : assigned
  PROGRAMS   ||--o{ PROGRAM_INTERVIEW_SCHEDULES : has
  PROGRAM_INTERVIEW_SCHEDULES ||--o{ PROGRAM_INTERVIEW_ENROLLMENTS : enrolls
  CANDIDATES ||--o{ PROGRAM_INTERVIEW_ENROLLMENTS : attends
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


