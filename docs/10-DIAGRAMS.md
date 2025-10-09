## Diagrams (Mermaid Only)

This document aggregates diagrams only. It includes architecture flowcharts, sequences, and detailed ERDs with table columns.

### System Overview

```mermaid
flowchart LR
  subgraph Clients
    AdminUI
    AcademyUI
    TalentUI
    VacancyUI
  end

  Clients --> API

  subgraph API[NestJS Modular Monolith]
    direction LR
    SSO[Core SSO + RBAC]
    CORE[Core Services: Prisma, Mail, S3, Logger]
    ACADEMY[Academy Module]
    TALENT[Talent Module]
    VACANCY[Vacancy Module]
  end

  API --> DB[(PostgreSQL: core, academy, talent, vacancy schemas)]
  ACADEMY --> CORE
  TALENT --> CORE
  VACANCY --> CORE
  SSO --> CORE
```

### Runtime Architecture

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

### SSO Login Flow

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant A as Frontend (Academy/Talent/Vacancy)
  participant B as Backend (Core + Apps)
  participant S as Core SSO
  participant DB as Postgres

  U->>A: Open app and click Login
  A->>S: Redirect to Core SSO (/auth/login)
  S->>DB: Verify credentials (admins/candidates)
  DB-->>S: User record OK
  S-->>A: Redirect back with auth code / tokens
  A->>B: Exchange/attach JWT and call API
  B->>B: Verify JWT, check RBAC permissions
  B-->>A: Authorized response
```

### Token Refresh Flow

```mermaid
sequenceDiagram
  autonumber
  participant A as Frontend
  participant B as Backend
  participant S as Core SSO

  A->>B: API call with expired/expiring JWT
  B-->>A: 401 (or advises refresh)
  A->>S: Refresh token request
  S-->>A: New JWT (and rotated refresh token)
  A->>B: Retry API with new JWT
  B-->>A: 200 OK
