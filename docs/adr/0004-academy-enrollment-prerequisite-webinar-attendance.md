## ADR 0004: Academy Enrollment Requires Prior Webinar Attendance

Date: 2025-10-08

### Status

Accepted

### Context

To improve learner readiness and reduce drop‑offs, Academy programs should be available only to candidates who have attended an introductory/eligible webinar.

### Decision

- Enforce a prerequisite: a candidate must have at least one `attended` record in `academy.candidate_webinars` for an eligible webinar before enrolling in any Academy program.
- Eligible webinars are those tagged or configured as prerequisites (configuration detail to be defined in the schema or metadata).

### Consequences

- Pros: better prepared enrollees, improved conversion quality
- Cons: additional step before enrollment; requires attendance tracking and UI guidance

### Implementation Notes

- Controller/service checks on enrollment endpoints; return 422 with guidance when unmet.
- Attendance tracking: add/update status in `candidate_webinars` (e.g., `attended`, `no_show`).
- Optional admin override with audit (actor, reason, timestamp).
- Backfill: if needed, migrate historical attendance or seed eligible webinar mappings.


