---
status: diagnosed
phase: 01-foundation
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md, 01-05-SUMMARY.md, 01-06-SUMMARY.md, 01-07-SUMMARY.md
started: 2026-05-21T00:00:00Z
updated: 2026-05-21T04:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Docker Compose Stack Starts Healthy
expected: Run `docker compose up -d` from the project root. All three services (postgres, mailhog, backend) start without errors. `docker compose ps` shows all services as "running" or "healthy". Backend health endpoint responds: `curl http://localhost:8080/actuator/health` returns `{"status":"UP"}`.
result: pass

### 2. Frontend Dev Server Starts
expected: Run `npm run dev` inside the `frontend/` directory. The dev server starts at `http://localhost:3000` without errors. Visiting `http://localhost:3000` in the browser loads a page (landing or redirect).
result: pass

### 3. Landing Page Renders
expected: Visiting `http://localhost:3000` shows the landing page with a dark gradient hero section, two CTA buttons ("Get Started" and "Learn More"), and three feature cards below. A navigation bar is visible at the top.
result: issue
reported: "The page is unstyled ,nothing renders styled"
severity: major

### 4. Login Page Loads
expected: Navigating to `http://localhost:3000/login` shows a centered auth card (max-width ~400px) with a username field, password field with show/hide toggle, and a "Sign In" button. The button is disabled until both fields have content.
result: issue
reported: "can see all the elements but it is not styled"
severity: major

### 5. Signup Page Loads
expected: Navigating to `http://localhost:3000/signup` shows the signup form with fields for first name, last name, email, username, and password. A password strength indicator appears when the password field is focused. The submit button is disabled until the form is valid.
result: skipped
reason: Systemic Tailwind CSS styling issue detected in Tests 3 & 4; skipping visual-only layout tests to focus on functional tests

### 6. User Registration Flow
expected: Fill in the signup form at `/signup` with valid data and submit. The backend creates the user and a verification email is sent. MailHog at `http://localhost:8025` shows a new email with a verification link. The UI shows a success confirmation (toast or message).
result: issue
reported: "on clicking 'create account' nothing happens"
severity: major

### 7. Email Verification
expected: Copy the verification link from MailHog and open it in the browser. Navigating to `/verify-email?token=...` shows a success state ("Email verified" or similar). The user can now log in.
result: skipped
reason: Registration flow failed (Test 6); no verification token available to test with

### 8. Login with Valid Credentials
expected: On the `/login` page, enter the verified user's credentials and submit. The user is redirected to the dashboard (`/dashboard`). The app shell (sidebar + header) is visible. The JWT token is stored (check DevTools → Application → localStorage → `jwt_token`).
result: skipped
reason: Cannot fully test login flow because registration is blocked (Test 6 failed) and no verified test user is available

### 9. Protected Route Auth Guard
expected: Open a new private/incognito browser window. Navigate directly to `http://localhost:3000/dashboard`. Without a valid token, the app redirects to `/login` — the dashboard content is never shown.
result: skipped
reason: User could not run API test; skipped

### 10. Forgot Password Flow
expected: Navigate to `/forgot-password`. Enter any email address and submit. The form always shows a success message (never reveals whether the email exists). If the email belongs to a registered user, MailHog receives a password-reset email with a reset link.
result: skipped
reason: Cannot test without a registered user (blocked by Test 6 failure)

### 11. Account Lockout After Failed Logins
expected: On the `/login` page, attempt to log in with a valid username but wrong password 5 times in a row. After the 5th failure, the login attempt returns a "Account locked" error (403). The account is locked in the database.
result: skipped
reason: Requires a registered user account (blocked by Test 6 failure)

### 12. RBAC — Admin Endpoint Blocked for Reviewer
expected: Log in as a regular (REVIEWER-role) user and obtain the JWT from localStorage. Call an admin-only endpoint with it: `curl -H "Authorization: Bearer <token>" http://localhost:8080/api/users`. The response is `403 Forbidden`, not `200 OK`.
result: skipped
reason: Requires a working login (blocked by Test 6 failure)

### 13. App Shell Sidebar and Navigation
expected: When logged in and on the dashboard, the left sidebar is visible in collapsed (icon-only) mode by default. Clicking the toggle expands it to show labels. Navigation items appear based on the user's role. Clicking a nav item highlights it with a blue left border.
result: skipped
reason: Requires a working login (blocked by Test 6 failure)

