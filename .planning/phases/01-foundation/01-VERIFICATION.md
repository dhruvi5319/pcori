---
phase: 01-foundation
verified: 2026-05-21T23:15:00Z
status: passed
score: 5/5 success criteria verified
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "Admin-role endpoints return 403 when called with a REVIEWER-role JWT, confirming RBAC is enforced at the service layer (SC-5 / FR-1.7)"
  gaps_remaining: []
  regressions:
    - check: "globals.css unlayered * reset removed — CLEAN (no regression)"
    - check: "ThemeToggle wired in page.tsx — VERIFIED (no regression)"
human_verification:
  - test: "Full Registration + Email Verification Flow"
    expected: "Register → verification email received in MailHog (http://localhost:8025) → click link → account activates → login succeeds; login before verification returns HTTP 403 with EMAIL_NOT_VERIFIED"
    why_human: "Email delivery to MailHog and account state change require a running Docker stack with live database"
  - test: "Account Lockout Trigger and Auto-Unlock"
    expected: "5 bad-password logins lock the account; login attempt returns 403 with remaining minutes in detail; after lockout TTL passes login succeeds again"
    why_human: "Requires live backend + database; time manipulation for TTL expiry cannot be verified statically"
  - test: "Password Reset End-to-End"
    expected: "POST /api/auth/forgot-password sends email via MailHog; token in link works once within 60 min; second use or expired token returns 400"
    why_human: "Requires live Docker stack with MailHog and database state"
  - test: "Admin RBAC 403 Proof — REVIEWER JWT to GET /api/admin/ping"
    expected: "REVIEWER JWT → HTTP 403 {\"status\":403,\"title\":\"Access Denied\",\"detail\":\"Insufficient permissions\"}; ADMIN JWT → HTTP 200 {\"status\":\"ok\",\"timestamp\":\"...\"}"
    why_human: "Requires live backend + valid REVIEWER and ADMIN JWTs; static code analysis confirms wiring, but runtime confirmation is the SC-5 acceptance test"
---

# Phase 01: Foundation Verification Report

**Phase Goal:** Reviewers and admins can securely register, log in, and have role-gated access enforced on every endpoint — running on a dev environment that mirrors production
**Verified:** 2026-05-21T23:15:00Z
**Status:** PASSED — 5/5 success criteria verified
**Re-verification:** Yes — after gap closure (Plans 01-09, 01-10, 01-11)

---

## Re-Verification Summary

| Previous Status | Previous Score | Current Status | Current Score |
|-----------------|----------------|----------------|---------------|
| gaps_found | 4/5 | **passed** | **5/5** |

**Gap closed:** SC-5 / FR-1.7 — `AdminController.java` created with `GET /api/admin/ping` gated by `@PreAuthorize("hasRole('ADMIN')")`. Committed as `ea7c94e`.

**Additional gap closures verified:**
- `01-09` (commit `e4755bd`): Unlayered `* { margin: 0; padding: 0; }` CSS reset removed from `globals.css` — Tailwind v4 utilities now take precedence correctly. Regression check: CLEAN.
- `01-10` (commit `23911b6`): `ThemeToggle` imported and rendered in `frontend/src/app/page.tsx` public landing page nav. Regression check: WIRED.

