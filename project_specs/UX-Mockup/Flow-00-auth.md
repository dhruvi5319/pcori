## Flow-00: Authentication (US-0.1 – US-0.6)

**User Stories:** US-0.1 (Registration), US-0.2 (Email Verification), US-0.3 (Login), US-0.4 (Token Refresh), US-0.5 (Password Reset), US-0.6 (Logout)

---

### Flow 0-A: Self-Registration

**Trigger:** User visits `/signup` directly or clicks "Create account" from login page
**Exit:** Redirect to `/login` with success toast "Account created — check your email to verify"

```
[/signup Form]
     │
     ├── Client validation (zod) fails → inline field errors; submit stays disabled
     │
     ├── POST /api/auth/register
     │        │
     │        ├── 409 USERNAME_TAKEN  → field-level error "Username already in use"
     │        ├── 409 EMAIL_TAKEN    → field-level error "Email already registered"
     │        ├── 400 VALIDATION_ERROR → field-level error per failing field
     │        │
     │        └── 201 Created
     │                 │
     │                 └── Toast (green): "Account created — check your email"
     │                          │
     │                          └── Redirect → /login
```

**Steps:**
1. User fills form: username, email, password, first name, last name
2. Zod validates client-side on blur; submit button disabled until all fields pass
3. On submit: POST /api/auth/register
4. Success: toast + redirect to /login
5. System sends verification email automatically

---

### Flow 0-B: Email Verification

**Trigger:** User clicks link in verification email
**Exit:** Success page with "Email verified — log in now" button → `/login`

```
[Email Link: GET /api/auth/verify-email?token=...]
     │
     ├── 400 INVALID_TOKEN (expired or already used)
     │        └── Error page: "This link has expired or was already used."
     │                         [Request new verification email] button
     │
     └── 200 OK → Success: "Email verified!"
                       └── [Log In] button → /login
```

---

### Flow 0-C: Login

**Trigger:** User visits `/login` or is redirected after session expiry
**Exit:** Redirect to `/dashboard` (or original requested URL)

```
[/login Form]
     │
     ├── Submit disabled until both username + password non-empty
     │
     ├── POST /api/auth/login
     │        │
     │        ├── 401 INVALID_CREDENTIALS
     │        │        └── Toast (red): "Invalid username or password" + attempt counter message
     │        │
     │        ├── 403 ACCOUNT_LOCKED
     │        │        └── Toast (red): "Account locked. Try again after [time]."
     │        │
     │        ├── 403 EMAIL_NOT_VERIFIED
     │        │        └── Toast (amber): "Please verify your email first."
     │        │                 + [Resend verification email] link
     │        │
     │        ├── 403 ACCOUNT_INACTIVE
     │        │        └── Toast (red): "This account has been deactivated."
     │        │
     │        └── 200 OK
     │                 │
     │                 ├── Store accessToken + refreshToken
     │                 └── Redirect → /dashboard (or originally requested protected route)
```

---

### Flow 0-D: Password Reset

**Trigger:** User clicks "Forgot password?" link on `/login`
**Exit:** Password changed → redirect to `/login` with toast "Password updated"

```
Step 1: Forgot Password
[/forgot-password Form: Email field]
     │
     └── POST /api/auth/forgot-password
              │
              └── 200 OK (always — prevents email enumeration)
                       └── Message shown: "If an account with that email exists,
                                          a reset link has been sent."
                                          [Return to Login]

Step 2: Reset Password (via email link)
[/reset-password?token=... Form: New Password + Confirm Password]
     │
     ├── Client zod validation (complexity rules shown inline)
     │
     ├── POST /api/auth/reset-password
     │        │
     │        ├── 400 INVALID_TOKEN → "This reset link has expired or already been used."
     │        │                         [Request new reset email] button
     │        │
     │        └── 200 OK
     │                 └── Toast (green): "Password updated"
     │                          └── Redirect → /login
```

---

### Flow 0-E: Token Refresh (Silent)

**Trigger:** TanStack Query detects 401 on any API call; access token near expiry (client-side check)
**Exit:** Retry original request with new access token; no visible disruption to user

```
[Any protected API call returns 401 TOKEN_EXPIRED]
     │
     ├── POST /api/auth/refresh (with refresh token in request)
     │        │
     │        ├── 401 TOKEN_INVALID → clear all tokens
     │        │        └── Toast (amber): "Session expired — please log in again"
     │        │                  → Redirect /login
     │        │
     │        └── 200 OK → new accessToken stored → retry original request
```

---

### Flow 0-F: Logout

**Trigger:** User clicks "Logout" in user menu (accessible from every page in header)
**Exit:** Tokens cleared; redirect to `/login`

```
[Header User Menu → Logout]
     │
     └── POST /api/auth/logout
              │
              └── 200 OK
                       ├── Clear accessToken + refreshToken from client storage
                       └── Redirect → /login
                                Toast (muted): "You've been signed out"
```

---