```

### ERD (Core) — Expanded with Columns

```mermaid
erDiagram
  ADMINS {
    string id PK
    string email
    string password
    string name
    string phone
    string photo
    datetime last_login
    datetime created_at
    datetime updated_at
    datetime deleted_at
    string created_by
    string updated_by
    string deleted_by
  }
  ADMIN_REFRESH_TOKENS {
    string id PK
    string admin_id FK
    string token_hash
    datetime issued_at
    datetime expires_at
    datetime revoked_at
    string ip
    string user_agent
    datetime created_at
  }
  ROLES {
    int id PK
    string title
    string description
    datetime created_at
    datetime updated_at
    datetime deleted_at
    string created_by
    string updated_by
    string deleted_by
  }
  PERMISSIONS {
    int id PK
    string title
    string description
    string dynamic_title
    datetime created_at
    datetime updated_at
    datetime deleted_at
    string created_by
    string updated_by
    string deleted_by
  }
  ROLE_PERMISSIONS {
    int id_role FK
    int id_permission FK
    datetime created_at
    datetime updated_at
    datetime deleted_at
    string created_by
    string updated_by
    string deleted_by
  }
  ADMIN_ROLES {
    uuid id_admin FK
    int id_role FK
    datetime created_at
    datetime updated_at
    datetime deleted_at
    string created_by
    string updated_by
    string deleted_by
  }
  CANDIDATES {
    string id PK
    string email
    string password
    boolean onboarding
    json verified
    string talent_id
    string name
    string sex
    json address_info
    json birth_info
    json document
    json education
    string phone
    string marital_status
    string religion
    boolean email_verified
    datetime email_verified_at
    datetime last_login
    int status
    datetime created_at
    datetime updated_at
    datetime deleted_at
    datetime password_updated_at
    string created_by
    string updated_by
    string deleted_by
  }
  CANDIDATE_REFRESH_TOKENS {
    string id PK
    string candidate_id FK
    string token_hash
    datetime issued_at
    datetime expires_at
    datetime revoked_at
    string ip
    string user_agent
    datetime created_at
  }
  CANDIDATE_SKILLS {
    int id PK
    string id_candidate FK
    string name
    string tag
    string certificate
    string level
    datetime issue_date
    boolean is_verified
    datetime verification_date
    string id_admin_verificator
    string status
    datetime created_at
    datetime updated_at
    datetime deleted_at
  }
  CANDIDATE_WORK_EXPS {
    int id PK
    string id_candidate FK
    string company
    string occupation
    string industry
    string start_year
    string start_month
    string end_year
    string end_month
    string so
    string description
    string certificate
    string certificate_test
    boolean is_verified
    string field
    string tag
    string status
    datetime created_at
    datetime updated_at
    datetime deleted_at
  }

  ADMINS ||--o{ ADMIN_ROLES : has
  ROLES  ||--o{ ADMIN_ROLES : includes
  ROLES  ||--o{ ROLE_PERMISSIONS : grants
  PERMISSIONS ||--o{ ROLE_PERMISSIONS : includes
  ADMINS ||--o{ ADMIN_REFRESH_TOKENS : issues
  CANDIDATES ||--o{ CANDIDATE_REFRESH_TOKENS : issues
  CANDIDATES ||--o{ CANDIDATE_SKILLS : has
  CANDIDATES ||--o{ CANDIDATE_WORK_EXPS : has
```

### ERD (Academy) — Expanded with Columns

```mermaid
erDiagram
  CANDIDATES {
    string id PK
  }
  PROGRAMS {
    string id PK
    string title
    datetime registration_date
    datetime program_start_date
    string training_center
    int capacity
    string description
    string photo
    int price
    int duration
    string category
    string status
    boolean is_active
    boolean archived
    string formulir
    datetime created_at
    string created_by
    datetime updated_at
    string updated_by
    datetime deleted_at
    string deleted_by
  }
  WEBINARS {
    string id PK
    string title
    datetime registration_date
    datetime webinar_date
    int capacity
    string description
    string photo
    string link
    int price
    int duration
    string speakers
    string category
    string status
    boolean is_visible
    boolean is_active
    datetime created_at
    string created_by
    datetime updated_at
    string updated_by
    datetime deleted_at
    string deleted_by
  }
  CANDIDATE_PROGRAMS {
    int id PK
    string id_candidate FK
    string id_program FK
    string status
    string source_screening_id FK
    string assigned_by
    datetime assigned_at
    string assignment_reason
    datetime created_at
    datetime updated_at
    datetime deleted_at
    string deleted_by
  }
  CANDIDATE_WEBINARS {
    int id PK
    string id_candidate FK
    string id_webinar FK
    string status
    datetime created_at
    datetime updated_at
    datetime deleted_at
    datetime attended_at
  }
  WEBINAR_ATTENDANCE_CODES {
    string id PK
    string webinar_id FK
    string code
    datetime valid_from
    datetime valid_to
    datetime created_at
    string created_by
    datetime updated_at
    string updated_by
    datetime deleted_at
    string deleted_by
  }
  CANDIDATE_BOOKMARK_WEBINARS {
    int id PK
    string id_candidate FK
    string id_webinar FK
    datetime created_at
    datetime updated_at
  }
  CANDIDATE_SCREENINGS {
    string id PK
    string candidate_id FK
    string webinar_id FK
    string stage
    boolean is_passed_test
    boolean is_matches_requirement
    string reject_reason_matches
    string reject_reason_not_passed
    string assigned_program_id FK
    string assigned_by
    datetime assigned_at
    datetime created_at
    datetime updated_at
    datetime deleted_at
    string created_by
    string updated_by
    string deleted_by
  }
  PROGRAM_INTERVIEW_SCHEDULES {
    string id PK
    string program_id FK
    string type
    string link
    string location_label
    datetime start_at
    datetime end_at
    boolean is_active
    datetime created_at
    datetime updated_at
    datetime deleted_at
  }
  PROGRAM_INTERVIEW_ENROLLMENTS {
    string id PK
    string candidate_id FK
    string program_id FK
    string interview_schedule_id FK
    string status
    boolean passed
    json score
    string notes
    datetime created_at
    string created_by
    datetime updated_at
    string updated_by
    datetime deleted_at
    string deleted_by
  }

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
```

### ERD (Talent) — Placeholder

```mermaid
erDiagram
  CANDIDATES {
    string id PK
    string email
  }
  TALENT_PROFILES {
    string id PK
    string candidate_id FK
    json profile_data
  }
  TALENT_SKILLS {
    int id PK
    string profile_id FK
    string name
    string level
  }

  CANDIDATES ||--|| TALENT_PROFILES : owns
  TALENT_PROFILES ||--o{ TALENT_SKILLS : lists
```

### ERD (Vacancy) — Placeholder

```mermaid
erDiagram
  EMPLOYERS {
    string id PK
    string name
  }
  JOB_ORDERS {
    string id PK
    string employer_id FK
    string title
    string status
  }
  APPLICATIONS {
    string id PK
    string job_order_id FK
    string candidate_id FK
    string status
    datetime submitted_at
  }
  CANDIDATES {
    string id PK
    string email
  }

  EMPLOYERS ||--o{ JOB_ORDERS : posts
  JOB_ORDERS ||--o{ APPLICATIONS : receives
  CANDIDATES ||--o{ APPLICATIONS : submits
```