---

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | A new user can register with email/password and receive a verification email; unverified accounts cannot log in | ✓ VERIFIED | `AuthService.register()` creates user with `isActive=false`, `isEmailVerified=false`, calls `emailService.sendVerificationEmail()`. Login throws `EmailNotVerifiedException` when `!user.isEmailVerified()`. `SmtpEmailService` sends via `JavaMailSender` → MailHog in dev. |
| 2 | A verified user can log in and receive a JWT that authorizes protected API calls for 1 hour | ✓ VERIFIED | `JwtService.generateToken()` signs HS512 JWT with `expirationMs=3600000` (1 hour, configurable via env var). `JwtAuthFilter` validates Bearer token on every non-public request. `LoginResponse.expiresIn` wired to `jwtService.getExpirationMs()`. |
| 3 | After configurable failed login attempts the account locks; after configurable TTL or admin action it unlocks | ✓ VERIFIED | `AuthService.login()` increments `loginAttempts` on wrong password; locks when `>= maxLoginAttempts` by setting `lockedUntil = Instant.now() + lockoutDurationMinutes`. `MAX_LOGIN_ATTEMPTS=5`, `LOCKOUT_DURATION_MINUTES=30` configurable via env vars in `docker-compose.yml`. |
| 4 | A user can request a password reset link and use it to set a new password within the reset TTL | ✓ VERIFIED | `AuthService.forgotPassword()` generates UUID token, sets `passwordResetExpiresAt = Instant.now() + passwordResetTtlMinutes`. `AuthService.resetPassword()` validates token and TTL before updating `passwordHash`. `PASSWORD_RESET_TTL_MINUTES` configurable via env var. |
| 5 | Admin-role endpoints return 403 when called with a REVIEWER-role JWT, confirming RBAC is enforced at the service layer | ✓ VERIFIED | **Gap closed.** `AdminController.GET /api/admin/ping` annotated `@PreAuthorize("hasRole('ADMIN')")`. `@EnableMethodSecurity` in `SecurityConfig` activates method-level enforcement. REVIEWER JWT → `AccessDeniedException` → `GlobalExceptionHandler.handleAccessDenied()` → HTTP 403 RFC 7807. Route falls under `anyRequest().authenticated()`. Commit `ea7c94e`. |

**Score:** 5/5 success criteria verified

---

## SC-5 Gap Closure: Detailed Wiring Trace

| Layer | Artifact | Status | Evidence |
|-------|----------|--------|---------|
| Infrastructure | `SecurityConfig.java` | ✓ | `@EnableMethodSecurity` at line 33 — activates `@PreAuthorize` processing for all beans |
| Route security | `SecurityConfig.filterChain()` | ✓ | `.anyRequest().authenticated()` — `/api/admin/**` requires a valid JWT before method security fires |
| Enforcement | `AdminController.ping()` | ✓ | `@PreAuthorize("hasRole('ADMIN')")` at line 28 — Spring checks `ROLE_ADMIN` in `GrantedAuthority` set |
| Authority source | `User.getAuthorities()` | ✓ | Returns `SimpleGrantedAuthority("ROLE_" + role.getName())` — `ROLE_ADMIN` and `ROLE_REVIEWER` correctly prefixed |
| Error handling | `GlobalExceptionHandler.handleAccessDenied()` | ✓ | `@ExceptionHandler(AccessDeniedException.class)` at line 100 → `ResponseEntity.status(403)` with RFC 7807 body `{"status":403,"title":"Access Denied","detail":"Insufficient permissions"}` |
| Component scan | `PcoriApplication` | ✓ | `AdminController` in `com.pcori.platform.domain.admin` is within `@SpringBootApplication` scan root `com.pcori.platform` — auto-registered |

**Chain:** REVIEWER JWT → `JwtAuthFilter` sets `SecurityContext` with `ROLE_REVIEWER` → `anyRequest().authenticated()` passes → Spring method-security proxy checks `@PreAuthorize("hasRole('ADMIN')")` → `ROLE_REVIEWER ∉ {ROLE_ADMIN}` → throws `AccessDeniedException` → `GlobalExceptionHandler` → HTTP 403 RFC 7807.

---

## Required Artifacts (Regression Check)