### 14. Theme Toggle
expected: In the app header, a theme toggle button is visible. Clicking it cycles between light, dark, and system themes. The page appearance changes accordingly (background color shifts). The preference persists after page reload.
result: issue
reported: "No theme toggle visible"
severity: major

### 15. Logout Flow
expected: Click the user avatar or name in the header to open the user menu. Click "Sign Out". A toast appears: "You've been signed out." The user is redirected to `/login`. The `jwt_token` key is removed from localStorage.
result: skipped
reason: Requires a working login (blocked by Test 6 failure)

### 16. Swagger UI in Dev Mode
expected: With the backend running in dev profile, navigate to `http://localhost:8080/swagger-ui/index.html`. The OpenAPI documentation page loads with available endpoints listed.
result: skipped
reason: User skipped

## Summary

total: 16
passed: 2
issues: 4
pending: 0
skipped: 10

## Gaps

- truth: "Landing page renders with dark gradient hero, CTA buttons, feature cards, and styled navigation"
  status: failed
  reason: "User reported: The page is unstyled ,nothing renders styled"
  severity: major
  test: 3
  root_cause: "globals.css contains unlayered `* { margin: 0; padding: 0 }` reset (lines 63-68) that overrides all Tailwind v4 `@layer utilities` rules per CSS Cascade Level 5 spec — unlayered author CSS wins over all layered rules. Secondary: production build postcss.config.mjs may not be resolved by next build, emitting zero utility classes."
  artifacts:
    - path: "frontend/src/app/globals.css"
      issue: "Unlayered * reset at lines 63-68 overrides all Tailwind spacing utilities"
    - path: "frontend/postcss.config.mjs"
      issue: "May not be resolved by next build (secondary — production only)"
  missing:
    - "Remove unlayered * { margin: 0; padding: 0 } block from globals.css (Tailwind v4 provides equivalent reset inside @layer base)"
    - "Optionally rename postcss.config.mjs to postcss.config.js with CommonJS exports to ensure production build compatibility"
  debug_session: ".planning/debug/tailwind-styles-not-applied.md"

- truth: "Login page shows styled auth card with username field, password field with show/hide toggle, and disabled Sign In button"
  status: failed
  reason: "User reported: can see all the elements but it is not styled"
  severity: major
  test: 4
  root_cause: "Same root cause as Test 3 — unlayered CSS reset in globals.css overrides all Tailwind utilities including layout, color, and spacing classes on the login page."
  artifacts:
    - path: "frontend/src/app/globals.css"
      issue: "Unlayered * reset overrides all Tailwind utilities (shared cause with Test 3)"
  missing:
    - "Fix is shared with Test 3 — remove unlayered * reset from globals.css"
  debug_session: ".planning/debug/tailwind-styles-not-applied.md"

- truth: "Submitting signup form creates user, sends verification email to MailHog, shows success confirmation"
  status: failed
  reason: "User reported: on clicking 'create account' nothing happens"
  severity: major
  test: 6
  root_cause: "Button is correctly HTML-disabled (disabled={!isValid}) but Tailwind CSS failure makes the disabled state visually indistinguishable — user cannot see it is disabled. Validation errors (password complexity rules) are also invisible due to Tailwind failure. Submission wiring (handleSubmit, mutation, API call) is correctly implemented."
  artifacts:
    - path: "frontend/src/components/auth/SignupForm.tsx"
      issue: "Button disabled state (line 141) and validation error messages are invisible without Tailwind styles"
  missing:
    - "Fix is shared with Tests 3 & 4 — once Tailwind is fixed, disabled button state and validation errors will be visible"
  debug_session: ".planning/debug/signup-submit-no-action.md"

- truth: "Theme toggle button is visible in the app header and cycles between light, dark, and system themes"
  status: failed
  reason: "User reported: No theme toggle visible"
  severity: major
  test: 14
  root_cause: "ThemeToggle is only rendered inside (protected)/layout.tsx via AppHeader — it is never shown on public routes (landing, login, signup). UAT test 14 was evaluated on a public page where the authenticated shell never mounts."
  artifacts:
    - path: "frontend/src/app/(protected)/layout.tsx"
      issue: "AppHeader (containing ThemeToggle) only renders behind auth gate — not on public routes"
    - path: "frontend/src/app/page.tsx"
      issue: "Landing page nav has no ThemeToggle"
  missing:
    - "Add ThemeToggle to public landing page nav (app/page.tsx) if spec requires it on public routes, OR confirm test 14 should be run while authenticated (in which case no code change needed)"
  debug_session: ".planning/debug/theme-toggle-missing.md"
