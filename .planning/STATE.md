---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 03-11-PLAN.md
last_updated: "2026-05-24T01:32:10.383Z"
last_activity: "2026-05-24 — Phase 3 Plan 11: Analytics + Data Pipeline sidebar nav items; Phase 3 integration checkpoint approved"
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 29
  completed_plans: 22
  percent: 76
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20)

**Core value:** Reviewers upload a research plan PDF and receive an automated taxonomy classification in minutes instead of hours — with a full audit trail of every decision and override.
**Current focus:** Phase 3 — Insights

## Current Position

Phase: 3 of 4 (Insights) — Complete
Plan: 11/11 complete
Status: Phase 3 complete — all sidebar nav links wired, human e2e verification approved
Last activity: 2026-05-24 — Phase 3 Plan 11: Analytics + Data Pipeline sidebar nav items, Phase 3 integration checkpoint approved

Progress: [████████░░] 76%

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
| Phase 01-foundation P01 | 2min | 2 tasks | 16 files |
| Phase 01-foundation P02 | 4min | 2 tasks | 16 files |
| Phase 01-foundation P03 | 1min | 2 tasks | 2 files |
| Phase 01-foundation P04 | 5min | 2 tasks | 13 files |
| Phase 01-foundation P05 | 11min | 2 tasks | 20 files |
| Phase 01-foundation P06 | 5min | 2 tasks | 19 files |
| Phase 01-foundation P07 | 3min | 2 tasks | 11 files |
| Phase 01-foundation P08 | 3min | 2 tasks | 2 files |
| Phase 01-foundation P10 | 1min | 1 tasks | 2 files |
| Phase 01-foundation P09 | 2min | 1 tasks | 1 files |
| Phase 01-foundation P11 | 1min | 1 tasks | 1 files |
| Phase 03-insights P02 | 5min | 2 tasks | 3 files |
| Phase 03-insights P01 | 2min | 1 tasks | 2 files |
| Phase 03-insights P04 | 3min | 2 tasks | 8 files |
| Phase 03-insights P03 | 3min | 2 tasks | 13 files |
| Phase 03-insights P05 | 4min | 2 tasks | 10 files |
| Phase 03-insights P06 | 5min | 2 tasks | 12 files |
| Phase 03-insights P09 | 4min | 2 tasks | 14 files |
| Phase 03-insights P07 | 15min | 2 tasks | 13 files |
| Phase 03-insights P10 | 4min | 2 tasks | 9 files |
| Phase 03-insights P08 | 4min | 2 tasks | 14 files |
| Phase 03-insights P11 | 3min | 2 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-Phase 1]: Eliminate H2 in dev — use Docker Compose PostgreSQL 16 from day one (Flyway dialect gap makes H2 a liability)
- [Pre-Phase 1]: JWT secret must come from env var only (`JWT_SECRET`); startup `IllegalStateException` if missing — enforce from Phase 1
- [Pre-Phase 1]: Keyword-based `ClassificationStrategy` ships as default; Spring AI ML swap deferred — allows Phase 2 to ship without ML provider decision
- [Pre-Phase 1]: `SecurityContextPropagatingDecorator` (TaskDecorator) on `classificationExecutor` is mandatory — without it, audit fields are null on all pipeline-persisted records
- [Phase 01-foundation]: Removed deprecated version: '3.9' from docker-compose.yml (modern Docker Compose v2+ treats as obsolete)
- [Phase 01-foundation]: Swagger disabled by default in base profile, enabled only in dev — security posture for production
- [Phase 01-foundation]: JWT_SECRET dev value set to 64+ chars to pass HS512 minimum key length validation at startup
- [Phase 01-foundation]: query-client file uses .tsx extension — contains JSX for QueryClientProvider; .ts extension causes Turbopack parse failure
- [Phase 01-foundation]: geist npm package used for Geist font (geist/font/sans and geist/font/mono) — Next.js-compatible font loader, no next/font/google needed
- [Phase 01-foundation]: Phase 1 migrations include auth tables only — classifications and pipeline tables deferred to Phase 2
- [Phase 01-foundation]: ADMIN role assigned all permissions via CROSS JOIN — automatically includes future permissions
- [Phase 01-foundation]: UserDetailsServiceImpl stub created — replaced fully in Plan 05 when UserRepository and User entity are available
- [Phase 01-foundation]: Swagger gated to dev profile via AuthorizationDecision — unreachable in non-dev profiles without property overrides
- [Phase 01-foundation]: @Transactional(noRollbackFor = BadCredentialsException.class) required on AuthService — without it Spring rolls back login_attempts increment, breaking FR-1.3 account lockout
- [Phase 01-foundation]: V3 migration adds created_by/last_modified_by audit columns to users table — AuditableEntity @MappedSuperclass mapped these but V1 DDL omitted them
- [Phase 01-foundation]: ResetPasswordForm String() cast: TypeScript strict rejects FieldError as ReactNode from zod refine union type — cast to String() for rendering
- [Phase 01-foundation]: E2E Playwright tests written as artifacts but execution deferred to verify phase per test execution boundary rules
- [Phase 01-foundation]: LucideIcon type union in SidebarNavItem: accepts LucideIcon | React.ComponentType<LucideProps> to satisfy TypeScript strict mode
- [Phase 01-foundation]: App Shell auth guard pattern: useEffect + isAuthenticated() → router.replace('/login') + spinner until auth checked
- [Phase 01-foundation]: postcss.config.mjs required for Tailwind v4 + Next.js Turbopack — without it @import tailwindcss is inert and no utility classes are emitted
- [Phase 01-foundation]: SignupForm mode changed to onChange matching LoginForm — onBlur caused isValid to never update without explicit field blur, permanently disabling Create Account button
- [Phase 01-foundation]: ThemeToggle already had aria-label='Toggle theme' — no ThemeToggle.tsx modification needed; Playwright uses getByRole by role+name
- [Phase 01-foundation]: Removed unlayered * { margin: 0; padding: 0 } from globals.css — Tailwind v4 includes equivalent reset in @layer base; unlayered CSS wins over all @layer rules per CSS Cascade Level 5
- [Phase 01-foundation]: @PreAuthorize over @Secured/@RolesAllowed for admin endpoint RBAC — consistent with @EnableMethodSecurity already in SecurityConfig
- [Phase 01-foundation]: AdminController uses ResponseEntity<Map<String,Object>> for ping — no custom DTO needed; serves as Phase 2 admin scaffold
- [Phase 02-classification-pipeline]: Flyway migrations V3 (Phase 1 audit columns) already taken; V4=classification_schema, V5=taxonomy_seed — plan numbering adjusted
- [Phase 02-classification-pipeline]: created_by/last_modified_by in Classification and TaxonomyCategory mapped as VARCHAR(255) String (not UUID) to match AuditableEntity pattern
- [Phase 02-classification-pipeline]: ClassificationController resolves uploadedBy UUID via User instanceof cast (User extends UserDetails) — username is not a UUID
- [Phase 02-classification-pipeline]: KeywordClassificationStrategy confidence ≥0.75 routes to CLASSIFIED; <0.75 routes to NEEDS_REVIEW (configurable via app.classification.needs-review-threshold)
- [Phase 02-classification-pipeline]: PDFBox 3.x uses Loader.loadPDF(byte[]) API — readAllBytes() required before passing to Loader (stream must be fully read)
- [Phase 02-classification-pipeline]: @radix-ui/react-progress added to package.json for UploadProgressBar in Plan 06
- [Phase 02-classification-pipeline]: dash-flow @keyframe added to globals.css for PDF dropzone SVG animated dashed border
- [Phase 02-classification-pipeline]: Classifications page wires all 4 dialogs (Upload, View, Override, Retry) in single page.tsx; dialog state via useState hooks
- [Phase 03-insights]: Install exactly 4 packages: @dnd-kit/core, @dnd-kit/sortable, recharts, @radix-ui/react-switch — no additional packages
- [Phase 03-insights]: Skeleton tokens added as CSS custom properties under :root + .dark following existing Phase 1 token pattern
- [Phase 03-insights]: V6 no-op placeholder created to fill sequential migration gap (V5→V7); V6 was expected by plan but missing from Phase 2
- [Phase 03-insights]: notification_channel enum: exactly 2 values (IN_APP, EMAIL) — no PUSH per TechArch spec
- [Phase 03-insights]: dashboard_configurations.user_id UNIQUE constraint enforces one config per user at DB level
- [Phase 03-insights]: Analytics endpoints restricted to MANAGER and ADMIN roles via @PreAuthorize at class level
- [Phase 03-insights]: Native SQL via EntityManager for all analytics queries — avoids JPQL limitations with date_trunc and width_bucket PostgreSQL functions
- [Phase 03-insights]: Confidence distribution always returns all 10 buckets filling zeros — frontend doesn't need to handle missing buckets
- [Phase 03-insights]: NotificationService.dispatch() is synchronous within classificationExecutor thread — no @Async to preserve SecurityContext propagation
- [Phase 03-insights]: Default notification preference: if no preference record exists for user+type+channel, dispatch defaults to enabled (orElse(true))
- [Phase 03-insights]: JSON-as-TEXT fallback for dashboard JSONB columns — hypersistence-utils not in classpath; manual ObjectMapper in entity accessors; column DDL still declares jsonb
- [Phase 03-insights]: DashboardService.getMetrics() reuses ClassificationRepository.getStatistics() aggregate to avoid N+1 COUNT queries
- [Phase 03-insights]: PipelineStatusService uses in-memory volatile state flag for pipeline control — DB-persisted state deferred to Phase 4
- [Phase 03-insights]: Classification @SQLRestriction handles soft-delete filtering; countByStatus/findByStatus used in PipelineStatusService (not countByStatusAndDeletedAtIsNull)
- [Phase 03-insights]: PIPELINE_STATE_COLORS exported from types/pipeline.ts as single source of truth for all color-coded pipeline UI elements
- [Phase 03-insights]: PipelineControlActions renders null when isAdmin=false — control section completely hidden for non-admins per FR-5.2
- [Phase 03-insights]: Widget order stored as { widgets: KpiWidgetConfig[] } inside DashboardConfiguration.layout JSON — matches existing server schema without changes
- [Phase 03-insights]: NotificationBell placed in AppHeader (existing header composition component) rather than directly in layout.tsx
- [Phase 03-insights]: date-fns installed to fix pre-existing blocking build error in PipelineStatusHeader.tsx
- [Phase 03-insights]: isAnimationActive=false on every Recharts animated primitive (Line/Bar/Area) — production requirement per UI-SPEC
- [Phase 03-insights]: AnalyticsDateContext.isLoading drives data-loading attribute; CSS applies opacity 0.5 pulse — no per-component state needed
- [Phase 03-insights]: Confidence histogram bar colors: Cell per bar, red for high<=0.7, amber for high<=0.85, green for high>0.85 (UI-SPEC locked)
- [Phase 03-insights]: Analytics nav item roles corrected to MANAGER+ADMIN (was MANAGER+VIEWER); Data Pipeline nav corrected to ADMIN-only (was ADMIN+MANAGER) — sidebar role gating now matches backend @PreAuthorize and FR-5.x spec

### Pending Todos

None yet.

### Blockers/Concerns

- **Open question:** ML provider for classification (OpenAI / Anthropic / AWS Bedrock) — must decide before any real PHI-adjacent data is processed; keyword fallback covers Phase 2
- **Open question:** PCORI taxonomy canonical seed data source — must be obtained before Phase 2 classification is meaningful
- **Open question:** Production storage provider (AWS S3 / Azure Blob / MinIO) — architecture abstracts via `StorageService`; decide before Phase 2 deploy
- **Open question:** Email service provider (SES / SendGrid / Mailgun) — MailHog covers Phase 1 dev; needed before real user onboarding
- **Compliance:** HIPAA-aligned controls require review before processing real research plan PDFs with any ML provider

## Session Continuity

Last session: 2026-05-24T01:32:10.381Z
Stopped at: Completed 03-11-PLAN.md
Resume file: None
