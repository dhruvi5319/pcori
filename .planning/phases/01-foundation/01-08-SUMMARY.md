---
phase: 01-foundation
plan: 08
subsystem: ui
tags: [nextjs, tailwindcss, postcss, react-hook-form, typescript]

# Dependency graph
requires:
  - phase: 01-02
    provides: Next.js scaffold with Tailwind CSS 4 CSS-first config (globals.css @import "tailwindcss")
  - phase: 01-06
    provides: SignupForm.tsx with react-hook-form, all auth UI screens
provides:
  - postcss.config.mjs activating @tailwindcss/postcss plugin for Tailwind v4 utility class generation
  - SignupForm with mode:onChange so Create Account button enables as soon as all fields pass validation
affects:
  - All frontend plans: CSS utility classes (flex, grid, bg-*, text-*, rounded-*) now generated for all pages
  - Verify phase: UAT Tests 3, 4, 6 should now pass (styled pages + working signup form)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Tailwind v4 PostCSS activation: postcss.config.mjs with @tailwindcss/postcss plugin (required by Next.js + Turbopack)
    - react-hook-form mode:onChange for live validation matching LoginForm pattern

key-files:
  created:
    - frontend/postcss.config.mjs
  modified:
    - frontend/src/components/auth/SignupForm.tsx

key-decisions:
  - "postcss.config.mjs is required for Tailwind v4 with Next.js + Turbopack — without it @import 'tailwindcss' is inert and no utility classes are emitted"
  - "SignupForm mode changed to 'onChange' matching LoginForm — onBlur caused isValid to never update, permanently disabling the Create Account button"

patterns-established:
  - "Tailwind v4 + Next.js Turbopack: always include postcss.config.mjs with @tailwindcss/postcss"
  - "react-hook-form: use mode: 'onChange' for forms with submit-disabled-until-valid pattern"

# Metrics
duration: 3min
completed: 2026-05-21
---

# Phase 1 Plan 08: UAT Gap Closure Summary

**PostCSS plugin config added to activate Tailwind v4 CSS generation (CSS grew from 3.5KB to 34KB), and SignupForm mode fixed from onBlur to onChange so the Create Account button enables on live input**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-21T03:50:00Z
- **Completed:** 2026-05-21T03:53:01Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `frontend/postcss.config.mjs` registering `@tailwindcss/postcss` plugin — Tailwind utility classes now emitted (CSS bundle: 34,697 bytes vs ~3,500 bytes before)
- Fixed `SignupForm.tsx` from `mode: 'onBlur'` to `mode: 'onChange'` so `isValid` updates on every keystroke (matching `LoginForm` pattern already working)
- Both fixes verified: `npx next build` succeeds, TypeScript strict passes, CSS bundle >10KB, utility classes present

## Task Commits

Each task was committed atomically:

1. **Task 1: Create postcss.config.mjs to activate Tailwind v4 utility class generation** - `91dd7df` (feat)
2. **Task 2: Fix SignupForm validation mode so Create Account button enables on live input** - `7ea1277` (fix)

**Plan metadata:** `(docs commit follows)`

## Files Created/Modified

- `frontend/postcss.config.mjs` - Registers `@tailwindcss/postcss` PostCSS plugin; enables Tailwind v4 utility class generation via Next.js + Turbopack
- `frontend/src/components/auth/SignupForm.tsx` - Changed `mode: 'onBlur'` → `mode: 'onChange'` in `useForm` options

## Decisions Made

- **postcss.config.mjs is required for Tailwind v4 + Turbopack:** Tailwind v4 uses `@import "tailwindcss"` as the CSS entry point (CSS-first config). Without a PostCSS config file that registers `@tailwindcss/postcss`, Next.js + Turbopack never invokes the plugin. Only manually authored `.glass` and `.btn-gradient` classes were emitted; all utility classes were absent.
- **mode: 'onChange' matches LoginForm pattern:** LoginForm already uses `mode: 'onChange'` and works correctly per UAT. Standardizing both forms on `onChange` gives consistent behavior: the submit button enables immediately when all fields pass Zod validation, without requiring explicit blur on every field.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed npm dependencies (node_modules missing)**
- **Found during:** Task 1 (build verification)
- **Issue:** `node_modules/` was absent from `frontend/` — `npx next build` failed with Turbopack workspace root error; `npx tsc --noEmit` failed with "Cannot find module 'next'" errors
- **Fix:** Ran `npm install` in `frontend/` — installed 402 packages in 35 seconds
- **Files modified:** `frontend/node_modules/` (not committed — in .gitignore)
- **Verification:** `npx next build` succeeds, TypeScript source files pass type check
- **Committed in:** N/A (node_modules not committed)

---

**Total deviations:** 1 auto-fixed (Rule 3 - Blocking)
**Impact on plan:** node_modules install was a one-time environment setup; no scope creep. Both planned fixes delivered as specified.

## Issues Encountered

None beyond the auto-fixed missing node_modules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Verify phase:** UAT Tests 3, 4 (unstyled pages) and Test 6 (Create Account button) should now pass with Tailwind utility classes generated and SignupForm mode fixed
- **All remaining auth UI tests (4–16):** Unblocked — Tailwind styling was the root cause of most skipped/failed UAT tests
- **No further UAT gap closures identified** in Phase 1 foundation plans

---
*Phase: 01-foundation*
*Completed: 2026-05-21*

## Self-Check: PASSED

- `frontend/postcss.config.mjs` — FOUND on disk with `@tailwindcss/postcss` plugin entry
- `frontend/src/components/auth/SignupForm.tsx` — FOUND with `mode: 'onChange'`
- Commit `91dd7df` — verified in git log (feat: postcss.config.mjs)
- Commit `7ea1277` — verified in git log (fix: SignupForm mode onChange)
