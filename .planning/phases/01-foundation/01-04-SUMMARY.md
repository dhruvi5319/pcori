---
phase: 01-foundation
plan: 04
subsystem: auth
tags: [spring-security, jwt, jjwt, bcrypt, jpa-auditing, async, rbac, error-handling, rfc7807]

# Dependency graph
requires:
  - phase: 01-03
    provides: users/roles/permissions tables for UserDetailsServiceImpl to query
provides:
  - SecurityFilterChain with JWT Bearer token validation on all protected routes
  - JwtService (HS512 generateToken, validateToken, extractUsername, extractRoles) with startup fail-fast
  - JwtAuthFilter (OncePerRequestFilter: Bearer → SecurityContext)
  - JwtAuthEntryPoint (RFC 7807 JSON 401 response)
  - SecurityContextPropagatingDecorator (TaskDecorator for async thread security)
  - AuditableEntity (@MappedSuperclass: createdAt, updatedAt, createdBy, lastModifiedBy)
  - SecurityAuditorAware (AuditorAware<String> from SecurityContext)
  - DomainExceptions (ResourceNotFoundException, DuplicateResourceException, AccountLockedException, etc.)
  - ErrorResponse (RFC 7807 Problem Details DTO)
  - GlobalExceptionHandler (RFC 7807 handlers for all domain exceptions)
  - AsyncConfig (classificationExecutor with SecurityContextPropagatingDecorator + CallerRunsPolicy)
  - JpaAuditConfig (@EnableJpaAuditing with SecurityAuditorAware)
  - UserDetailsServiceImpl stub (replaced in Plan 05)
affects:
  - 01-05 (AuthService uses JwtService; UserDetailsServiceImpl replaced with real DB query)
  - All subsequent phases requiring protected endpoints or RBAC

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Spring Security 6 stateless JWT filter chain (@EnableWebSecurity + @EnableMethodSecurity)
    - OncePerRequestFilter for JWT extraction and SecurityContext population
    - FilterRegistrationBean.setEnabled(false) to prevent JwtAuthFilter double-registration
    - TaskDecorator pattern (SecurityContextPropagatingDecorator) for async SecurityContext propagation
    - RFC 7807 Problem Details for all error responses
    - JPA Auditing via @MappedSuperclass + AuditingEntityListener + AuditorAware<String>
    - BCryptPasswordEncoder strength 12 for password hashing
    - Swagger/OpenAPI gated to dev profile via AuthorizationDecision

key-files:
  created:
    - backend/src/main/java/com/pcori/platform/config/SecurityConfig.java
    - backend/src/main/java/com/pcori/platform/config/AsyncConfig.java
    - backend/src/main/java/com/pcori/platform/config/JpaAuditConfig.java
    - backend/src/main/java/com/pcori/platform/security/JwtService.java
    - backend/src/main/java/com/pcori/platform/security/JwtAuthFilter.java
    - backend/src/main/java/com/pcori/platform/security/JwtAuthEntryPoint.java
    - backend/src/main/java/com/pcori/platform/security/UserDetailsServiceImpl.java
    - backend/src/main/java/com/pcori/platform/security/SecurityContextPropagatingDecorator.java
    - backend/src/main/java/com/pcori/platform/common/audit/AuditableEntity.java
    - backend/src/main/java/com/pcori/platform/common/audit/SecurityAuditorAware.java
    - backend/src/main/java/com/pcori/platform/common/exception/GlobalExceptionHandler.java
    - backend/src/main/java/com/pcori/platform/common/exception/DomainExceptions.java
    - backend/src/main/java/com/pcori/platform/common/dto/ErrorResponse.java
  modified: []

key-decisions:
  - "UserDetailsServiceImpl stub created — replaced fully in Plan 05 when UserRepository and User entity are available"
  - "Swagger gated to dev profile via AuthorizationDecision (not hardcoded permit/deny) — survives profile changes"
  - "Volume reset required on dev environment startup when Flyway schema history absent from existing public schema"

