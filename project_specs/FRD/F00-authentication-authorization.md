---

## F00: Authentication & Authorization
*Maps to FR-1 | Priority: P0 | Phase: 1 | Depends on: none*

**Description:** Secure, stateless JWT authentication with full account lifecycle management. This feature is the foundation that all other features depend on — no protected endpoint can be called without a valid `Authorization: Bearer <jwt>` header. Role-based access control (RBAC) via a `User → Role → Permission` many-to-many model gates every admin and domain feature. JWT secret is sourced exclusively from environment variables; the application refuses to start if the variable is missing.

---

### Terminology

- **JWT (JSON Web Token):** Signed, stateless access token; 1-hour default validity; configurable via `JWT_EXPIRATION_MS` env var.
- **Refresh Token:** Long-lived token stored server-side; used to issue a new JWT without re-login.
- **Role:** Named set of permissions (e.g., `REVIEWER`, `ADMIN`); assigned to users via `user_roles` join table.
- **Permission:** Atomic capability (resource + action pair, e.g., `classifications:write`).
- **Account Lockout:** Auto-lock after configurable failed-login threshold (`MAX_LOGIN_ATTEMPTS`); unlocks after TTL or admin action.
- **Email Verification Token:** Single-use token emailed on registration; account marked `emailVerified=true` on redemption.
- **Password Reset Token:** Single-use token emailed on forgot-password request; expires after `PASSWORD_RESET_TTL_MINUTES`.

---

### Sub-features

- FR-1.1 — User self-registration (username, email, BCrypt password, first/last name)
- FR-1.2 — Login with JWT issuance (1-hour default, configurable)
- FR-1.3 — Failed-login tracking and configurable account lockout
- FR-1.4 — Password reset via emailed link with configurable TTL
- FR-1.5 — Email verification flow for new accounts
- FR-1.6 — Logout (client-side token clearing; session invalidation)
- FR-1.7 — JWT validation on every protected request via `OncePerRequestFilter`
- FR-1.8 — RBAC: roles ↔ permissions many-to-many; `@PreAuthorize` at service layer

---

### Process

#### FR-1.1 Registration
1. Client `POST /api/auth/register` with `{username, email, password, firstName, lastName}`.
2. System validates: username unique, email unique and well-formed, password meets complexity rules.
3. System hashes password with BCrypt (strength 12).
4. System creates `User` record with `isActive=false`, `isEmailVerified=false`.
5. System generates `emailVerificationToken` (UUID), stores on user record.
6. System sends verification email via `EmailService`.
7. System returns `201 Created` with sanitized user object (no password hash).

#### FR-1.2 Login
1. Client `POST /api/auth/login` with `{username, password}`.
2. System checks `isActive`; if `false` → `403 ACCOUNT_INACTIVE`.
3. System checks `lockedUntil`; if in future → `403 ACCOUNT_LOCKED`.
4. System checks `isEmailVerified`; if `false` → `403 EMAIL_NOT_VERIFIED`.
5. System validates BCrypt password hash.
6. On mismatch: increment `loginAttempts`; if threshold reached, set `lockedUntil = now + lockout TTL`; return `401 INVALID_CREDENTIALS`.
7. On match: reset `loginAttempts = 0`, set `lastLoginAt = now`.
8. System generates signed JWT (HS512, subject = user UUID, includes roles claim).
9. System generates refresh token (UUID), stores with expiry.
10. Returns `200 OK` with `{accessToken, refreshToken, expiresIn, user}`.

#### FR-1.3 Account Lockout
- Failed login increments `loginAttempts` counter.
- When `loginAttempts >= MAX_LOGIN_ATTEMPTS` (env var, default 5): set `lockedUntil = now + LOCKOUT_DURATION_MINUTES`.
- Locked account returns `403 ACCOUNT_LOCKED` with remaining lock time.
- Admin can manually unlock via `PATCH /api/users/{id}/status`.
- Lock auto-expires when `lockedUntil` is in the past.

#### FR-1.4 Password Reset
1. Client `POST /api/auth/forgot-password` with `{email}`.
2. System always returns `200 OK` (prevents email enumeration).
3. If user found: generate `passwordResetToken` (UUID), set `passwordResetExpiresAt = now + TTL`.
4. Send reset email with link containing token.
5. Client `POST /api/auth/reset-password` with `{token, newPassword}`.
6. Validate token exists, not expired, password meets complexity.
7. Hash new password, clear token fields, return `200 OK`.

#### FR-1.5 Email Verification
1. Client `GET /api/auth/verify-email?token={token}`.
2. System looks up user by `emailVerificationToken`.
3. If not found or already verified: `400 INVALID_TOKEN`.
4. Set `isEmailVerified=true`, clear token, return `200 OK`.

#### FR-1.6 Logout
1. Client `POST /api/auth/logout` (JWT required in header).
2. System invalidates refresh token server-side (marks expired).
3. Returns `200 OK`. Client clears tokens from storage.

#### FR-1.7 JWT Validation
- `JwtAuthFilter` (`OncePerRequestFilter`) intercepts every request.
- Extracts `Authorization: Bearer <token>` header.
- Validates: signature (HS512, secret from env), expiry, subject (UUID maps to active user).
- On valid: populates `SecurityContextHolder` with `UsernamePasswordAuthenticationToken`.
- On invalid/missing: returns `401 UNAUTHORIZED` (public routes excluded: `/api/auth/**`, `/`, `/api/actuator/health`).

