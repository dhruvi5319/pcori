---
phase: 02-classification-pipeline
plan: "05"
subsystem: classification
tags: [next-js, react, tanstack-query, tailwind, playwright, typescript]

# Dependency graph
requires:
  - phase: 02-classification-pipeline
    plan: "04"
    provides: "ClassificationController GET /api/classifications with PagedResponse<Classification>"
  - phase: 01-foundation
    provides: "App Shell layout, TanStack Query provider, Axios api client, cn util, next-themes"
provides:
  - "/classifications list page with 7-column sortable table"
  - "StatusBadge with PROCESSING animate-ping pulse ring"
  - "useClassifications TanStack Query hook with staleTime:10s and conditional 5s polling"
  - "ClassificationFilterBar with URL-persisted filter state via useSearchParams"
  - "FilterChip removable active filter chips"
  - "UrgentAlertBar for NEEDS_REVIEW and FAILED counts"
  - "ClassificationRow with E1/E2 elevation hover lift and fade-in action icons"
  - "ClassificationsTable with sticky header and empty/skeleton states"
  - "TableSkeletonRows with 5 animate-pulse skeleton rows"
  - "EmptyClassificationsState (no data + filtered variants)"
  - "TablePagination with 44px WCAG touch target"
  - "Playwright e2e tests covering all 8 classification list scenarios"