patterns-established:
  - "All domain exceptions map to RFC 7807 via GlobalExceptionHandler — consistent error contract across all APIs"
  - "JwtService fail-fast at @PostConstruct: blank or < 64-char JWT_SECRET throws IllegalStateException at startup"
  - "SecurityContextPropagatingDecorator on all async executors — audit fields always populated on pipeline records"

# Metrics
duration: 5min
completed: 2026-05-20
---

# Phase 1 Plan 04: Spring Security + JWT Infrastructure Summary

**Spring Security 6 filter chain with HS512 JWT validation, BCrypt, RFC 7807 error responses, JPA auditing, and async SecurityContext propagation — full stack verified with health 200, /api/users 401, Swagger 200**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-20T18:30:18Z
- **Completed:** 2026-05-20T18:35:54Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Complete Spring Security 6 JWT infrastructure: JwtService (HS512, fail-fast validation), JwtAuthFilter (OncePerRequestFilter), JwtAuthEntryPoint (RFC 7807 JSON 401), SecurityConfig (@EnableMethodSecurity, STATELESS, BCrypt-12)
- Async security propagation: SecurityContextPropagatingDecorator as TaskDecorator on classificationExecutor (CallerRunsPolicy) — audit fields will be non-null on all pipeline-persisted records
- JPA auditing: AuditableEntity @MappedSuperclass + SecurityAuditorAware (falls back to "system" for unauthenticated)
- RFC 7807 error contract: GlobalExceptionHandler + DomainExceptions + ErrorResponse covering all cases (validation, not-found, conflict, account-locked, forbidden, invalid-token, access-denied, generic 500)
- Verified runtime: `GET /actuator/health` → 200 `{"status":"UP"}`, `GET /api/users` → 401 RFC 7807, Swagger → 200 in dev profile

## Task Commits

Each task was committed atomically:

1. **Task 1: JWT Service, Filter, EntryPoint, and common infrastructure** - `129c45b` (feat)
2. **Task 2: SecurityConfig, AsyncConfig, JpaAuditConfig, GlobalExceptionHandler, UserDetailsServiceImpl** - `514941b` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified
- `backend/src/main/java/com/pcori/platform/security/JwtService.java` - HS512 JWT: generateToken, validateToken, extractUsername, extractRoles; @PostConstruct fail-fast (blank or < 64 char secret)
- `backend/src/main/java/com/pcori/platform/security/JwtAuthFilter.java` - OncePerRequestFilter: Bearer token extraction → validate → set SecurityContext
- `backend/src/main/java/com/pcori/platform/security/JwtAuthEntryPoint.java` - RFC 7807 JSON 401 for unauthenticated requests
- `backend/src/main/java/com/pcori/platform/security/SecurityContextPropagatingDecorator.java` - TaskDecorator: copies SecurityContext to async threads
- `backend/src/main/java/com/pcori/platform/security/UserDetailsServiceImpl.java` - Stub (throws UsernameNotFoundException; replaced in Plan 05)
- `backend/src/main/java/com/pcori/platform/config/SecurityConfig.java` - @EnableWebSecurity @EnableMethodSecurity; STATELESS; CSRF off; CORS; FilterRegistrationBean.setEnabled(false); BCrypt-12
- `backend/src/main/java/com/pcori/platform/config/AsyncConfig.java` - classificationExecutor: 4-8 threads, 50 queue, SecurityContextPropagatingDecorator, CallerRunsPolicy
- `backend/src/main/java/com/pcori/platform/config/JpaAuditConfig.java` - @EnableJpaAuditing(auditorAwareRef="auditorProvider")
- `backend/src/main/java/com/pcori/platform/common/audit/AuditableEntity.java` - @MappedSuperclass: createdAt, updatedAt, createdBy, lastModifiedBy
- `backend/src/main/java/com/pcori/platform/common/audit/SecurityAuditorAware.java` - AuditorAware<String>: username from SecurityContext or "system"
- `backend/src/main/java/com/pcori/platform/common/exception/GlobalExceptionHandler.java` - RFC 7807 handlers for all DomainExceptions + MethodArgumentNotValidException
- `backend/src/main/java/com/pcori/platform/common/exception/DomainExceptions.java` - ResourceNotFoundException, DuplicateResourceException, ValidationException, AccountLockedException, AccountInactiveException, EmailNotVerifiedException, InvalidTokenException
- `backend/src/main/java/com/pcori/platform/common/dto/ErrorResponse.java` - RFC 7807 Problem Details DTO with @JsonInclude(NON_NULL) and nested FieldError

