---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [nextjs, react, typescript, tailwindcss, tanstack-query, axios, next-themes, sonner, geist, radix-ui]

# Dependency graph
requires: []
provides:
  - Next.js 16 / React 19 frontend scaffold compiling at localhost:3000
  - Tailwind CSS 4 CSS-first config (globals.css @import, no tailwind.config.js)
  - Geist font (sans + mono) loaded via geist npm package in root layout
  - ThemeProvider (next-themes, system OS default) wrapping entire app
  - Axios singleton with JWT Bearer header injection and 401 redirect handler
  - TanStack Query v5 QueryClient (retry 2, staleTime 30s, no global staleTime 0)
  - Sonner Toaster at top-right in root layout
  - Full UI-SPEC design token set (light + dark CSS custom properties)
  - TypeScript interfaces: User, LoginResponse, RegisterRequest, PagedResponse, ErrorResponse, Classification
  - useAuth hook with JWT parse, isAuthenticated, hasRole, setTokens, clearTokens
affects:
  - Plans 06–07: auth UI screens depend on layout, api.ts, useAuth, type contracts
  - All frontend plans: data layer (QueryClient, Axios) used by every page

# Tech tracking
tech-stack:
  added:
    - next@16.2.6
    - react@19
    - @tanstack/react-query@5
    - axios@1.7.9
    - next-themes@0.4.4
    - sonner@1.7.4
    - geist@1.3.1
    - tailwindcss@4
    - "@tailwindcss/postcss@4"
    - react-hook-form@7
    - zod@3
    - "@hookform/resolvers@3"
    - "@radix-ui/react-dialog, react-dropdown-menu, react-tabs, react-tooltip, react-slot, react-separator"
    - lucide-react@0.474
    - class-variance-authority, clsx, tailwind-merge
  patterns:
    - Tailwind CSS 4 CSS-first: @import "tailwindcss" in globals.css; no tailwind.config.js
    - QueryProvider client component wraps Server Component children (Next.js App Router pattern)
    - Axios interceptors for auth token injection and 401 handling
    - localStorage keys: jwt_token, refresh_token
    - CSS custom properties for all design tokens (light + dark via .dark class)
    - geist npm package for Geist font (not next/font/google)

key-files:
  created:
    - frontend/package.json
    - frontend/tsconfig.json
    - frontend/next.config.ts
    - frontend/.env.local
    - frontend/src/app/globals.css
    - frontend/src/app/layout.tsx
    - frontend/src/app/page.tsx
    - "frontend/src/app/(auth)/login/page.tsx"
    - "frontend/src/app/(protected)/layout.tsx"
    - "frontend/src/app/(protected)/dashboard/page.tsx"
    - frontend/src/lib/api.ts
    - frontend/src/lib/query-client.tsx
    - frontend/src/types/api.ts
    - frontend/src/types/user.ts
    - frontend/src/types/classification.ts
    - frontend/src/hooks/useAuth.ts
  modified:
    - frontend/tsconfig.json (Next.js auto-updated jsx and include during first build)

key-decisions:
  - "query-client file uses .tsx extension (not .ts) — contains JSX for QueryClientProvider component"
  - "geist npm package used for Geist font (not next/font/google) — matches plan specification"
  - "ThemeProvider defaultTheme=system per UI-SPEC User Decision #2"

patterns-established:
  - "CSS-first Tailwind: @import 'tailwindcss' in globals.css; zero configuration files"
  - "Design tokens via CSS custom properties: :root {} and .dark {} classes"
  - "Axios singleton with localStorage-based JWT injection and global 401 redirect"
  - "QueryProvider wraps children as client component; layout.tsx stays server component"

# Metrics
duration: 4min
completed: 2026-05-20
---

# Phase 1 Plan 02: Frontend Foundation Summary

