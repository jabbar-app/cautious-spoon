## Executive Brief — Platform and Academy (Non‑Technical)

### 1. Why this platform

- One login for all properties (Academy today; Talent/Vacancy next) to reduce friction for users and operations.
- Reuse the same foundation (security, permissions, email, storage) to go faster and reduce cost.
- Keep boundaries clear so each app can evolve independently later.

### 2. What users will experience

- Single Sign-On (SSO): log in once, access all apps.
- Academy: browse training programs, enroll, and attend webinars.
- Later: manage talent profiles and apply to vacancies with the same account.

### 3. How it’s organized

- Core: shared identity, permissions/roles, and platform services.
- Academy: learning features and data, connected to Core accounts.
- Single database with separate areas per app to keep things organized and secure.

### 4. Why we designed it this way

- Start simple: one secure backend with modules for each app → faster delivery.
- Scale smart: if/when needed, each module can be split into its own service.
- Data governance: one database, multiple schemas → easy reporting and safer change control.

### 5. Trust and safety

- Account security: industry-standard tokens and session controls.
- Access control: roles and permissions per app; administrators can tailor access.
- Auditability: consistent logging and monitoring across all apps.

### 6. What success looks like (metrics)

- Time-to-launch for new features and apps
- Cross-app login success rate (SSO)
- Academy enrollments and webinar attendance
- Uptime and incident rate

### 7. Roadmap highlights

- Today: Core + Academy launch
- Next: Talent and Vacancy modules and permissions
- Later: optional service separation for scale, analytics enhancements


