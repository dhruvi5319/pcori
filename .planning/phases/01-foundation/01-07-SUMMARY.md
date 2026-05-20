---
phase: 01-foundation
plan: 07
subsystem: ui
tags: [nextjs, react, typescript, tailwindcss, radix-ui, lucide-react, next-themes, sonner, playwright, glassmorphism]

# Dependency graph
requires:
  - phase: 01-02
    provides: Next.js scaffold, Axios api.ts, useAuth hook, design tokens, glass CSS utility, TypeScript type contracts
  - phase: 01-06
    provides: auth screen patterns, useAuth hook, AuthCard layout approach
provides:
  - SidebarContext (collapsed state, localStorage persistence, useSidebar hook)
  - AppSidebar (collapsible 56px/240px, glassmorphism, role-gated nav items, mobile off-canvas drawer)
  - SidebarNavItem (icon+label, 4px brand-blue left border active state, Radix Tooltip on collapsed)
  - SidebarToggle (ChevronLeft/Right, 44px WCAG touch target)
  - AppHeader (sticky 64px, glassmorphism, ThemeToggle + NotificationBell + UserMenu)
  - ThemeToggle (light/dark/system cycle via next-themes)
  - NotificationBell (placeholder, badge wired Phase 3)
  - UserMenu (Radix DropdownMenu, logout POST /api/auth/logout, 'You''ve been signed out.' toast)
  - Protected layout auth guard (redirect to /login if unauthenticated)
  - Dashboard page scaffold placeholder
  - Playwright e2e tests: 10 tests covering auth guard + sidebar + header (app-shell.spec.ts)
affects:
  - All Phase 2+ plans: every authenticated page uses this shell

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SidebarContext: collapsed state default true (icon-only), persisted localStorage key 'sidebar_collapsed'
    - AppSidebar: glass CSS utility class for glassmorphism; width transition via CSS transition-[width] 0.2s ease-out
    - Auth guard: useEffect checks isAuthenticated(); router.replace('/login') if false; spinner during check
    - Role gate: SidebarNavItem reads getClaims().roles; returns null if user lacks required role
    - UserMenu logout: api.post('/api/auth/logout') → clearTokens() → toast → router.push('/login') (ignore API errors)

key-files:
  created:
    - frontend/src/contexts/SidebarContext.tsx
    - frontend/src/components/layout/AppSidebar.tsx
    - frontend/src/components/layout/SidebarNavItem.tsx
    - frontend/src/components/layout/SidebarToggle.tsx
    - frontend/src/components/layout/AppHeader.tsx
    - frontend/src/components/layout/ThemeToggle.tsx
    - frontend/src/components/layout/NotificationBell.tsx
    - frontend/src/components/layout/UserMenu.tsx
    - e2e/app-shell.spec.ts
  modified:
    - frontend/src/app/(protected)/layout.tsx (replaced placeholder with full auth guard + AppShell)
    - frontend/src/app/(protected)/dashboard/page.tsx (replaced placeholder with scaffold)

key-decisions:
  - "LucideIcon type: SidebarNavItem accepts LucideIcon | LucideProps ComponentType — LucideIcon is ForwardRefExoticComponent, can't be assigned from generic ComponentType; fixed by using union type in IconComponent typedef"
  - "Tailwind 4 responsive prefix: 'md:pl-[56px]' as string concatenation per Tailwind 4 CSS-first pattern"
  - "E2E Playwright tests written as artifacts; execution deferred to verify phase per test execution boundary"

patterns-established:
  - "Auth guard pattern: useEffect + isAuthenticated() → router.replace('/login') + spinner until checked"
  - "Shell composition: SidebarProvider wraps AppShellInner which reads useSidebar() for padding offset"
  - "Logout pattern: api.post('/api/auth/logout') in try/finally, always clears tokens regardless of API error"

# Metrics
duration: 3min
completed: 2026-05-20
---

# Phase 1 Plan 07: App Shell Summary

**Collapsible sidebar (56px/240px glassmorphism) + sticky header + role-gated nav + logout flow completing Phase 1 — every authenticated page in Phase 2+ builds on this shell**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-20T19:00:17Z
- **Completed:** 2026-05-20T19:03:50Z
- **Tasks:** 2 auto + 1 checkpoint (human-verify)
- **Files modified:** 11

## Accomplishments

