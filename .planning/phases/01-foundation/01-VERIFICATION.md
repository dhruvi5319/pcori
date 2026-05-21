---
phase: 01-foundation
verified: 2026-05-21T15:12:11Z
status: gaps_found
score: 4/5 success criteria verified
re_verification: false
gaps:
  - truth: "Admin-role endpoints return 403 when called with a REVIEWER-role JWT, confirming RBAC is enforced at the service layer"
    status: failed
    reason: "@EnableMethodSecurity is declared in SecurityConfig but no @PreAuthorize (or @Secured / @RolesAllowed) annotation exists on any controller or service method. There is only one controller (AuthController) and all routes under /api/auth/** are public. No admin-gated endpoint exists to verify the 403 behaviour."
    artifacts:
      - path: "backend/src/main/java/com/pcori/platform/config/SecurityConfig.java"
        issue: "@EnableMethodSecurity declared (enables infrastructure) but zero @PreAuthorize annotations exist anywhere in the codebase"
      - path: "backend/src/main/java/com/pcori/platform/domain/auth/AuthController.java"
        issue: "Only controller; all routes are under /api/auth/** (permitAll) — no admin-gated routes exist"
    missing:
      - "At least one endpoint annotated with @PreAuthorize(\"hasRole('ADMIN')\") (or equivalent) that returns 403 AccessDeniedException when called with a REVIEWER JWT"
      - "Suggested: add a minimal /api/admin/ping GET endpoint with @PreAuthorize(\"hasRole('ADMIN')\") to satisfy this success criterion now, and note it is a placeholder for Phase-2 admin features"

human_verification:
  - test: "Verify email flow end-to-end via MailHog"
    expected: "Register → verification email received in MailHog (http://localhost:8025) → click link → account activates → login succeeds"
    why_human: "Email delivery to MailHog and activation state change require a running Docker stack; cannot verify programmatically from static code"
  - test: "Unverified account login attempt returns 403 with correct error body"
    expected: "POST /api/auth/login with valid credentials for an unverified account returns HTTP 403 with detail containing EMAIL_NOT_VERIFIED"
    why_human: "Requires live backend + database with an unverified user record"
  - test: "Account lockout triggers after 5 failed attempts and auto-unlocks after 30 minutes"
    expected: "5 bad-password logins lock the account; login attempt returns 403 with detail showing remaining minutes; after lockout TTL passes login succeeds again"
    why_human: "Requires a live running backend with configurable time or a way to fast-forward the clock"
  - test: "Password reset link is received, valid only within 60-minute TTL, and invalidated after single use"
    expected: "POST /api/auth/forgot-password sends email via MailHog; token in link works once within 60 min; second use or expired token returns 400"
    why_human: "Requires live Docker stack with MailHog and database state"
---

# Phase 01: Foundation Verification Report

**Phase Goal:** Reviewers and admins can securely register, log in, and have role-gated access enforced on every endpoint — running on a dev environment that mirrors production
**Verified:** 2026-05-21T15:12:11Z
**Status:** gaps_found — 1 of 5 success criteria not achievable against current codebase
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | A new user can register with email/password and receive a verification email; unverified accounts cannot log in | ✓ VERIFIED | `AuthService.register()` creates user with `isActive=false`, `isEmailVerified=false`, and calls `emailService.sendVerificationEmail()`. Login explicitly throws `EmailNotVerifiedException` when `!user.isEmailVerified()`. `SmtpEmailService` sends real email via JavaMailSender. |
| 2 | A verified user can log in and receive a JWT that authorizes protected API calls for 1 hour | ✓ VERIFIED | `JwtService.generateToken()` signs HS512 JWT with `expirationMs=3600000` (1 hour) from env var. `JwtAuthFilter` validates Bearer token on every non-public request. `LoginResponse.expiresIn` wired to `jwtService.getExpirationMs()`. |
| 3 | After configurable failed login attempts the account locks; after configurable TTL or admin action it unlocks | ✓ VERIFIED | `AuthService.login()` increments `loginAttempts` on bad password; locks when `>= maxLoginAttempts`. Lock expires via TTL (`lockedUntil` Instant). `MAX_LOGIN_ATTEMPTS=5`, `LOCKOUT_DURATION_MINUTES=30` configurable via env vars in docker-compose.yml. ⚠️ Admin-action-unlock is not yet implemented — TTL-only unlock is present. |
| 4 | A user can request a password reset link and use it to set a new password within the reset TTL | ✓ VERIFIED | `AuthService.forgotPassword()` generates UUID token, sets `passwordResetExpiresAt`, sends email. `AuthService.resetPassword()` validates token and TTL before updating `passwordHash`. TTL configurable via `PASSWORD_RESET_TTL_MINUTES`. |
| 5 | Admin-role endpoints return 403 when called with a REVIEWER-role JWT, confirming RBAC is enforced at the service layer | ✗ FAILED | `@EnableMethodSecurity` is declared in `SecurityConfig` but no `@PreAuthorize` annotation exists anywhere. Only one controller (`AuthController`) with all-public `/api/auth/**` routes. No admin-gated endpoint exists to demonstrate or test the 403 behaviour. |