#### FR-1.8 RBAC
- Roles assigned to user via `user_roles` join table.
- Permissions assigned to roles via `role_permissions` join table.
- `@PreAuthorize("hasRole('ADMIN')")` or `@PreAuthorize("hasAuthority('classifications:write')")` at service layer methods (not controller-only).
- Unauthorized access returns `403 FORBIDDEN`.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `username` | string | yes | 3–50 chars; alphanumeric + underscore; unique |
| `email` | string | yes | Valid RFC 5322 format; unique; max 255 chars |
| `password` | string | yes | 8–128 chars; ≥1 uppercase, ≥1 lowercase, ≥1 digit |
| `firstName` | string | yes | 1–100 chars |
| `lastName` | string | yes | 1–100 chars |
| `token` (verify/reset) | string | yes | Valid UUID format; not expired |
| `newPassword` | string | yes (reset) | Same complexity rules as `password` |

---

### Outputs

| Scenario | HTTP Status | Response Body |
|---|---|---|
| Registration success | `201 Created` | `{id, username, email, firstName, lastName, createdAt}` |
| Login success | `200 OK` | `{accessToken, refreshToken, expiresIn, user: {id, username, roles}}` |
| Token refresh | `200 OK` | `{accessToken, expiresIn}` |
| Email verification | `200 OK` | `{message: "Email verified"}` |
| Password reset initiated | `200 OK` | `{message: "If account exists, reset email sent"}` |
| Password reset complete | `200 OK` | `{message: "Password updated"}` |
| Logout | `200 OK` | `{message: "Logged out"}` |

---

### Validation Rules

- Username: unique, 3–50 chars, alphanumeric + underscore only. Return `400 VALIDATION_ERROR` with field-level error if violated.
- Email: unique, RFC 5322, max 255 chars.
- Password: 8–128 chars, complexity rules (uppercase, lowercase, digit).
- JWT secret: must be present in env (`JWT_SECRET`); minimum 512-bit length (64 chars); startup `IllegalStateException` if missing.
- `emailVerificationToken`: single-use; consumed on first valid redemption.
- `passwordResetToken`: single-use; consumed on successful reset; expires per `PASSWORD_RESET_TTL_MINUTES` env var (default 60).
- Account lockout: `MAX_LOGIN_ATTEMPTS` env var (default 5); `LOCKOUT_DURATION_MINUTES` env var (default 30).
- JWT expiry: `JWT_EXPIRATION_MS` env var (default 3600000 = 1 hour).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Username already taken | `409 Conflict` | `USERNAME_TAKEN` | "Username already in use" |
| Email already registered | `409 Conflict` | `EMAIL_TAKEN` | "Email already registered" |
| Invalid credentials | `401 Unauthorized` | `INVALID_CREDENTIALS` | "Invalid username or password" |
| Account locked | `403 Forbidden` | `ACCOUNT_LOCKED` | "Account locked. Try again after {time}" |
| Account inactive | `403 Forbidden` | `ACCOUNT_INACTIVE` | "Account is deactivated" |
| Email not verified | `403 Forbidden` | `EMAIL_NOT_VERIFIED` | "Please verify your email before logging in" |
| Invalid/expired reset token | `400 Bad Request` | `INVALID_TOKEN` | "Reset token is invalid or expired" |
| Invalid/expired verify token | `400 Bad Request` | `INVALID_TOKEN` | "Verification token is invalid or expired" |
| JWT expired | `401 Unauthorized` | `TOKEN_EXPIRED` | "Access token has expired" |
| JWT invalid signature | `401 Unauthorized` | `TOKEN_INVALID` | "Invalid access token" |
| JWT missing | `401 Unauthorized` | `TOKEN_MISSING` | "Authorization header required" |
| Insufficient role/permission | `403 Forbidden` | `ACCESS_DENIED` | "Insufficient permissions" |
| Password complexity violation | `400 Bad Request` | `VALIDATION_ERROR` | Field-level error message |
| JWT_SECRET missing at startup | Application exits | — | `IllegalStateException: JWT_SECRET environment variable is required` |

---

### API Surface (this feature)
See `Y1-api.md` §Auth (`/api/auth`) for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | — |
| `POST` | `/api/auth/login` | None | — |
| `POST` | `/api/auth/logout` | JWT | any |
| `POST` | `/api/auth/refresh` | None (refresh token in body) | — |
| `GET` | `/api/auth/verify-email` | None | — |
| `POST` | `/api/auth/forgot-password` | None | — |
| `POST` | `/api/auth/reset-password` | None | — |

---

### Schema Surface (this feature)
Uses tables: `users`, `roles`, `permissions`, `user_roles`, `role_permissions` — see `Y0-schema.md` §Auth.

Key fields:
- `users.email_verification_token` — UUID; cleared after verification
- `users.password_reset_token` — UUID; cleared after reset
- `users.login_attempts` — integer counter
- `users.locked_until` — `TIMESTAMPTZ`; null when not locked
- `users.is_email_verified` — boolean
- `users.is_active` — boolean (admin-controlled)