- SidebarContext with localStorage persistence, useSidebar hook, default collapsed (icon-only)
- AppSidebar with glassmorphism (glass CSS utility), 56px/240px width CSS transition, role-gated nav items, mobile off-canvas drawer with overlay
- SidebarNavItem with 4px brand-blue (#1D4ED8/#3B82F6) active left border, Radix Tooltip on collapsed state, WCAG 44px touch targets
- AppHeader sticky 64px with glassmorphism, ThemeToggle cycling light/dark/system, NotificationBell placeholder, UserMenu with Radix DropdownMenu
- UserMenu logout: POST /api/auth/logout → clearTokens() → "You've been signed out." toast → redirect /login
- Protected layout auth guard: useEffect isAuthenticated() check → router.replace('/login') if false; spinner prevents flash of content
- Dashboard page scaffold placeholder ready for Phase 2 KPIs
- 10 Playwright e2e tests covering auth guard redirect (2), sidebar visibility/role-gating (4), header controls (4)

## Task Commits

Each task was committed atomically:

1. **Task 1: SidebarContext, AppSidebar, SidebarNavItem, SidebarToggle** - `7e00b21` (feat)
2. **Task 2: AppHeader, ThemeToggle, NotificationBell, UserMenu, protected layout, e2e** - `7c74c74` (feat)

**Plan metadata:** _(docs commit to follow)_

_Note: Task 3 is a checkpoint:human-verify requiring visual confirmation of the complete App Shell._

## Files Created/Modified

- `frontend/src/contexts/SidebarContext.tsx` - Collapsed state context with localStorage persistence (default: true/collapsed)
- `frontend/src/components/layout/AppSidebar.tsx` - Collapsible sidebar: glass class, 56px↔240px transition, role-gated nav, mobile drawer
- `frontend/src/components/layout/SidebarNavItem.tsx` - Icon+label nav item: active left border, role gate, Radix Tooltip when collapsed
- `frontend/src/components/layout/SidebarToggle.tsx` - ChevronLeft/Right toggle, 44px touch target
- `frontend/src/components/layout/AppHeader.tsx` - Sticky 64px header with glassmorphism, mobile hamburger, controls cluster
- `frontend/src/components/layout/ThemeToggle.tsx` - Cycles light→dark→system via next-themes
- `frontend/src/components/layout/NotificationBell.tsx` - Bell icon placeholder (badge wired Phase 3)
- `frontend/src/components/layout/UserMenu.tsx` - Radix DropdownMenu: Profile, Settings, Sign Out with logout action
- `frontend/src/app/(protected)/layout.tsx` - Auth guard + SidebarProvider + AppShellInner (replaced placeholder)
- `frontend/src/app/(protected)/dashboard/page.tsx` - Dashboard scaffold (replaced placeholder)
- `e2e/app-shell.spec.ts` - 10 Playwright tests: auth guard, sidebar, header

## Decisions Made

- **LucideIcon type union:** SidebarNavItem uses `type IconComponent = LucideIcon | React.ComponentType<LucideProps>` — TypeScript strict rejects generic ComponentType assignment to LucideIcon (ForwardRefExoticComponent). Union type preserves type safety while accepting both forms.
- **E2E tests deferred:** Per execute phase rules, Playwright E2E tests written as artifacts but not executed. Execution deferred to verify phase which runs them with a live dev server.
- **Logout error ignored:** `api.post('/api/auth/logout')` in try/finally — always clears tokens even if API errors; per UI-SPEC the logout action is immediate (no confirmation dialog).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed LucideIcon type incompatibility in SidebarNavItem**
- **Found during:** Task 1 (TypeScript verification)
- **Issue:** Plan code used `icon: LucideIcon` in `SidebarNavItemProps` but AppSidebar cast `LucideIcon` to `React.ComponentType<{...}>` — TypeScript strict rejected the cast because `LucideIcon` is `ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>` and `ComponentType` lacks `$$typeof`
- **Fix:** Changed SidebarNavItem `icon` prop type to `type IconComponent = LucideIcon | React.ComponentType<LucideProps>`; removed all casts in AppSidebar (using `LucideIcon[]` directly in NAV_ITEMS type)
- **Files modified:** `frontend/src/components/layout/SidebarNavItem.tsx`, `frontend/src/components/layout/AppSidebar.tsx`
- **Verification:** `npx tsc --noEmit` passes; `npm run build` exits 0
- **Committed in:** `7e00b21` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary TypeScript correctness fix. No scope creep. All planned functionality delivered.

## Issues Encountered

None beyond the auto-fixed TypeScript deviation above.

## User Setup Required

None - no external service configuration required. App Shell connects to local backend at localhost:8080.

## Next Phase Readiness

- **Phase 1 complete:** All 7 plans executed. Every authenticated page in Phase 2+ can build on this shell.
- **Auth flow end-to-end:** Registration → email verify → login → /dashboard with role-gated sidebar navigation.
- **Verify phase:** 24 total Playwright e2e tests (14 auth + 10 app-shell) ready to run against live dev stack.
- **Pattern established:** Shell composition via SidebarProvider → AppShellInner; auth guard via isAuthenticated() check in useEffect.

---
*Phase: 01-foundation*
*Completed: 2026-05-20*