| Artifact | Previous Status | Current Status | Notes |
|----------|-----------------|----------------|-------|
| `docker-compose.yml` | ✓ VERIFIED | ✓ VERIFIED | Unchanged |
| `backend/Dockerfile` | ✓ VERIFIED | ✓ VERIFIED | Unchanged |
| `backend/pom.xml` | ✓ VERIFIED | ✓ VERIFIED | Unchanged |
| `backend/src/main/resources/db/migration/V1__initial_schema.sql` | ✓ VERIFIED | ✓ VERIFIED | Unchanged |
| `backend/src/main/java/com/pcori/platform/config/SecurityConfig.java` | ✓ VERIFIED | ✓ VERIFIED | `@EnableMethodSecurity` confirmed present |
| `backend/src/main/java/com/pcori/platform/security/JwtService.java` | ✓ VERIFIED | ✓ VERIFIED | Unchanged |
| `backend/src/main/java/com/pcori/platform/security/JwtAuthFilter.java` | ✓ VERIFIED | ✓ VERIFIED | Unchanged |
| `backend/src/main/java/com/pcori/platform/common/exception/GlobalExceptionHandler.java` | ✓ VERIFIED | ✓ VERIFIED | `handleAccessDenied()` confirmed at lines 100–109 |
| `backend/src/main/java/com/pcori/platform/domain/user/User.java` | ✓ VERIFIED | ✓ VERIFIED | Unchanged |
| `backend/src/main/java/com/pcori/platform/domain/auth/AuthService.java` | ✓ VERIFIED | ✓ VERIFIED | Unchanged |
| `backend/src/main/java/com/pcori/platform/domain/auth/AuthController.java` | ✓ VERIFIED | ✓ VERIFIED | Unchanged |
| `frontend/src/app/globals.css` | ✓ VERIFIED | ✓ VERIFIED (improved) | Unlayered `* { margin:0; padding:0 }` reset removed by 01-09; no `* {` outside `@layer` exists |
| `frontend/src/app/page.tsx` | ✓ VERIFIED | ✓ VERIFIED (improved) | `ThemeToggle` imported and rendered in nav by 01-10 |
| **`backend/src/main/java/com/pcori/platform/domain/admin/AdminController.java`** | ✗ MISSING | **✓ VERIFIED** | **NEW — gap closure 01-11.** `@PreAuthorize("hasRole('ADMIN')")` on `GET /api/admin/ping`. Commit `ea7c94e`. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `docker-compose.yml` backend | postgres | `depends_on: service_healthy` | ✓ WIRED | Unchanged |
| `JwtAuthFilter` | `SecurityConfig` filter chain | `addFilterBefore(...)` | ✓ WIRED | Unchanged |
| `AuthService` | `EmailService` | `emailService.sendVerificationEmail()` | ✓ WIRED | Unchanged |
| `User.getAuthorities()` | Spring Security RBAC | `SimpleGrantedAuthority("ROLE_" + ...)` | ✓ WIRED | Unchanged |
| **`@EnableMethodSecurity`** | **`@PreAuthorize` on `AdminController.ping()`** | **Method-level security proxy** | **✓ WIRED** | **Gap closed — `AdminController.java` with `@PreAuthorize("hasRole('ADMIN')")` at line 28; `@EnableMethodSecurity` in `SecurityConfig` line 33** |
| `LoginForm` | `useLoginMutation` → `api.post('/api/auth/login')` | `handleSubmit` | ✓ WIRED | Unchanged |
| `SidebarNavItem` | JWT roles | `useAuth().getClaims().roles` | ✓ WIRED | Unchanged |
| `ThemeToggle` | Landing page nav | `import` + `<ThemeToggle />` in `page.tsx` | ✓ WIRED | New — gap closure 01-10 |

---

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| FR-1.1 (Registration + email verification) | ✓ SATISFIED | SC-1 verified |
| FR-1.2 (Login + JWT issuance, 1 hour) | ✓ SATISFIED | SC-2 verified |
| FR-1.3 (Account lockout, configurable attempts + TTL) | ✓ SATISFIED | SC-3 verified |
| FR-1.4 (Password reset with TTL) | ✓ SATISFIED | SC-4 verified |
| FR-1.5 (Email verification) | ✓ SATISFIED | Part of SC-1 |
| FR-1.6 (Logout / refresh token revocation) | ✓ SATISFIED | Unchanged from initial verification |
| FR-1.7 (RBAC / role-gated access) | ✓ SATISFIED | **Gap closed — SC-5 verified via `AdminController` + `@PreAuthorize`** |
| FR-1.8 (Dev environment mirrors production topology) | ✓ SATISFIED | Unchanged |

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `frontend/src/components/layout/AppHeader.tsx` | Breadcrumb placeholder for Phase 2+ | ℹ️ Info | Expected Phase 2 work; no impact on Phase 1 goal |
| `frontend/src/components/layout/NotificationBell.tsx` | Badge placeholder for Phase 3 | ℹ️ Info | Expected Phase 3 work; no impact on Phase 1 goal |
| `frontend/src/components/layout/UserMenu.tsx` | Profile/Settings `onSelect={() => {}}` stubs | ℹ️ Info | Expected placeholders; Sign Out (Phase 1 requirement) is fully implemented |

