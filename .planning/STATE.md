---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Phase 1 UI-SPEC approved
last_updated: "2026-05-20T17:28:02.417Z"
last_activity: 2026-05-20 — Roadmap created; ready to begin Phase 1 planning
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20)

**Core value:** Reviewers upload a research plan PDF and receive an automated taxonomy classification in minutes instead of hours — with a full audit trail of every decision and override.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-05-20 — Roadmap created; ready to begin Phase 1 planning

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-Phase 1]: Eliminate H2 in dev — use Docker Compose PostgreSQL 16 from day one (Flyway dialect gap makes H2 a liability)
- [Pre-Phase 1]: JWT secret must come from env var only (`JWT_SECRET`); startup `IllegalStateException` if missing — enforce from Phase 1
- [Pre-Phase 1]: Keyword-based `ClassificationStrategy` ships as default; Spring AI ML swap deferred — allows Phase 2 to ship without ML provider decision
- [Pre-Phase 1]: `SecurityContextPropagatingDecorator` (TaskDecorator) on `classificationExecutor` is mandatory — without it, audit fields are null on all pipeline-persisted records

### Pending Todos

None yet.

### Blockers/Concerns

- **Open question:** ML provider for classification (OpenAI / Anthropic / AWS Bedrock) — must decide before any real PHI-adjacent data is processed; keyword fallback covers Phase 2
- **Open question:** PCORI taxonomy canonical seed data source — must be obtained before Phase 2 classification is meaningful
- **Open question:** Production storage provider (AWS S3 / Azure Blob / MinIO) — architecture abstracts via `StorageService`; decide before Phase 2 deploy
- **Open question:** Email service provider (SES / SendGrid / Mailgun) — MailHog covers Phase 1 dev; needed before real user onboarding
- **Compliance:** HIPAA-aligned controls require review before processing real research plan PDFs with any ML provider

## Session Continuity

Last session: 2026-05-20T17:28:02.412Z
Stopped at: Phase 1 UI-SPEC approved
Resume file: .planning/phases/01-foundation/01-UI-SPEC.md
