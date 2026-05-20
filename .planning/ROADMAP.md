# Roadmap: PCORI Research Analytics Platform

## Overview

The platform is built in four phases that mirror the natural dependency chain of a classification system: auth and infrastructure first (nothing works without it), then the core classification pipeline with taxonomy and file storage (the primary value proposition), then insights once classified data exists to display, and finally reporting, admin polish, and help center features that complete the product for all five personas.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - JWT auth, RBAC, Docker dev environment, Spring Boot project scaffold with PostgreSQL 16 and all security infrastructure
- [ ] **Phase 2: Classification Pipeline** - PDF upload, async 3-stage pipeline, taxonomy CRUD/tree, S3 file storage, manual override, classification list
- [ ] **Phase 3: Insights** - Dashboards, KPI cards, analytics charts, pipeline monitoring UI, in-app notifications
- [ ] **Phase 4: Reporting & Admin Polish** - Excel reports, ad-hoc report builder, saved templates, user management, help center

## Phase Details

### Phase 1: Foundation
**Goal**: Reviewers and admins can securely register, log in, and have role-gated access enforced on every endpoint — running on a dev environment that mirrors production
**Depends on**: Nothing (first phase)
**Requirements**: FR-1.1, FR-1.2, FR-1.3, FR-1.4, FR-1.5, FR-1.6, FR-1.7, FR-1.8
**Success Criteria** (what must be TRUE):
  1. A new user can register with email/password and receive a verification email; unverified accounts cannot log in
  2. A verified user can log in and receive a JWT that authorizes protected API calls for 1 hour
  3. After configurable failed login attempts the account locks; after configurable TTL or admin action it unlocks
  4. A user can request a password reset link and use it to set a new password within the reset TTL
  5. Admin-role endpoints return 403 when called with a REVIEWER-role JWT, confirming RBAC is enforced at the service layer
**Plans**: TBD

### Phase 2: Classification Pipeline
**Goal**: A reviewer can upload a PDF research plan and receive an automated PCORI taxonomy classification in minutes, with all files tracked in S3 and the full taxonomy tree browsable and maintainable
**Depends on**: Phase 1
**Requirements**: FR-2.1, FR-2.2, FR-2.3, FR-2.4, FR-2.5, FR-2.6, FR-2.7, FR-2.8, FR-3.1, FR-3.2, FR-3.3, FR-3.4, FR-3.5, FR-10.1, FR-10.2
**Success Criteria** (what must be TRUE):
  1. Reviewer uploads a PDF and receives a `202 Accepted` response with a `RP-YYYY-###` plan ID; the classification reaches `CLASSIFIED` or `NEEDS_REVIEW` status within minutes via async pipeline
  2. A failed classification can be retried and re-enters the pipeline; a `CLASSIFIED` record shows all four taxonomy dimensions with a confidence score
  3. Reviewer can manually override any taxonomy dimension on a classification with a required reason; `reviewedBy` and `reviewedAt` are recorded
  4. Classifications can be filtered by status, date range, and PCC; searched by plan ID or title; paginated and sorted
  5. Taxonomy admin can CRUD PCORI/ICD-10 categories, view the full hierarchy tree, and activate/deactivate codes without deletion
  6. Uploaded PDF is stored in S3-compatible object storage and retrievable via a 15-minute pre-signed URL; direct public access returns 403
**Plans**: TBD

### Phase 3: Insights
**Goal**: Program managers and admins have real-time visibility into classification volume, accuracy, override patterns, and pipeline health — with in-app notifications keeping reviewers informed without manual polling
**Depends on**: Phase 2
**Requirements**: FR-4.1, FR-4.2, FR-4.3, FR-4.4, FR-4.5, FR-4.6, FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5, FR-8.1, FR-8.2
**Success Criteria** (what must be TRUE):
  1. Dashboard shows live KPI cards (total, classified, processing, pending, failed, needs-review counts, average AI confidence) that update when the date-range filter changes
  2. Analytics page shows accuracy trend, confidence distribution, processing volume, recent overrides, and model performance — all scoped to the selected date range simultaneously
  3. Each user's dashboard widget layout is saved and restored between sessions
  4. Admin can view pipeline stage health, see stuck records highlighted, and issue start/stop/pause/resume/sync-now commands; admin can retry an individual failed stage
  5. A reviewer receives an in-app notification when their uploaded plan finishes classification or fails; notification preferences are configurable per user
**Plans**: TBD

### Phase 4: Reporting & Admin Polish
**Goal**: Program managers can generate and download Excel reports on demand; admins can manage all users and roles through the UI; every user has a browsable help center — completing the platform for all five personas
**Depends on**: Phase 3
**Requirements**: FR-6.1, FR-6.2, FR-6.3, FR-6.4, FR-7.1, FR-7.2, FR-7.3, FR-9.1, FR-9.2
**Success Criteria** (what must be TRUE):
  1. User can click one button to download a `.xlsx` Excel report of classification data; large exports (>1,000 rows) complete without server OOM errors
  2. User can build an ad-hoc report by selecting columns and filters, preview results, and download; reports can be saved as named reusable templates
  3. Admin can create, edit, deactivate (not hard-delete), and assign roles to any user account without IT intervention; user search and filtering work across all user fields
  4. Any authenticated user can browse help articles and FAQs by category, search the article index, and submit documentation feedback
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/TBD | Not started | - |
| 2. Classification Pipeline | 0/TBD | Not started | - |
| 3. Insights | 0/TBD | Not started | - |
| 4. Reporting & Admin Polish | 0/TBD | Not started | - |

---
*Roadmap v1.0 — PCORI Research Analytics Platform*
*Created: 2026-05-20 | Granularity: standard | Coverage: 44/44 requirements ✓*
