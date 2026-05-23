---
phase: 01-foundation
plan: 11
subsystem: auth
tags: [spring-security, rbac, preauthorize, method-security, admin, rfc7807]

# Dependency graph
requires:
  - phase: 01-04
    provides: SecurityConfig with @EnableMethodSecurity, GlobalExceptionHandler mapping AccessDeniedException → 403 RFC 7807
  - phase: 01-05
    provides: User entity with getAuthorities() returning ROLE_ADMIN / ROLE_REVIEWER GrantedAuthority
provides:
  - AdminController with GET /api/admin/ping gated by @PreAuthorize("hasRole('ADMIN')")
  - Phase 1 SC-5 (FR-1.7) demonstration: REVIEWER JWT → 403, ADMIN JWT → 200
  - Scaffold for Phase 2 admin features (user management, pipeline control)
affects:
  - Phase 2 admin features that build on AdminController
  - 01-VERIFICATION.md SC-5 (now satisfiable)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@PreAuthorize(\"hasRole('ADMIN')\") on controller method — service-layer RBAC via @EnableMethodSecurity"
    - "AccessDeniedException thrown by Spring Security → GlobalExceptionHandler.handleAccessDenied() → HTTP 403 RFC 7807"

key-files:
  created:
    - backend/src/main/java/com/pcori/platform/domain/admin/AdminController.java
  modified: []

key-decisions:
  - "@PreAuthorize over @Secured/@RolesAllowed — consistent with @EnableMethodSecurity already declared in SecurityConfig"
  - "ResponseEntity<Map<String, Object>> — no custom DTO for ping endpoint; Map.of() sufficient and avoids boilerplate"
  - "No REVIEWER-accessible equivalent — endpoint is explicitly admin-only to prove RBAC gate"

patterns-established:
  - "Admin endpoints live in com.pcori.platform.domain.admin package — scaffold for Phase 2 admin features"
  - "@PreAuthorize at method level is the RBAC enforcement pattern for all role-gated endpoints"

# Metrics
duration: 1min
completed: 2026-05-21
---

# Phase 1 Plan 11: Admin Controller Summary

**Minimal `GET /api/admin/ping` endpoint gated by `@PreAuthorize("hasRole('ADMIN')")` — proves service-layer RBAC enforcement: ADMIN JWT → 200, REVIEWER JWT → 403 via GlobalExceptionHandler RFC 7807 response, satisfying Phase 1 SC-5 (FR-1.7)**

## Performance

- **Duration:** 1 min
- **Started:** 2026-05-21T22:49:46Z
- **Completed:** 2026-05-21T22:51:41Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `AdminController.java` in `com.pcori.platform.domain.admin` package with `GET /api/admin/ping` endpoint
- `@PreAuthorize("hasRole('ADMIN')")` leverages existing `@EnableMethodSecurity` in `SecurityConfig` — no config changes needed
- REVIEWER JWT → Spring Security throws `AccessDeniedException` → `GlobalExceptionHandler.handleAccessDenied()` → HTTP 403 RFC 7807 body
- ADMIN JWT → `ResponseEntity.ok(Map.of("status", "ok", "timestamp", ...))` → HTTP 200
- Phase 1 Success Criterion 5 (FR-1.7) now demonstrable and satisfiable
- All existing tests continue to pass (no regressions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AdminController with @PreAuthorize-gated /api/admin/ping endpoint** - `ea7c94e` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified
- `backend/src/main/java/com/pcori/platform/domain/admin/AdminController.java` - `GET /api/admin/ping` with `@PreAuthorize("hasRole('ADMIN')")`, returns `{"status":"ok","timestamp":"..."}` for ADMIN role; 403 RFC 7807 for REVIEWER role via GlobalExceptionHandler

## Decisions Made
- **`@PreAuthorize` over `@Secured`/`@RolesAllowed`** — `@EnableMethodSecurity` is already declared in `SecurityConfig`; `@PreAuthorize` is the idiomatic choice that pairs with it. `@Secured` and `@RolesAllowed` require additional configuration flags.
- **`ResponseEntity<Map<String, Object>>`** — No custom DTO warranted for a ping/health endpoint. `Map.of("status", "ok", "timestamp", ...)` is sufficient and avoids unnecessary class creation.
- **No REVIEWER-accessible equivalent** — The explicit purpose is to prove the RBAC gate. An admin-accessible endpoint with no equivalent for REVIEWER is the minimal proof of FR-1.7.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. The RBAC infrastructure (`@EnableMethodSecurity`, `User.getAuthorities()`, `GlobalExceptionHandler.handleAccessDenied()`) was fully in place from Plans 04–05. Adding `AdminController.java` with `@PreAuthorize("hasRole('ADMIN')")` required no configuration changes and no regressions.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Phase 1 SC-5 (FR-1.7) is now satisfiable: `GET /api/admin/ping` with ADMIN JWT returns 200; with REVIEWER JWT returns 403 RFC 7807
- `AdminController` serves as the scaffold for Phase 2 admin features (user management, pipeline control)
- All Phase 1 success criteria are now implemented

## Self-Check: PASSED

- `backend/src/main/java/com/pcori/platform/domain/admin/AdminController.java` — FOUND
- `ea7c94e` commit verified in git log

---
*Phase: 01-foundation*
*Completed: 2026-05-21*