**Next.js 16 / React 19 frontend scaffold with Tailwind CSS 4 CSS-first config, Geist font, TanStack Query v5, Axios JWT interceptor, all UI-SPEC design tokens, and TypeScript type contracts**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-20T18:21:26Z
- **Completed:** 2026-05-20T18:24:58Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- Next.js 16.2.6 / React 19 project compiles (`npm run build` exits 0) and TypeScript strict mode passes
- Tailwind CSS 4 CSS-first: `@import "tailwindcss"` in globals.css — no `tailwind.config.js`
- Root layout wires QueryProvider, ThemeProvider (system OS default), Sonner Toaster (top-right)
- Axios singleton injects JWT Bearer header from `localStorage.getItem('jwt_token')` and redirects to `/login?reason=session-expired` on 401
- Full design token set from UI-SPEC: light (#FFFFFF background, #F4F6F9 surface, #1D4ED8 accent) and dark (#0A0A0A, #141414, #3B82F6) via CSS custom properties
- Glassmorphism utility: `backdrop-filter: blur(12px)`, `rgba(255,255,255,0.6)` light / `rgba(10,10,10,0.6)` dark
- CTA gradient: `linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)`
- TypeScript interfaces covering User, auth requests/responses, Classification, PagedResponse, ErrorResponse — matching TechArch §4.2

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Next.js 16 project with all dependencies** - `a3de844` (feat)
2. **Task 2: Global CSS, root layout, data layer, types** - `bc690fe` (feat)

**Plan metadata:** (see docs commit below)

## Files Created/Modified

- `frontend/package.json` - Dependencies: Next.js 16, React 19, Tailwind CSS 4, TanStack Query v5, Axios, geist, next-themes, sonner, Radix UI, lucide-react
- `frontend/tsconfig.json` - TypeScript strict mode, bundler moduleResolution, @/* path aliases
- `frontend/next.config.ts` - API proxy rewrite to NEXT_PUBLIC_API_URL
- `frontend/.env.local` - NEXT_PUBLIC_API_URL=http://localhost:8080
- `frontend/src/app/globals.css` - Tailwind CSS 4 CSS-first + all UI-SPEC design tokens (light + dark)
- `frontend/src/app/layout.tsx` - Root layout: QueryProvider, ThemeProvider, Toaster, Geist font vars
- `frontend/src/lib/api.ts` - Axios singleton with JWT Bearer interceptor and 401 handler
- `frontend/src/lib/query-client.tsx` - TanStack Query v5 QueryClient factory + QueryProvider
- `frontend/src/types/api.ts` - PagedResponse<T>, ErrorResponse, FieldError, ApiResponse<T>
- `frontend/src/types/user.ts` - User, LoginResponse, RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
- `frontend/src/types/classification.ts` - Classification, ClassificationStatus, ClassificationFilters, ClassificationStatistics
- `frontend/src/hooks/useAuth.ts` - JWT parse, isAuthenticated, hasRole, setTokens, clearTokens
- `frontend/src/app/page.tsx` - Placeholder (Plan 06)
- `frontend/src/app/(auth)/login/page.tsx` - Placeholder (Plan 06)
- `frontend/src/app/(protected)/layout.tsx` - Placeholder auth guard (Plan 07)
- `frontend/src/app/(protected)/dashboard/page.tsx` - Placeholder (Phase 2+)

## Decisions Made

- **query-client.tsx extension:** `query-client.ts` renamed to `.tsx` — the file contains JSX (`<QueryClientProvider>`) and TypeScript compiler rejects JSX in `.ts` files. This is a correctness fix, not a deviation.
- **geist npm package:** Used `geist/font/sans` and `geist/font/mono` as specified in plan (not `next/font/google` — the geist npm package provides a Next.js-compatible font loader)
- **ThemeProvider defaultTheme=system:** Per UI-SPEC User Decision #2 — adaptive theming respects OS preference

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed query-client.ts to query-client.tsx**
- **Found during:** Task 2 (first `npm run build`)
- **Issue:** File contained JSX (`<QueryClientProvider>`) but had `.ts` extension; Turbopack build failed with "Expected '>', got 'ident'" parse error
- **Fix:** Renamed file to `query-client.tsx` — TypeScript bundler resolution handles extensionless imports (`@/lib/query-client`) so layout.tsx import was unaffected
- **Files modified:** `frontend/src/lib/query-client.tsx` (renamed from .ts)
- **Verification:** `npm run build` exits 0, `tsc --noEmit` passes
- **Committed in:** bc690fe (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary file extension correction; no scope creep; all specified functionality delivered.

## Issues Encountered

None beyond the auto-fixed `.ts` → `.tsx` rename.

## User Setup Required

None - no external service configuration required. `.env.local` is pre-populated with localhost defaults for development.

## Next Phase Readiness

- Frontend foundation complete; ready for Plan 03 and beyond
- Auth UI plans (Plans 06–07) can build on this scaffold immediately
- `api.ts` is the canonical HTTP client — all future plans should import from `@/lib/api`
- `useAuth` hook provides token management; Plans 06–07 will call `setTokens` on login and `clearTokens` on logout
- Design tokens locked in globals.css — implement components using `var(--color-*)` CSS properties

---
*Phase: 01-foundation*
*Completed: 2026-05-20*

## Self-Check: PASSED

All key files found on disk. Both task commits (a3de844, bc690fe) verified in git history.
