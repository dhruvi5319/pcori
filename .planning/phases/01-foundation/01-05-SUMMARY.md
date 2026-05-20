---
phase: 01-foundation
plan: 05
subsystem: auth
tags: [jpa, hibernate, spring-security, jwt, email, smtp, mailhog, rbac, user-entity, flyway]

# Dependency graph
requires:
  - phase: 01-04
    provides: JwtService, SecurityConfig, GlobalExceptionHandler, DomainExceptions, AuditableEntity
  - phase: 01-03
    provides: Flyway V1 DDL (users/roles/permissions tables), V2 seed roles/permissions
provides:
  - User/Role/Permission/RefreshToken JPA entities mapped to V1 DDL tables
  - UserRepository, RoleRepository, RefreshTokenRepository
  - AuthService: register(), login(), logout(), forgotPassword(), resetPassword(), verifyEmail(), refreshToken()
  - AuthController: POST /api/auth/{register,login,logout,refresh,forgot-password,reset-password}, GET /api/auth/verify-email
  - EmailService interface + SmtpEmailService (async MailHog SMTP delivery)
  - UserDetailsServiceImpl (real implementation using UserRepository)
  - V3 migration: adds created_by/last_modified_by audit columns to users table
affects:
  - 01-06 (frontend auth UI — can now hit real /api/auth/* endpoints)
  - All subsequent phases requiring authenticated users or RBAC

# Tech tracking
tech-stack:
  added: []
  patterns:
    - JPA @SQLRestriction("deleted_at IS NULL") for soft-delete filtering on User and Role entities
    - @Transactional(noRollbackFor = BadCredentialsException.class) to persist login_attempts on failed auth
    - Async @Async email sending via SmtpEmailService to avoid blocking HTTP response
    - Builder pattern for all JPA entities with @Builder.Default for boolean fields (isActive, isEmailVerified)
    - UserDetails implementation directly on User entity (avoids adapter class)

key-files:
  created:
    - backend/src/main/java/com/pcori/platform/domain/user/User.java
    - backend/src/main/java/com/pcori/platform/domain/user/Role.java
    - backend/src/main/java/com/pcori/platform/domain/user/Permission.java
    - backend/src/main/java/com/pcori/platform/domain/user/RefreshToken.java
    - backend/src/main/java/com/pcori/platform/domain/user/UserRepository.java
    - backend/src/main/java/com/pcori/platform/domain/user/RoleRepository.java
    - backend/src/main/java/com/pcori/platform/domain/user/RefreshTokenRepository.java
    - backend/src/main/java/com/pcori/platform/domain/user/dto/RegisterRequest.java
    - backend/src/main/java/com/pcori/platform/domain/user/dto/LoginRequest.java
    - backend/src/main/java/com/pcori/platform/domain/user/dto/LoginResponse.java
    - backend/src/main/java/com/pcori/platform/domain/auth/AuthController.java
    - backend/src/main/java/com/pcori/platform/domain/auth/AuthService.java
    - backend/src/main/java/com/pcori/platform/domain/auth/dto/ForgotPasswordRequest.java
    - backend/src/main/java/com/pcori/platform/domain/auth/dto/ResetPasswordRequest.java
    - backend/src/main/java/com/pcori/platform/domain/auth/dto/UserRegisteredResponse.java
    - backend/src/main/java/com/pcori/platform/domain/auth/dto/RefreshRequest.java
    - backend/src/main/java/com/pcori/platform/integration/email/EmailService.java
    - backend/src/main/java/com/pcori/platform/integration/email/SmtpEmailService.java
    - backend/src/main/resources/db/migration/V3__add_audit_columns.sql
  modified:
    - backend/src/main/java/com/pcori/platform/security/UserDetailsServiceImpl.java

key-decisions:
  - "@Transactional(noRollbackFor = BadCredentialsException.class) required — without it, Spring rolls back login_attempts increment on exception, breaking FR-1.3 lockout"
  - "V3 migration adds created_by/last_modified_by to users table — AuditableEntity @MappedSuperclass mapped these columns but V1 DDL omitted them"
  - "User entity directly implements UserDetails — avoids adapter object creation on every authentication request"

patterns-established:
  - "Auth endpoints under /api/auth/** are permitAll in SecurityConfig — no JWT required for register/login/verify"
  - "EmailService is async (@Async) — registration HTTP response does not wait for SMTP delivery"
  - "FR-1.4 forgot-password always returns 200 — never leaks existence of email in the system"

# Metrics
duration: 11min
completed: 2026-05-20
---

# Phase 1 Plan 05: Auth Domain Summary

**Complete JWT auth domain: User/Role/Permission JPA entities, AuthService with all 6 FR-1.x business rules, AuthController exposing 7 /api/auth/* endpoints, and MailHog-backed async email service — verified end-to-end**

## Performance

- **Duration:** 11 min
- **Started:** 2026-05-20T18:38:34Z
- **Completed:** 2026-05-20T18:49:52Z
- **Tasks:** 2
- **Files modified:** 20

## Accomplishments
- Complete JPA entity layer: User (implements UserDetails, @SQLRestriction soft-delete), Role, Permission, RefreshToken — all column names verified against V1 DDL
- Full auth business logic: register (FR-1.1), login+lockout (FR-1.2/1.3), forgot/reset password (FR-1.4), email verification (FR-1.5), logout (FR-1.6)
- AuthController: thin HTTP boundary with 7 endpoints, zero business logic
- SmtpEmailService sends verification and password-reset emails via MailHog SMTP (async)
- UserDetailsServiceImpl stub replaced with real DB-backed implementation
- All success criteria verified: 201 register, 409 duplicates, 403 lockout after 5 fails, 200 verify-email, MailHog delivery confirmed

## Task Commits

Each task was committed atomically:

1. **Task 1: User/Role/Permission/RefreshToken entities, repositories, DTOs** - `36cb25e` (feat)
2. **Task 2: AuthService, AuthController, EmailService — all FR-1.x endpoints** - `e05730c` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified
- `backend/src/main/java/com/pcori/platform/domain/user/User.java` - JPA entity @Table(users); implements UserDetails; @SQLRestriction(deleted_at IS NULL); all V1 DDL columns
- `backend/src/main/java/com/pcori/platform/domain/user/Role.java` - JPA entity @Table(roles); @SQLRestriction; ManyToMany permissions
- `backend/src/main/java/com/pcori/platform/domain/user/Permission.java` - JPA entity @Table(permissions)
- `backend/src/main/java/com/pcori/platform/domain/user/RefreshToken.java` - JPA entity @Table(refresh_tokens); isExpired() helper
- `backend/src/main/java/com/pcori/platform/domain/user/UserRepository.java` - findByUsername, findByEmail, findByEmailVerificationToken, findByPasswordResetToken, existsBy...
- `backend/src/main/java/com/pcori/platform/domain/user/RoleRepository.java` - findByName
- `backend/src/main/java/com/pcori/platform/domain/user/RefreshTokenRepository.java` - findByTokenAndRevokedFalse; @Modifying revokeAllUserTokens
- `backend/src/main/java/com/pcori/platform/domain/user/dto/RegisterRequest.java` - validation: username pattern, password complexity, email format
- `backend/src/main/java/com/pcori/platform/domain/user/dto/LoginRequest.java` - @NotBlank username + password
- `backend/src/main/java/com/pcori/platform/domain/user/dto/LoginResponse.java` - accessToken, refreshToken, expiresIn, UserSummary (id, username, email, roles)
- `backend/src/main/java/com/pcori/platform/domain/auth/AuthController.java` - 7 endpoints under /api/auth/**
- `backend/src/main/java/com/pcori/platform/domain/auth/AuthService.java` - all FR-1.x business logic; @Transactional(noRollbackFor)
- `backend/src/main/java/com/pcori/platform/domain/auth/dto/ForgotPasswordRequest.java` - @Email validation
- `backend/src/main/java/com/pcori/platform/domain/auth/dto/ResetPasswordRequest.java` - token + password complexity
- `backend/src/main/java/com/pcori/platform/domain/auth/dto/UserRegisteredResponse.java` - {id, username, email, firstName, lastName, createdAt}
- `backend/src/main/java/com/pcori/platform/domain/auth/dto/RefreshRequest.java` - @NotBlank refreshToken
- `backend/src/main/java/com/pcori/platform/integration/email/EmailService.java` - interface: sendVerificationEmail, sendPasswordResetEmail
- `backend/src/main/java/com/pcori/platform/integration/email/SmtpEmailService.java` - @Async JavaMailSender implementation
- `backend/src/main/resources/db/migration/V3__add_audit_columns.sql` - ALTER TABLE users ADD COLUMN created_by, last_modified_by
- `backend/src/main/java/com/pcori/platform/security/UserDetailsServiceImpl.java` - replaced stub with UserRepository.findByUsername

## Decisions Made
- **@Transactional(noRollbackFor)** — Spring rolls back the entire @Transactional method when an exception is thrown. For FR-1.3, the `login_attempts` increment must persist even when `BadCredentialsException` is thrown. Added `noRollbackFor` for all auth-related exceptions to ensure failed attempt counts write to DB.
- **V3 migration for audit columns** — The `AuditableEntity` @MappedSuperclass maps `created_by` and `last_modified_by` but V1 DDL omitted these (common oversight). Added V3 migration with `IF NOT EXISTS` guard for idempotency. Flyway applies cleanly on next startup.
- **Direct UserDetails on User entity** — User implements UserDetails directly rather than using a separate UserDetailsAdapter class, reducing object allocation on every JWT validation request.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing created_by/last_modified_by columns on users table**
- **Found during:** Task 1 verification (JPA startup with ddl-auto=validate)
- **Issue:** AuditableEntity @MappedSuperclass maps `created_by` and `last_modified_by` columns, but V1 DDL only has `created_at` and `updated_at`. Hibernate validation failed at startup: "Schema-validation: missing column [created_by] in table [users]"
- **Fix:** Added V3__add_audit_columns.sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(255), last_modified_by VARCHAR(255)`
- **Files modified:** `backend/src/main/resources/db/migration/V3__add_audit_columns.sql` (new)
- **Verification:** Application starts with `{"status":"UP"}` — ddl-auto=validate passes
- **Committed in:** `36cb25e` (Task 1 commit)

**2. [Rule 1 - Bug] login_attempts not persisting on failed auth — transaction rollback**
- **Found during:** Task 2 verification (FR-1.3 lockout test)
- **Issue:** `AuthService` has `@Transactional`. When `BadCredentialsException` is thrown (wrong password), Spring rolls back the entire transaction, reverting the `login_attempts` increment and `lockedUntil` update. Result: FR-1.3 lockout never triggers regardless of failed attempts.
- **Fix:** Changed `@Transactional` to `@Transactional(noRollbackFor = {BadCredentialsException.class, AccountLockedException.class, EmailNotVerifiedException.class, AccountInactiveException.class})` on AuthService class.
- **Files modified:** `backend/src/main/java/com/pcori/platform/domain/auth/AuthService.java`
- **Verification:** DB shows login_attempts=5 and locked_until set after 5 wrong attempts; 6th attempt (correct password) returns 403 ACCOUNT_LOCKED
- **Committed in:** `e05730c` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both essential for correctness. The noRollbackFor fix is critical for FR-1.3 to function at all. The V3 migration fix is required for JPA startup validation to pass.

## Issues Encountered
None beyond the two auto-fixed deviations above. All endpoints verified functional against running backend.

## User Setup Required
None — no external service configuration required. MailHog SMTP covered by Docker Compose (localhost:8025).

## Next Phase Readiness
- **Plan 06 (Frontend auth UI):** Ready — all /api/auth/* endpoints functional; register (201), login (200 + JWT), verify-email (200), forgot-password (200), login lockout (403)
- **JWT authentication:** Any protected endpoint automatically requires Bearer token; REVIEWER role assigned to all self-registered users
- **Email flow:** MailHog captures all emails at localhost:8025 for dev inspection

## Self-Check: PASSED

All 20 key files verified present on disk. Both plan commits (36cb25e, e05730c) confirmed in git log.

---
*Phase: 01-foundation*
*Completed: 2026-05-20*