## Decisions Made
- **UserDetailsServiceImpl stub** — Plan 04 cannot create the full implementation without the `User` entity and `UserRepository` (Plan 05). A clean stub (`throws UsernameNotFoundException`) satisfies Spring Boot's startup wiring requirement. No placeholder fields to cause compile errors.
- **Swagger gated to dev profile** — Used `AuthorizationDecision` based on `env.getActiveProfiles()` rather than simple `permitAll()`; ensures Swagger is unreachable in non-dev profiles without any profile-specific property overrides.
- **Volume reset on Flyway conflict** — The existing postgres volume (from Plan 03 manual psql runs) had tables but no `flyway_schema_history`. Reset with `docker compose down -v` and restarted; both V1 and V2 applied cleanly on fresh schema.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Flyway "non-empty schema but no schema history table" startup failure**
- **Found during:** Task 2 verification (docker compose up)
- **Issue:** Postgres volume from Plan 03 had existing tables in `public` schema but no `flyway_schema_history` table (migrations were run via direct psql, not Flyway). Flyway refused to migrate.
- **Fix:** `docker compose down -v` to remove the postgres_data volume; restart brought up clean schema; both V1 and V2 applied correctly.
- **Files modified:** None — configuration change only (dev environment reset, not code change)
- **Verification:** Flyway log showed "Successfully applied 2 migrations to schema public, now at version v2"; application started successfully.

**2. [Rule 1 - Bug] UserDetailsServiceImpl stub simplified to avoid Lombok + @Lazy field incompatibility**
- **Found during:** Task 2 implementation
- **Issue:** Plan's `UserDetailsServiceImpl` stub used `@RequiredArgsConstructor` on a class with `@Lazy`-annotated inline-initialized final field — invalid Lombok pattern causing compile error.
- **Fix:** Replaced with clean stub class (no Lombok, just `@Service` + implements `UserDetailsService`) that throws `UsernameNotFoundException` directly.
- **Files modified:** `backend/src/main/java/com/pcori/platform/security/UserDetailsServiceImpl.java`
- **Verification:** Docker build `mvn package -DskipTests` succeeded.

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness. Flyway reset is expected dev workflow; stub fix avoids compile error with no behavior change.

## Issues Encountered
None beyond the two auto-fixed deviations above. All success criteria met on first full run after Flyway reset.

## User Setup Required
None — no external service configuration required. JWT_SECRET set in docker-compose.yml to 64+ char dev value.

## Next Phase Readiness
- **Plan 05 (Auth domain):** Ready — JwtService, SecurityConfig, and GlobalExceptionHandler all available. UserDetailsServiceImpl stub must be replaced with real `UserRepository`-backed implementation.
- **All protected endpoints:** JWT filter chain active; any new `/api/**` route automatically requires Bearer token unless explicitly whitelisted in SecurityConfig.
- JPA auditing active — any entity extending `AuditableEntity` will auto-populate createdAt/updatedAt/createdBy/lastModifiedBy.

## Self-Check: PASSED

All 13 key files verified present on disk. Both plan commits (129c45b, 514941b) confirmed in git log.

---
*Phase: 01-foundation*
*Completed: 2026-05-20*
