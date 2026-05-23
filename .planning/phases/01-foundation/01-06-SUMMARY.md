---
phase: 01-foundation
plan: 06
subsystem: ui
tags: [nextjs, react, typescript, tailwindcss, react-hook-form, zod, tanstack-query, sonner, lucide-react, playwright, radix-ui]

# Dependency graph
requires:
  - phase: 01-02
    provides: Next.js scaffold, Axios api.ts, useAuth hook, design tokens (CSS custom properties), TypeScript type contracts
  - phase: 01-05
    provides: /api/auth/* endpoints (login, register, verify-email, forgot-password, reset-password, logout)
provides:
  - Landing page at / with dark gradient mesh hero, dual CTAs, 3 feature cards, footer
  - Login page at /login — all 5 interaction states (default, loading, 3 error variants, success redirect)
  - Signup page at /signup — 5 fields, onBlur zod validation, password strength indicator
  - Forgot password at /forgot-password — email-enumeration-safe always-success response
  - Reset password at /reset-password?token= — token from URL, confirm password matching
  - Email verification at /verify-email?token= — loading/success/error states
  - AuthCard shared component (max-width 400px, E3 Floating shadow)
  - PasswordInput with show/hide toggle (aria-label Show/Hide password)
  - PasswordStrengthIndicator (4 rules, green checkmarks)
  - useAuthMutations hook (login, register, forgotPassword, resetPassword)
  - Playwright e2e test suite (14 tests, 5 describe blocks) — execution deferred to verify phase
affects:
  - 01-07: app shell builds on layout patterns established here; reuses AuthCard approach

# Tech tracking
tech-stack:
  added:
    - playwright (e2e testing config + test suite)
  patterns:
    - AuthCard: max-width 400px centered card wrapping all auth forms
    - useAuthMutations: TanStack Query mutations for all /api/auth/* endpoints
    - Email-enumeration prevention: ForgotPasswordForm always shows success state
    - Form validation: react-hook-form + zod; onBlur per field; submit disabled until valid
    - PasswordInput: forwardRef pattern for react-hook-form register compatibility
    - Route pages: thin wrappers — import AuthCard + Form, render, done

key-files:
  created:
    - frontend/src/components/auth/AuthCard.tsx
    - frontend/src/components/auth/PasswordInput.tsx
    - frontend/src/components/auth/PasswordStrengthIndicator.tsx
    - frontend/src/components/auth/LoginForm.tsx
    - frontend/src/components/auth/SignupForm.tsx
    - frontend/src/components/auth/ForgotPasswordForm.tsx
    - frontend/src/components/auth/ResetPasswordForm.tsx
    - frontend/src/components/landing/LandingHero.tsx
    - frontend/src/components/landing/FeatureCard.tsx
    - frontend/src/hooks/useAuthMutations.ts
    - frontend/src/lib/utils.ts
    - "frontend/src/app/(auth)/signup/page.tsx"
    - "frontend/src/app/(auth)/forgot-password/page.tsx"
    - "frontend/src/app/(auth)/reset-password/page.tsx"
    - "frontend/src/app/(auth)/verify-email/page.tsx"
    - e2e/auth.spec.ts
    - playwright.config.ts
  modified:
    - frontend/src/app/page.tsx (landing page — replaced placeholder)
    - "frontend/src/app/(auth)/login/page.tsx (wired LoginForm into AuthCard — replaced placeholder)"

key-decisions:
  - "ResetPasswordForm error.confirmPassword.message cast to String() — TypeScript strict rejects FieldError as ReactNode due to zod refine returning union type"
  - "E2E tests written but not executed during execute phase — per test execution boundary rules; deferred to verify phase"
  - "ForgotPasswordForm uses local submitted state rather than mutation.isSuccess to control form/success view — more reliable with async behavior"

patterns-established:
  - "Auth form pattern: import AuthCard + Form component → wrap in AuthCard in page.tsx"
  - "useAuthMutations pattern: one hook per mutation, toast error messages defined in hook, success redirects in hook"
  - "PasswordInput requires forwardRef for react-hook-form register() compatibility"

# Metrics
duration: 5min
completed: 2026-05-20
---

# Phase 1 Plan 06: Auth UI Screens Summary

**All 5 public auth screens and landing page built with react-hook-form + zod + TanStack Query mutations wired to /api/auth/* endpoints, matching UI-SPEC design contract exactly (gradients, shadows, copy, accessibility)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-20T18:52:37Z
- **Completed:** 2026-05-20T18:57:37Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments

- Landing page with dark gradient mesh hero (`radial-gradient(ellipse at 20% 50%, #1e3a5f 0%, #0f172a 40%, #1a1040 100%)`), dual CTAs, 3 feature cards with gradient border hover
- All 5 auth forms (Login, Signup, ForgotPassword, ResetPassword, EmailVerification) matching UI-SPEC Copywriting Contract text exactly
- LoginForm implements all 5 interaction states including account locked, email not verified (amber toast with resend action), account inactive
- PasswordInput show/hide toggle with `aria-label="Show password"` / `aria-label="Hide password"` per WCAG accessibility contract
- ForgotPasswordForm always shows success message (email enumeration prevention per FR-1.4)
- ResetPasswordForm reads token from URL `?token=` param; validates password match client-side
- Next.js build passes (`BUILD OK`), TypeScript strict passes (`TYPE CHECK OK`)
- 14 Playwright e2e tests written covering all 5 describe blocks; execution deferred to verify phase

## Task Commits

Each task was committed atomically:

1. **Task 1: AuthCard, PasswordInput, PasswordStrengthIndicator, useAuthMutations** - `8a35ce8` (feat)
2. **Task 2: Auth forms, landing page, route pages, and Playwright e2e tests** - `161a882` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified

- `frontend/src/lib/utils.ts` - cn() helper (clsx + tailwind-merge)
- `frontend/src/components/auth/AuthCard.tsx` - max-width 400px; E3 Floating box-shadow
- `frontend/src/components/auth/PasswordInput.tsx` - forwardRef; show/hide toggle with aria-labels
- `frontend/src/components/auth/PasswordStrengthIndicator.tsx` - 4 rules; green ✓ when satisfied
- `frontend/src/components/auth/LoginForm.tsx` - 5 interaction states; gradient CTA; disabled until valid
- `frontend/src/components/auth/SignupForm.tsx` - 5 fields; onBlur validation; password rules on focus
- `frontend/src/components/auth/ForgotPasswordForm.tsx` - always-success state; email enumeration safe
- `frontend/src/components/auth/ResetPasswordForm.tsx` - token from URL; passwords-must-match refine
- `frontend/src/components/landing/LandingHero.tsx` - dark gradient mesh; dual CTAs; KPI counters
- `frontend/src/components/landing/FeatureCard.tsx` - gradient border on hover; icon+title+body
- `frontend/src/hooks/useAuthMutations.ts` - login, register, forgotPassword, resetPassword mutations
- `frontend/src/app/page.tsx` - full landing page with nav + hero + features + footer
- `frontend/src/app/(auth)/login/page.tsx` - AuthCard + LoginForm
- `frontend/src/app/(auth)/signup/page.tsx` - AuthCard + SignupForm
- `frontend/src/app/(auth)/forgot-password/page.tsx` - AuthCard + ForgotPasswordForm
- `frontend/src/app/(auth)/reset-password/page.tsx` - AuthCard + Suspense + ResetPasswordForm
- `frontend/src/app/(auth)/verify-email/page.tsx` - client component; auto-calls API on mount; 3 states
- `e2e/auth.spec.ts` - 14 Playwright tests; 5 describe blocks
- `playwright.config.ts` - Chromium; baseURL localhost:3000; webServer ./frontend

## Decisions Made

- **String() cast for ResetPasswordForm error:** TypeScript strict mode rejects `FieldError | string | undefined` as `ReactNode`. The zod `.refine()` method produces a union type for `confirmPassword.message`. Fixed by adding `String()` cast: `{String(errors.confirmPassword.message)}`.
- **E2E tests deferred:** Per execute phase rules, Playwright E2E tests are written as artifacts but not executed during this phase. Execution deferred to verify phase which runs them in a controlled environment.
- **ForgotPasswordForm local submitted state:** Uses `useState(false)` for submitted state rather than `mutation.isSuccess` — more reliable since the mutation always shows success regardless of API error response (email enumeration prevention).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript error: FieldError not assignable to ReactNode in ResetPasswordForm**
- **Found during:** Task 2 (TypeScript verification after writing ResetPasswordForm)
- **Issue:** `errors.confirmPassword.message` type is `string | FieldError | Merge<FieldError, FieldErrorsImpl> | undefined` — TypeScript strict rejects the FieldError variant as ReactNode
- **Fix:** Changed to `errors.confirmPassword?.message && String(errors.confirmPassword.message)` — optional chaining + explicit String() cast
- **Files modified:** `frontend/src/components/auth/ResetPasswordForm.tsx`
- **Verification:** `npx tsc --noEmit` passes; `npm run build` succeeds
- **Committed in:** `161a882` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary TypeScript correctness fix; no scope creep; all planned functionality delivered.

## Issues Encountered

None beyond the auto-fixed TypeScript deviation above.

## User Setup Required

None - no external service configuration required. Auth UI connects to local backend at localhost:8080 (via `.env.local`).

## Next Phase Readiness

- **Plan 07 (App Shell):** Auth screens complete; Plan 07 can build protected layout with sidebar, header, and ThemeToggle using the same design token/component patterns established here
- **Verify phase:** All 14 Playwright e2e tests in `e2e/auth.spec.ts` are ready to run; backend (Plan 05) must be running for forgot-password and verify-email tests that hit real API
- **Design contract:** All UI-SPEC Screen 1–6 visual specs implemented; CTA gradient, auth card shadow, password toggle aria-labels verified

---
*Phase: 01-foundation*
*Completed: 2026-05-20*

## Self-Check: PASSED

All 13 key files found on disk. Both task commits (8a35ce8, 161a882) verified in git history.