**Score:** 4/5 success criteria verified

---

## Required Artifacts

### Plan 01-01: Docker Compose + Spring Boot Scaffold

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `docker-compose.yml` | Dev stack: postgres, mailhog, backend | ✓ VERIFIED | All 3 services declared. postgres:16-alpine with healthcheck, mailhog:v1.0.1 on 1025/8025, backend depends_on postgres (service_healthy). JWT_SECRET, MAIL_HOST, lockout params all wired. |
| `backend/Dockerfile` | Multi-stage Java 21 build | ✓ VERIFIED | Stages: maven:3.9-eclipse-temurin-21 builder → eclipse-temurin:21-jre-alpine runtime. EXPOSE 8080. |
| `backend/pom.xml` | All Phase 1 Maven dependencies | ✓ VERIFIED | spring-boot-starter-parent 3.4.5, spring-security, spring-data-jpa, spring-mail, actuator, validation, jjwt 0.12.6 (api/impl/jackson), flyway-core + flyway-database-postgresql, postgresql, lombok, springdoc 2.8.4 |
| `backend/src/main/resources/application.yml` | Base Spring Boot config | ✓ VERIFIED | Swagger disabled in base, actuator exposed, JWT expiration and lockout params configurable via env vars. |
| `backend/src/main/java/com/pcori/platform/PcoriApplication.java` | Spring Boot entry point | ✓ VERIFIED | `@SpringBootApplication`, standard main method. |

### Plan 01-02: Frontend Scaffold

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/lib/api.ts` | Axios singleton with JWT interceptor | ✓ VERIFIED | Axios instance with `baseURL`, request interceptor injects `Bearer` token from localStorage, response interceptor redirects to `/login?reason=session-expired` on 401. |
| `frontend/src/lib/query-client.tsx` | TanStack Query v5 setup | ✓ VERIFIED | `QueryProvider` wrapping `QueryClientProvider`; used in `app/layout.tsx`. |
| `frontend/package.json` | Next.js 16, TanStack Query v5, Axios, react-hook-form, zod | ✓ VERIFIED | next@^16.0.0, @tanstack/react-query@^5.62.0, axios@^1.7.9, react-hook-form@^7.54.2, zod@^3.24.1, @hookform/resolvers@^3.9.1 |
| `frontend/postcss.config.mjs` | Tailwind v4 PostCSS plugin | ✓ VERIFIED | `@tailwindcss/postcss: {}` — correct for Tailwind CSS 4 CSS-first. |

### Plan 01-03: Flyway Migrations

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/src/main/resources/db/migration/V1__initial_schema.sql` | Full auth schema DDL | ✓ VERIFIED | Creates users (with lockout, email verification, password reset columns), refresh_tokens, roles, permissions, user_roles, role_permissions with appropriate indexes and FK constraints. |
| `backend/src/main/resources/db/migration/V2__seed_roles_permissions.sql` | 5 roles + permissions seed | ✓ VERIFIED | REVIEWER, MANAGER, TAXONOMY_ADMIN, ADMIN, VIEWER roles. 19 permission resource:action pairs. Role-permission mappings with ON CONFLICT DO NOTHING. |
| `backend/src/main/resources/db/migration/V3__add_audit_columns.sql` | Audit columns for AuditableEntity | ✓ VERIFIED | `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by, last_modified_by` — reconciles JPA audit annotations with V1 DDL. |

