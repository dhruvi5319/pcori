---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed 02-07-PLAN.md
last_updated: "2026-05-23T20:51:21.968Z"
last_activity: "2026-05-23 — Phase 2 complete: MinIO+S3 storage, 3-stage async classification pipeline, taxonomy CRUD with cascade deactivation, /classifications page with dialogs, /taxonomy two-pane page"
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 18
  completed_plans: 17
  percent: 90
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20)

**Core value:** Reviewers upload a research plan PDF and receive an automated taxonomy classification in minutes instead of hours — with a full audit trail of every decision and override.
**Current focus:** Phase 2 — Classification Pipeline

## Current Position

Phase: 2 of 4 (Classification Pipeline) — COMPLETE ✓
Plan: 7/7 complete
Status: Phase 2 complete — ready for Phase 3
Last activity: 2026-05-23 — Phase 2 complete: MinIO+S3 storage, 3-stage async classification pipeline, taxonomy CRUD with cascade deactivation, /classifications page with dialogs, /taxonomy two-pane page

Progress: [█████████░] 90%

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
| Phase 02-classification-pipeline P01 | 1min | 3 tasks | 3 files |
| Phase 02-classification-pipeline P02 | 3min | 2 tasks | 12 files |
| Phase 02-classification-pipeline P03 | 5min | 2 tasks | 11 files |
| Phase 02-classification-pipeline P04 | 4min | 2 tasks | 25 files |
| Phase 02-classification-pipeline P05 | 4min | 2 tasks | 15 files |
| Phase 02-classification-pipeline P07 | 4min | 2 tasks | 12 files |

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
- [Phase 02-classification-pipeline]: V4/V5 migration numbering used — V3 was taken by Phase 1 audit columns; classification_schema=V4, taxonomy_seed=V5
- [Phase 02-classification-pipeline]: MinIO added to Docker Compose with pcori-files bucket via minio-setup initializer; backend uses STORAGE_ENDPOINT env var for S3StorageService endpointOverride
- [Phase 02-classification-pipeline]: S3Presigner built in constructor with @Value params rather than separate @Bean to avoid circular dependency
- [Phase 02-classification-pipeline]: UploadedFile.uploadedBy stored as UUID column (not @ManyToOne) to avoid circular loading with User domain
- [Phase 02-classification-pipeline]: TaxonomyCategory.createdBy mapped as String (not UUID) — V6 migration fixes V5 DDL mismatch to match AuditableEntity @CreatedBy String pattern
- [Phase 02-classification-pipeline]: TaxonomyController delegates to TaxonomyService.toDto() (public method) — avoids duplicate mapping logic; DELETE /taxonomy/{id} returns 200 with deactivated entity to confirm soft-delete
- [Phase 02-classification-pipeline]: PDFBox 3.x uses Loader.loadPDF(byte[]) API — readAllBytes() required before passing to Loader
- [Phase 02-classification-pipeline]: findRecentByLimit replaces findTopNByOrderByUploadedAtDesc — Spring Data doesn't support dynamic TopN with parameter
- [Phase 02-classification-pipeline]: ClassificationController resolves uploadedBy UUID via User instanceof cast (User extends UserDetails) — username is not a UUID
- [Phase 02-classification-pipeline]: CSS max-height transition (0→9999px) for tree expand/collapse — no JS height measurement needed; matches UI-SPEC 0.2s ease
- [Phase 02-classification-pipeline]: isAdmin hardcoded true in taxonomy page.tsx — role-gating from JWT context deferred to Phase 3
- [Phase 02-classification-pipeline]: formatRelativeDate added to lib/utils.ts — simple relative date string without external library dependency (implied by ClassificationRow code)
- [Phase 02-classification-pipeline]: TanStack Query conditional refetchInterval: polls 5s when any row status === PROCESSING; false otherwise — stops polling when all terminal

### Pending Todos

None yet.

### Blockers/Concerns

- **Open question:** ML provider for classification (OpenAI / Anthropic / AWS Bedrock) — must decide before any real PHI-adjacent data is processed; keyword fallback covers Phase 2
- **Open question:** PCORI taxonomy canonical seed data source — must be obtained before Phase 2 classification is meaningful
- **Open question:** Production storage provider (AWS S3 / Azure Blob / MinIO) — architecture abstracts via `StorageService`; decide before Phase 2 deploy
- **Open question:** Email service provider (SES / SendGrid / Mailgun) — MailHog covers Phase 1 dev; needed before real user onboarding
- **Compliance:** HIPAA-aligned controls require review before processing real research plan PDFs with any ML provider

## Session Continuity

Last session: 2026-05-23T20:51:21.966Z
Stopped at: Completed 02-07-PLAN.md
Resume file: None
