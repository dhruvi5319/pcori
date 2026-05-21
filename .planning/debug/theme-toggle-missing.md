---
status: diagnosed
trigger: "Theme toggle not visible in header — UAT Test 14 Phase 1"
created: 2026-05-21T00:00:00Z
updated: 2026-05-21T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED — ThemeToggle is only rendered inside the (protected) layout, which requires authentication. UAT Test 14 was likely run without being logged in, or on a public/auth route.
test: Traced full render tree: root layout → (protected)/layout.tsx → AppShellInner → AppHeader → ThemeToggle
expecting: N/A — root cause confirmed
next_action: Return ROOT CAUSE FOUND diagnosis

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: Theme toggle button is visible in the app header and cycles between light, dark, and system themes
actual: No theme toggle visible
errors: (none reported — visual/UI absence)
reproduction: Test 14 in Phase 1 UAT
started: Found during UAT

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: ThemeToggle component does not exist
  evidence: File exists at frontend/src/components/layout/ThemeToggle.tsx (31 lines, fully implemented)
  timestamp: 2026-05-21T00:01:00Z

- hypothesis: ThemeToggle is not imported/rendered in AppHeader
  evidence: AppHeader.tsx line 4 imports ThemeToggle; line 40 renders <ThemeToggle /> in the right-controls div
  timestamp: 2026-05-21T00:01:00Z

- hypothesis: ThemeProvider is missing (so useTheme() would fail silently)
  evidence: Root layout.tsx wraps the entire app in <ThemeProvider> with attribute="class", defaultTheme="system", enableSystem — correctly configured
  timestamp: 2026-05-21T00:01:00Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-05-21T00:01:00Z
  checked: frontend/src/components/layout/ThemeToggle.tsx
  found: Component fully implemented. Uses useTheme() from next-themes. Renders a button with Sun/Moon/Monitor icon that cycles light→dark→system on click.
  implication: The component itself is correct and functional.

- timestamp: 2026-05-21T00:01:00Z
  checked: frontend/src/components/layout/AppHeader.tsx
  found: AppHeader imports ThemeToggle (line 4) and renders it at line 40 in the right-side controls group (<div className="flex items-center gap-1">).
  implication: The header correctly includes ThemeToggle. If AppHeader renders, ThemeToggle renders.

- timestamp: 2026-05-21T00:01:00Z
  checked: frontend/src/app/layout.tsx (root layout)
  found: ThemeProvider from next-themes wraps the entire app. QueryProvider and Toaster also present. No AppHeader rendered here.
  implication: Theme infrastructure is correctly provided app-wide.

- timestamp: 2026-05-21T00:01:00Z
  checked: frontend/src/app/(protected)/layout.tsx
  found: AppHeader is ONLY rendered inside the (protected) route group's layout. This layout has an auth guard: useAuth().isAuthenticated() is checked in a useEffect. If not authenticated, the component returns a loading spinner and redirects to /login. If authenticated, AppShellInner renders AppSidebar + AppHeader + main content.
  implication: The AppHeader (and therefore ThemeToggle) is ONLY visible to authenticated users inside /dashboard and other (protected) routes.

- timestamp: 2026-05-21T00:01:00Z
  checked: frontend/src/app/page.tsx (landing page)
  found: Landing page has its own <nav> with Login/Sign Up links. No ThemeToggle rendered. No AppHeader used.
  implication: Public routes (landing, /login, /signup, /forgot-password, etc.) never render AppHeader or ThemeToggle.

- timestamp: 2026-05-21T00:01:00Z
  checked: grep for AppHeader/ThemeToggle across all app routes
  found: AppHeader and ThemeToggle only appear in (protected)/layout.tsx. Zero occurrences in any auth or public route.
  implication: Conclusive — theme toggle is invisible on any non-authenticated view.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: ThemeToggle is scoped exclusively to the authenticated (protected) layout. It only renders inside AppHeader, which is only rendered by (protected)/layout.tsx for logged-in users. The UAT tester (Test 14) was viewing a public route (landing page, login, or other auth page) where no AppHeader is mounted — so no ThemeToggle is visible. Additionally, the landing page has its own <nav> that has no ThemeToggle whatsoever.

fix: (not applied — diagnose only mode)
  Two possible fix directions:
  1. Add ThemeToggle to the public landing page nav (app/page.tsx) and potentially the auth layout if one exists.
  2. If UAT is testing the authenticated dashboard, the test needs to be run while logged in so the (protected) layout renders.

verification: (not applied)

files_changed: []
