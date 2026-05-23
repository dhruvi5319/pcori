---
phase: 01-foundation
plan: 03
subsystem: database
tags: [flyway, postgresql, migration, sql, schema, rbac, roles, permissions]

# Dependency graph
requires:
  - phase: 01-01
    provides: Docker Compose PostgreSQL 16, Flyway configured in pom.xml, db/migration/ directory stub
provides:
  - V1__initial_schema.sql — auth DDL: users, refresh_tokens, roles, permissions, user_roles, role_permissions + partial indexes
  - V2__seed_roles_permissions.sql — 5 roles, 19 permissions, 53 role_permission mappings
  - All PostgreSQL 16 partial indexes (WHERE clause syntax)
affects:
  - 01-04 (Spring Security — SecurityConfig maps to these tables via JPA)
  - 01-05 (Auth domain — UserEntity, RoleEntity, PermissionEntity map to these columns exactly)
  - All subsequent phases requiring RBAC or user data

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Flyway versioned migrations (V1, V2) — forward-only, PostgreSQL-specific
    - UUID PKs with gen_random_uuid() — no sequences
    - TIMESTAMPTZ for all timestamps — timezone-aware
    - Soft-delete pattern — deleted_at TIMESTAMPTZ DEFAULT NULL
    - Partial indexes — PostgreSQL WHERE clause syntax (not H2-compatible)
    - ON CONFLICT DO NOTHING — idempotent seed data

key-files:
  created:
    - backend/src/main/resources/db/migration/V1__initial_schema.sql
    - backend/src/main/resources/db/migration/V2__seed_roles_permissions.sql
  modified: []

key-decisions:
  - "Phase 1 migrations include auth tables only — classifications, taxonomy, pipeline tables deferred to Phase 2 migrations"
  - "V2 seed uses ON CONFLICT DO NOTHING throughout — idempotent re-runs insert 0 rows (verified)"
  - "Partial indexes use PostgreSQL 16 WHERE clause syntax — H2 incompatible by design (matches project decision to eliminate H2)"
  - "ADMIN role assigned all 19 permissions via CROSS JOIN — automatically picks up any future permissions added to the table"

patterns-established:
  - "Column naming: password_hash (not password), is_active, is_email_verified, login_attempts, locked_until — JPA entities must match exactly"
  - "UUID FKs with ON DELETE CASCADE — refresh_tokens, user_roles, role_permissions all cascade on parent delete"
  - "resource:action permission naming convention — e.g., classifications:read, taxonomy:manage"

# Metrics
duration: 1min
completed: 2026-05-20
---

# Phase 1 Plan 03: Flyway Auth Schema Migrations Summary

**Flyway V1 auth DDL (6 tables, 7 partial indexes) and V2 seed (5 roles, 19 permissions, 53 role_permission mappings) applied cleanly on PostgreSQL 16**

## Performance

- **Duration:** 1 min
- **Started:** 2026-05-20T18:27:21Z
- **Completed:** 2026-05-20T18:28:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- V1__initial_schema.sql: 6 auth tables with all TechArch columns (password_hash, is_active, is_email_verified, email_verification_token, password_reset_token, password_reset_expires_at, login_attempts, locked_until) and 7 PostgreSQL 16 partial indexes
- V2__seed_roles_permissions.sql: 5 roles (REVIEWER, MANAGER, TAXONOMY_ADMIN, ADMIN, VIEWER), 19 resource:action permissions, 53 role_permission mappings — all idempotent via ON CONFLICT DO NOTHING
- Both migrations verified on live PostgreSQL 16 container; V2 idempotency confirmed (re-run = 0 inserts)

## Task Commits

Each task was committed atomically:

1. **Task 1: V1 auth schema DDL** - `ff69939` (feat)
2. **Task 2: V2 seed roles and permissions** - `add4410` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified
- `backend/src/main/resources/db/migration/V1__initial_schema.sql` - Auth schema DDL: users (18 columns), refresh_tokens, roles, permissions, user_roles, role_permissions + 7 partial indexes
- `backend/src/main/resources/db/migration/V2__seed_roles_permissions.sql` - Seed: 5 roles, 19 permissions (resource:action), role_permission assignments per role

## Decisions Made
- **Phase 1 auth-only scope** — classifications, taxonomy, pipeline, audit tables deferred to Phase 2 migrations. Keeps V1 focused and prevents JPA entity mapping failures for tables not yet needed.
- **ON CONFLICT DO NOTHING idempotency** — V2 safe to re-run on any environment without error. Confirmed: all 7 INSERT statements return 0 rows on re-execution.
- **PostgreSQL 16 partial indexes** — Intentionally H2-incompatible (project already eliminated H2 in Plan 01). WHERE clause syntax is more performant than full indexes for sparse nullable columns.
- **ADMIN via CROSS JOIN** — Ensures ADMIN always has every permission; no manual list maintenance needed when new permissions are added in future migrations.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — both migrations applied cleanly. V1 created all 6 tables + 7 indexes in a single run. V2 seeded 5 roles, 19 permissions, and 53 role_permission rows. Idempotency verified.

## User Setup Required
None — no external service configuration required. Uses Docker Compose PostgreSQL from Plan 01.

## Next Phase Readiness
- **Plan 04 (Spring Security):** Ready — roles/permissions tables exist; JPA entities can map to users, roles, permissions, user_roles, role_permissions
- **Plan 05 (Auth domain):** Ready — all required columns present (password_hash, is_active, is_email_verified, login_attempts, locked_until, email_verification_token, password_reset_token, password_reset_expires_at)
- Column names match TechArch spec exactly; JPA `ddl-auto=validate` will pass against this schema

---
*Phase: 01-foundation*
*Completed: 2026-05-20*