affects: [02-06, 02-07, 03-admin-portal, 04-reporting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TanStack Query conditional refetchInterval: polls every 5s only when any row has PROCESSING status"
    - "URL-persisted filter state: useSearchParams + router.push for browser back/forward support"
    - "Tailwind group + group-hover: action icons opacity-0 → group-hover:opacity-100"
    - "E1/E2 elevation via custom shadow Tailwind classes; hover:-translate-y-[1px] for lift effect"
    - "animate-ping ring for PROCESSING status dot: absolute span with opacity-75 animate-ping"

key-files:
  created:
    - frontend/src/types/classification.ts (updated: added UploadResponse, ManualOverrideRequest)
    - frontend/src/components/shared/StatusBadge.tsx
    - frontend/src/hooks/useClassifications.ts
    - frontend/src/components/classifications/ClassificationFilterBar.tsx
    - frontend/src/components/classifications/FilterChip.tsx
    - frontend/src/components/classifications/UrgentAlertBar.tsx
    - frontend/src/components/classifications/ClassificationRow.tsx
    - frontend/src/components/classifications/ClassificationsTable.tsx
    - frontend/src/components/classifications/TableSkeletonRows.tsx
    - frontend/src/components/classifications/EmptyClassificationsState.tsx
    - frontend/src/components/classifications/TablePagination.tsx
    - frontend/src/app/(protected)/classifications/page.tsx
    - frontend/src/app/(protected)/classifications/loading.tsx
    - e2e/classifications-list.spec.ts
  modified:
    - frontend/src/lib/utils.ts (added formatRelativeDate helper)

key-decisions:
  - "E2e Playwright tests written as artifacts; execution deferred to verify phase per test execution boundary rules"
  - "formatRelativeDate added to lib/utils.ts — no external date library needed for simple relative dates"
  - "ClassificationsTable passes onUpload/onClearFilters props to EmptyClassificationsState for CTA wiring"

patterns-established:
  - "URL filter persistence: build filters object from useSearchParams() + updateParam() helper pattern"
  - "Polling pattern: refetchInterval returns 5000 when any content row has PROCESSING status, false otherwise"
  - "Group hover action icons: opacity-0 group-hover:opacity-100 transition-opacity"

# Metrics
duration: 4min
completed: 2026-05-23
---

# Phase 2 Plan 05: Classifications List Page Summary

**`/classifications` list page with 7-column sortable table, URL-persisted filter state, PROCESSING animate-ping status badge, E1/E2 elevation hover rows, skeleton rows, empty states, and Playwright e2e test coverage**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-23T20:45:33Z
- **Completed:** 2026-05-23T20:50:13Z
- **Tasks:** 2 completed
- **Files modified:** 15

## Accomplishments
- `/classifications` page renders with URL-persisted filter state — browser back/forward restores filters
- StatusBadge PROCESSING variant shows animated blue pulse ring (animate-ping) per UI-SPEC CSS
- ClassificationRow has E1/E2 elevation shadow + translateY(-1px) hover lift + opacity-0→1 action icons
- useClassifications hook polls every 5s when any row has PROCESSING status; stops on all-terminal
- Playwright e2e test file covers all 8 scenarios: title/CTA, empty state, filtered empty state, PROCESSING badge, URL filter persistence, chip removal, skeleton rows, row hover actions

## Task Commits

Each task was committed atomically:

1. **Task 1: TypeScript types, StatusBadge, useClassifications hook, ClassificationFilterBar + FilterChip** - `147c871` (feat)
2. **Task 2: ClassificationsTable, ClassificationRow, TablePagination, skeletons, empty states, page, Playwright** - `e84f469` (feat)

**Plan metadata:** _(docs commit follows)_

_Note: Playwright e2e tests written as artifact files; execution deferred to verify phase per test execution boundary rules._

## Files Created/Modified
- `frontend/src/types/classification.ts` - Updated to match TechArch §4.2: added UploadResponse, ManualOverrideRequest
- `frontend/src/lib/utils.ts` - Added formatRelativeDate helper (no external dependency)
- `frontend/src/components/shared/StatusBadge.tsx` - Color-coded badge; PROCESSING gets animate-ping ring
- `frontend/src/hooks/useClassifications.ts` - TanStack Query hook with staleTime:10s and conditional polling
- `frontend/src/components/classifications/ClassificationFilterBar.tsx` - Status/date/keyword filter bar with URL params
- `frontend/src/components/classifications/FilterChip.tsx` - Removable active filter chip (28px height per UI-SPEC)
- `frontend/src/components/classifications/UrgentAlertBar.tsx` - Alert bar for NEEDS_REVIEW/FAILED counts
- `frontend/src/components/classifications/ClassificationRow.tsx` - 52px row with hover lift + fade action icons
- `frontend/src/components/classifications/ClassificationsTable.tsx` - Sticky header, E1 rows, sort indicators
- `frontend/src/components/classifications/TableSkeletonRows.tsx` - 5 animate-pulse skeleton rows
- `frontend/src/components/classifications/EmptyClassificationsState.tsx` - FileSearch + SearchX empty states
- `frontend/src/components/classifications/TablePagination.tsx` - 44px WCAG pagination control
- `frontend/src/app/(protected)/classifications/page.tsx` - Main page composing all components
- `frontend/src/app/(protected)/classifications/loading.tsx` - Route segment loading fallback
- `e2e/classifications-list.spec.ts` - 8 Playwright test cases for all UI-SPEC behaviors

## Decisions Made
- E2e Playwright tests written as artifact files; execution deferred to verify phase per test execution boundary rules
- Added `formatRelativeDate` to `lib/utils.ts` — simple date-diff string without adding a date library dependency
- `ClassificationsTable` accepts optional `onUpload` and `onClearFilters` props so `EmptyClassificationsState` CTAs are wired through properly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `formatRelativeDate` to `lib/utils.ts`**
- **Found during:** Task 2 (ClassificationRow implementation)
- **Issue:** `ClassificationRow.tsx` imports `formatRelativeDate` from `@/lib/utils` but the function didn't exist — would cause TypeScript compile error
- **Fix:** Added `formatRelativeDate(isoDate: string): string` to `lib/utils.ts` — computes human-readable relative time without external dependency
- **Files modified:** `frontend/src/lib/utils.ts`
- **Verification:** `npx tsc --noEmit` passes; `npx next build` succeeds
- **Committed in:** `147c871` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required fix for TypeScript compilation. No scope creep — function was implied by the ClassificationRow code in the plan.

## Issues Encountered
None — plan executed as written with one blocking fix for the missing `formatRelativeDate` utility.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `/classifications` list page fully functional: table, filters, filter chips, alert bar, empty states, pagination
- `useClassifications` hook ready for polling integration
- Playwright tests written and ready for verify phase execution
- Plan 06 can wire UploadPlanDialog, ViewClassificationDialog, and ManualOverrideDialog using the `uploadDialogOpen`, `viewId`, `overrideId` state already scaffolded in `page.tsx`

---
*Phase: 02-classification-pipeline*
*Completed: 2026-05-23*