### Plan 01-04: Spring Security + JWT Filter Chain

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/src/main/java/com/pcori/platform/config/SecurityConfig.java` | Stateless JWT security, CORS, public auth routes | ✓ VERIFIED | CSRF disabled, stateless sessions, `/api/auth/**` permitAll, `/actuator/health` permitAll, `anyRequest().authenticated()`. CORS configured for localhost:3000/3001. `@EnableMethodSecurity` declared. |
| `backend/src/main/java/com/pcori/platform/security/JwtService.java` | JWT generation/validation with fail-fast | ✓ VERIFIED | `@PostConstruct init()` throws `IllegalStateException` if `JWT_SECRET` is blank or < 64 chars. Generates HS512 JWT with roles claim. Validates expiry and signature. |
| `backend/src/main/java/com/pcori/platform/security/JwtAuthFilter.java` | Per-request JWT validation filter | ✓ VERIFIED | `OncePerRequestFilter`, extracts Bearer token, validates via JwtService, sets SecurityContext. Invalid JWT lets request proceed with empty context (→ 401 from entry point). |
| `backend/src/main/java/com/pcori/platform/common/exception/GlobalExceptionHandler.java` | RFC 7807 error responses | ✓ VERIFIED | Handles validation, not-found, conflict, account-locked (403), forbidden, invalid-token (400), AccessDeniedException (403), and generic 500. |
| `backend/src/main/java/com/pcori/platform/common/audit/AuditableEntity.java` | JPA auditing base class | ✓ VERIFIED | `@MappedSuperclass` with `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, `@LastModifiedBy`. |

### Plan 01-05: Auth Domain (User/Role/Permission + AuthService/Controller)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/src/main/java/com/pcori/platform/domain/user/User.java` | User JPA entity implementing UserDetails | ✓ VERIFIED | Full entity with lockout fields, email verification fields, password reset fields. `getAuthorities()` returns `ROLE_` prefixed roles + permission names. `isAccountNonLocked()` checks `lockedUntil`. |
| `backend/src/main/java/com/pcori/platform/domain/user/Role.java` | Role entity with permissions | ✓ VERIFIED | `@SQLRestriction("deleted_at IS NULL")`, ManyToMany with permissions (EAGER). |
| `backend/src/main/java/com/pcori/platform/domain/auth/AuthService.java` | Complete auth service (all FR-1.x) | ✓ VERIFIED | register (FR-1.1), login+lockout (FR-1.2/1.3), forgotPassword+resetPassword (FR-1.4), verifyEmail (FR-1.5), logout (FR-1.6), refreshToken (FR-1.2). All configurable via `@Value`. |
| `backend/src/main/java/com/pcori/platform/domain/auth/AuthController.java` | REST endpoints for all auth flows | ✓ VERIFIED | POST /register, /login, /logout, /refresh, /forgot-password, /reset-password; GET /verify-email. All under `/api/auth/**`. |

### Plan 01-06: Frontend Auth Screens

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/components/auth/LoginForm.tsx` | Login form wired to `useLoginMutation` | ✓ VERIFIED | react-hook-form + zod validation, calls `loginMutation.mutate()` on submit, handles 401/403/locked error states via toast. |
| `frontend/src/components/auth/SignupForm.tsx` | Signup form with password strength indicator | ✓ VERIFIED | Full validation schema (username regex, email, name, password complexity), `mode: 'onChange'`, wired to `useRegisterMutation`. |
| `frontend/src/components/auth/ForgotPasswordForm.tsx` | Forgot password with email enumeration prevention | ✓ VERIFIED | Always shows success after submit regardless of API result, preventing email enumeration. |
| `frontend/src/components/auth/ResetPasswordForm.tsx` | Reset password with token from URL params | ✓ VERIFIED | Reads `?token=` from search params, confirms passwords match, posts to `/api/auth/reset-password`. Shows error state for expired/missing token. |
| `frontend/src/app/(auth)/verify-email/page.tsx` | Email verification page | ✓ VERIFIED | Auto-calls `/api/auth/verify-email?token=` on mount, shows success/error states with appropriate UI. |
| `frontend/src/hooks/useAuthMutations.ts` | Auth mutation hooks | ✓ VERIFIED | `useLoginMutation`, `useRegisterMutation`, `useForgotPasswordMutation`, `useResetPasswordMutation` — all wired to `api.post()` with correct error handling. |

### Plan 01-07: App Shell

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/app/(protected)/layout.tsx` | Auth guard + app shell layout | ✓ VERIFIED | `useAuth().isAuthenticated()` check in `useEffect`; redirects to `/login` if not authenticated. Wraps in `SidebarProvider` + renders `AppSidebar` + `AppHeader`. |
| `frontend/src/components/layout/AppSidebar.tsx` | Role-gated collapsible sidebar | ✓ VERIFIED | Passes `roles` prop to `SidebarNavItem` for each nav item. Desktop collapse (56px ↔ 240px), mobile drawer. |
| `frontend/src/components/layout/SidebarNavItem.tsx` | Role-gated nav item | ✓ VERIFIED | Reads JWT claims via `useAuth().getClaims()`, checks `userRoles.includes(r)`, returns `null` if user lacks required role. WCAG 44px touch target. |
| `frontend/src/components/layout/UserMenu.tsx` | User menu with logout | ✓ VERIFIED | Calls `POST /api/auth/logout`, then `clearTokens()` + redirect to `/login`. Shows username initials. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `docker-compose.yml` backend service | postgres | `depends_on: postgres: condition: service_healthy` | ✓ WIRED | Explicit healthcheck condition dependency. |
| `application-dev.yml` | Docker postgres | `SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/pcori` | ✓ WIRED | Hostname `postgres` resolves within Docker network. |
| `JwtAuthFilter` | `SecurityConfig` filter chain | `addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter)` | ✓ WIRED | Filter registered and excluded from Servlet container double-registration via `FilterRegistrationBean(enabled=false)`. |
| `AuthService` | `EmailService` | `emailService.sendVerificationEmail()` / `sendPasswordResetEmail()` | ✓ WIRED | Called async; `SmtpEmailService` uses `JavaMailSender` → MailHog in dev. |
| `User.getAuthorities()` | Spring Security RBAC | `SimpleGrantedAuthority("ROLE_" + role.getName())` | ✓ WIRED | Roles loaded EAGER; authorities used by SecurityContext for authorization decisions. |
| `@EnableMethodSecurity` | `@PreAuthorize` annotations | Method-level security | ✗ NOT WIRED | Infrastructure declared but no endpoint in the codebase uses `@PreAuthorize`. **This is the root cause of the SC-5 gap.** |
| `LoginForm` | `useLoginMutation` → `api.post('/api/auth/login')` | `handleSubmit(onSubmit)` calls `loginMutation.mutate(data)` | ✓ WIRED | Full chain: form → mutation hook → axios POST → setTokens → router.push('/dashboard'). |
| `SidebarNavItem` | JWT roles | `useAuth().getClaims().roles` | ✓ WIRED | Claims read from localStorage JWT, role gate renders null for unauthorized items. |
| `ProtectedLayout` auth guard | JWT expiry check | `useAuth().isAuthenticated()` → `claims.exp * 1000 > Date.now()` | ✓ WIRED | Client-side JWT expiry check redirects to `/login` before rendering protected content. |

---

## Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| FR-1.1 (Registration + email verification) | ✓ SATISFIED | register endpoint, email service, verification token all implemented and wired |
| FR-1.2 (Login + JWT issuance, 1 hour) | ✓ SATISFIED | login endpoint, JwtService with HS512, 3600000ms expiry |
| FR-1.3 (Account lockout, configurable attempts + TTL) | ✓ SATISFIED | login() increments attempts, locks with TTL; configurable env vars |
| FR-1.4 (Password reset with TTL) | ✓ SATISFIED | forgotPassword() + resetPassword() with UUID token and expiry check |
| FR-1.5 (Email verification) | ✓ SATISFIED | verifyEmail() validates UUID token, activates account |
| FR-1.6 (Logout / refresh token revocation) | ✓ SATISFIED | logout() revokes all user refresh tokens; UserMenu calls logout API |
| FR-1.7 (RBAC / role-gated access) | ✗ BLOCKED | RBAC infrastructure exists but no admin-gated endpoint created; SC-5 not demonstrable |
| FR-1.8 (Dev environment mirrors production topology) | ✓ SATISFIED | Docker Compose with postgres:16 and MailHog matches production topology; no H2 |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `frontend/src/components/layout/AppHeader.tsx` | ~34 | `{/* Breadcrumb placeholder for Phase 2+ */}` | ℹ️ Info | Expected Phase 2 work; does not affect Phase 1 goal |
| `frontend/src/components/layout/NotificationBell.tsx` | ~18 | `{/* Badge placeholder — wired in Phase 3 */}` | ℹ️ Info | Expected Phase 3 work; notification bell renders correctly without badge |
| `frontend/src/components/layout/UserMenu.tsx` | ~70,74 | Profile and Settings `onSelect={() => { /* Phase 2+ */ }}` | ℹ️ Info | Expected placeholder items; Sign Out (the Phase 1 requirement) is fully implemented |

No blocker or warning anti-patterns found in auth-critical paths.

---

## Human Verification Required

### 1. Full Registration + Email Verification Flow

**Test:** Start docker-compose stack, register a new account via `POST /api/auth/register`, check MailHog (http://localhost:8025) for the verification email, click the verification link, then attempt login.
**Expected:** Account activates and login returns a valid JWT. Login before verification returns HTTP 403 with `EMAIL_NOT_VERIFIED` in the detail.
**Why human:** Email delivery to MailHog and account state change require a running Docker stack with live database.

### 2. Account Lockout Trigger and Auto-Unlock

**Test:** With a valid unverified account first verified and active, make 5 failed login attempts with a wrong password. On the 6th attempt verify the response is HTTP 403 with remaining minutes in the detail. Wait for `LOCKOUT_DURATION_MINUTES` (or directly update `locked_until` in DB to a past time) and verify login succeeds.
**Expected:** 5th failed login locks the account; lock auto-expires after 30 minutes (configurable).
**Why human:** Requires live backend + database; time manipulation for TTL expiry cannot be verified statically.

### 3. Password Reset End-to-End

**Test:** POST to `/api/auth/forgot-password` with a valid email, find the reset link in MailHog, POST the token + new password to `/api/auth/reset-password`, then log in with the new password. Verify the same token used a second time returns HTTP 400.
**Expected:** Password updated; token invalidated after single use; expired token (past 60-minute TTL) returns HTTP 400.
**Why human:** Requires running Docker stack, live database state, and MailHog for email retrieval.

### 4. Admin RBAC Gap — Manual Workaround Until Fixed

**Test:** After the gap closure plan creates an admin-gated endpoint (e.g., `GET /api/admin/ping`), call it with a JWT containing only the `REVIEWER` role and verify HTTP 403 with `Access Denied` response body is returned.
**Expected:** `GlobalExceptionHandler.handleAccessDenied()` returns `{"status": 403, "title": "Access Denied", ...}`.
**Why human:** Cannot test until the missing admin endpoint is created (see Gaps section).

---

## Gaps Summary

**1 gap blocking full goal achievement:**

**Gap: No admin-gated API endpoint exists (Success Criterion 5 / FR-1.7)**

The RBAC infrastructure is completely in place:
- `@EnableMethodSecurity` declared in `SecurityConfig`
- `User.getAuthorities()` correctly prefixes roles with `ROLE_` so Spring Security's `hasRole('ADMIN')` will work
- `GlobalExceptionHandler` handles `AccessDeniedException` → HTTP 403 correctly
- Frontend sidebar role-gating is implemented in `SidebarNavItem`

However, **no backend endpoint uses `@PreAuthorize`** (or any other role-enforcement annotation). The only controller (`AuthController`) contains only public routes. This means:
- The 403-to-REVIEWER claim in SC-5 cannot be demonstrated or tested
- FR-1.7 is technically "wired" at the infrastructure level but lacks a concrete proof-point

**Minimum fix:** Add a single admin-only endpoint with `@PreAuthorize("hasRole('ADMIN')")` — this can be a placeholder health/status endpoint or a stub `GET /api/admin/info` that returns minimal info. It immediately satisfies SC-5 by returning 403 when called with a REVIEWER JWT, and serves as the scaffold for Phase 2 admin features.

---

*Verified: 2026-05-21T15:12:11Z*
*Verifier: Claude (pivota_spec-verifier)*