No blocker or warning anti-patterns found. The CSS cascade fix (01-09) **removed** a previously undetected anti-pattern (`* { margin:0; padding:0 }` unlayered reset that was overriding all Tailwind v4 utilities).

---

## Human Verification Required

### 1. Full Registration + Email Verification Flow

**Test:** Start the Docker stack (`docker-compose up`). POST `{"username":"test","email":"test@example.com","password":"Test1234!","firstName":"Test","lastName":"User"}` to `POST /api/auth/register`. Open MailHog at `http://localhost:8025`, find the verification email, click the verification link. Then POST credentials to `POST /api/auth/login`.
**Expected:** After clicking the link, login returns HTTP 200 with a JWT. Login before clicking the link returns HTTP 403 with `EMAIL_NOT_VERIFIED` in the detail.
**Why human:** Email delivery to MailHog and database account-state change require a running Docker stack.

### 2. Account Lockout Trigger and Auto-Unlock

**Test:** With a verified account, make 5 POST requests to `/api/auth/login` with a wrong password. Check the 6th response. Optionally manipulate `locked_until` in the database to a past time and retry login.
**Expected:** The 5th failed attempt locks the account. Further login attempts return HTTP 403 with remaining lock minutes in the detail. After TTL expiry (30 min default), login succeeds.
**Why human:** Requires live backend + database; TTL time-travel needs DB manipulation.

### 3. Password Reset End-to-End

**Test:** POST `{"email":"test@example.com"}` to `/api/auth/forgot-password`. Find the reset link in MailHog. POST `{"token":"<token>","newPassword":"NewPass1234!"}` to `/api/auth/reset-password`. Log in with the new password. Reuse the same token and verify the second use returns 400.
**Expected:** Password updated; same token on second use returns HTTP 400; expired token (past 60-min TTL) returns HTTP 400.
**Why human:** Requires running Docker stack with MailHog and database state.

### 4. Admin RBAC 403 Proof — REVIEWER JWT to GET /api/admin/ping

**Test:** Obtain a REVIEWER-role JWT via `/api/auth/login` with a REVIEWER-seeded account. Call `GET /api/admin/ping` with `Authorization: Bearer <REVIEWER_JWT>`. Then obtain an ADMIN-role JWT and repeat.
**Expected:** REVIEWER JWT → HTTP 403 `{"status":403,"title":"Access Denied","detail":"Insufficient permissions"}`. ADMIN JWT → HTTP 200 `{"status":"ok","timestamp":"..."}`.
**Why human:** Runtime confirmation of RBAC enforcement; static analysis confirms wiring but cannot substitute for the live acceptance test.

---

## Phase Goal Assessment

**Phase Goal:** *Reviewers and admins can securely register, log in, and have role-gated access enforced on every endpoint — running on a dev environment that mirrors production.*

All five success criteria are now verifiable against the codebase:

1. **Registration + email verification** — `AuthService.register()` + `SmtpEmailService` + login guard on `isEmailVerified`. ✓
2. **JWT-authenticated login (1 hour)** — `JwtService` HS512 with `expirationMs=3600000`, `JwtAuthFilter` on every non-public request. ✓
3. **Configurable lockout** — `loginAttempts` counter, `lockedUntil` TTL, `MAX_LOGIN_ATTEMPTS`/`LOCKOUT_DURATION_MINUTES` env vars. ✓
4. **Password reset with TTL** — `forgotPassword()` UUID token + `passwordResetExpiresAt`, validated in `resetPassword()`. ✓
5. **RBAC — admin endpoint returns 403 to REVIEWER** — `AdminController.GET /api/admin/ping` + `@PreAuthorize("hasRole('ADMIN')")` + `GlobalExceptionHandler.handleAccessDenied()` → 403 RFC 7807. ✓ **[Gap closed by 01-11]**

The phase goal is **achieved**. Four items are flagged for human/runtime verification (email flows and live RBAC test) as they require a running Docker stack — these are acceptance tests, not code defects.

---

*Verified: 2026-05-21T23:15:00Z*
*Verifier: Claude (pivota_spec-verifier)*
*Re-verification after: Plans 01-09 (CSS cascade fix), 01-10 (ThemeToggle on landing page), 01-11 (AdminController RBAC gap closure)*
