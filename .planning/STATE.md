---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 01-11-PLAN.md
last_updated: "2026-05-21T22:52:29.413Z"
last_activity: "2026-05-21 — Completed Plan 08 (UAT gap closure: postcss.config.mjs + SignupForm onChange fix)"
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 18
  completed_plans: 11
  percent: 53
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20)

**Core value:** Reviewers upload a research plan PDF and receive an automated taxonomy classification in minutes instead of hours — with a full audit trail of every decision and override.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 8 of 8 in current phase (all foundation plans complete)
Status: In progress
Last activity: 2026-05-21 — Completed Plan 08 (UAT gap closure: postcss.config.mjs + SignupForm onChange fix)

Progress: [█████░░░░░] 53%

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

### Pending Todos

None yet.

### Blockers/Concerns

- **Open question:** ML provider for classification (OpenAI / Anthropic / AWS Bedrock) — must decide before any real PHI-adjacent data is processed; keyword fallback covers Phase 2
- **Open question:** PCORI taxonomy canonical seed data source — must be obtained before Phase 2 classification is meaningful
- **Open question:** Production storage provider (AWS S3 / Azure Blob / MinIO) — architecture abstracts via `StorageService`; decide before Phase 2 deploy
- **Open question:** Email service provider (SES / SendGrid / Mailgun) — MailHog covers Phase 1 dev; needed before real user onboarding
- **Compliance:** HIPAA-aligned controls require review before processing real research plan PDFs with any ML provider

## Session Continuity

Last session: 2026-05-21T22:52:29.411Z
Stopped at: Completed 01-11-PLAN.md
Resume file: None
