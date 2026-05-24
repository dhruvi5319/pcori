---
phase: 03-insights
plan: "09"
subsystem: ui
tags: [react, nextjs, tanstack-query, radix-ui, tailwind, pipeline, monitoring]

# Dependency graph
requires:
  - phase: 03-02
    provides: CSS tokens, Radix Dialog, skeleton-shimmer utility
  - phase: 03-06
    provides: Pipeline backend endpoints (/api/pipeline/status, /api/pipeline/{id}/logs, etc.)
provides:
  - Data pipeline monitoring page at /data-pipeline with all 7 layout zones
  - PipelineStatusHeader with colored state indicator and live stats
  - StageCard with 4px color-coded left border per state
  - PipelineControlActions with ADMIN-only visibility and Radix Dialog confirmations
  - PipelineLogsPanel collapsible 240px/480px with Geist Mono + INFO/WARN/ERROR color coding
  - RunHistoryTable with E1 surface rows
  - DbHealthPanel showing connection pool stats
  - usePipeline hooks with 10s polling when RUNNING
  - Playwright e2e tests for data-pipeline page
affects: [03-verify, phase-4]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PipelineState color map used as single source of truth for dots, borders, and text"
    - "refetchInterval computed fn: polls only when state=RUNNING, false otherwise"
    - "Radix Dialog for destructive confirmations: Stop and Sync require confirmation before mutation"
    - "ADMIN role check via useAuth().hasRole('ADMIN') JWT claims"

key-files:
  created:
    - frontend/src/types/pipeline.ts
    - frontend/src/hooks/usePipeline.ts
    - frontend/src/components/pipeline/PipelineStatusHeader.tsx
    - frontend/src/components/pipeline/StageCardsRow.tsx
    - frontend/src/components/pipeline/StageCard.tsx
    - frontend/src/components/pipeline/PipelineControlActions.tsx
    - frontend/src/components/pipeline/PipelineLogsPanel.tsx
    - frontend/src/components/pipeline/RunHistoryTable.tsx
    - frontend/src/components/pipeline/DbHealthPanel.tsx
    - frontend/src/components/pipeline/StopConfirmDialog.tsx
    - frontend/src/components/pipeline/SyncConfirmDialog.tsx
    - frontend/src/components/pipeline/StageRetryConfirmDialog.tsx
    - frontend/src/app/(protected)/data-pipeline/page.tsx
    - e2e/data-pipeline.spec.ts
  modified: []

key-decisions:
  - "PIPELINE_STATE_COLORS and STAGE_STATE_COLORS exported from types/pipeline.ts as single source of truth for all color-coded UI elements"
  - "usePipelineStatus fetches PipelineFullStatus (status + stages combined) to avoid two separate requests on page load"
  - "PipelineControlActions renders null (not disabled) when isAdmin=false — control section not visible to non-admins"
  - "E2e tests written as artifacts; Playwright execution deferred to verify phase per test execution boundary rules"

patterns-established:
  - "Pipeline hook pattern: refetchInterval computed fn returns ms when RUNNING, false otherwise (same pattern as useClassifications)"
  - "Confirm-before-mutate pattern: destructive/irreversible actions use Radix Dialog with safe default button autoFocused"
  - "Pipeline page skeleton: matches layout zones (status header + 3 stage card placeholders)"

# Metrics
duration: 4min
completed: 2026-05-24
---

# Phase 3 Plan 9: Data Pipeline Page Summary

**Full /data-pipeline monitoring page with color-coded stage cards, ADMIN control actions with Radix Dialog confirmation, collapsible Geist Mono logs panel, and usePipeline hooks polling every 10s when RUNNING**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-24T00:51:14Z
- **Completed:** 2026-05-24T00:55:31Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Complete /data-pipeline page with all 7 layout zones: page header, status header, stuck records warning, admin control actions, 3 stage cards, DB health panel, tabbed logs/history
- Pipeline type system (PipelineState, StageState, LogLevel) with PIPELINE_STATE_COLORS as single source of truth for dots, borders, and text
- usePipeline hooks with smart polling (refetchInterval: 10s when RUNNING, false otherwise)
- StageCard with 4px color-coded left border, stuck records amber banner, FAILED retry button
- PipelineControlActions: ADMIN-only, button visibility matrix per pipeline state, Stop and Sync require Radix Dialog confirmation
- PipelineLogsPanel: collapsible 240px/480px with Geist Mono + INFO/WARN/ERROR color coding
- 5 Playwright e2e tests covering all key interactions

## Task Commits

Each task was committed atomically:

1. **Task 1: Pipeline types, hooks, and all sub-components** - `e5a173e` (feat)
2. **Task 2: Data Pipeline page.tsx + Playwright e2e tests** - `b89001d` (feat)

**Plan metadata:** (docs commit follows)

_Note: E2E tests written as artifacts; execution deferred to verify phase_

## Files Created/Modified
- `frontend/src/types/pipeline.ts` - PipelineState/StageState/LogLevel types with color maps
- `frontend/src/hooks/usePipeline.ts` - usePipelineStatus, usePipelineLogs, usePipelineHistory, useDbHealth, usePipelineControl with sonner toasts
- `frontend/src/components/pipeline/PipelineStatusHeader.tsx` - E2 raised card, 80px height, colored state dot + stats
- `frontend/src/components/pipeline/StageCard.tsx` - E2 raised card, 4px left border, stuck banner, retry button
- `frontend/src/components/pipeline/StageCardsRow.tsx` - grid-cols-3 wrapper
- `frontend/src/components/pipeline/PipelineControlActions.tsx` - ADMIN-only button group with visibility matrix
- `frontend/src/components/pipeline/PipelineLogsPanel.tsx` - collapsible Geist Mono log panel with pagination
- `frontend/src/components/pipeline/RunHistoryTable.tsx` - E1 surface run history table
- `frontend/src/components/pipeline/DbHealthPanel.tsx` - DB connection pool display
- `frontend/src/components/pipeline/StopConfirmDialog.tsx` - Radix Dialog confirmation for stop action
- `frontend/src/components/pipeline/SyncConfirmDialog.tsx` - Radix Dialog confirmation for sync action
- `frontend/src/components/pipeline/StageRetryConfirmDialog.tsx` - Radix Dialog confirmation for stage retry
- `frontend/src/app/(protected)/data-pipeline/page.tsx` - Full page with all 7 zones, loading/error states
- `e2e/data-pipeline.spec.ts` - 5 Playwright tests: page load, 3 stage cards, tabs, stop dialog, logs panel

## Decisions Made
- `PIPELINE_STATE_COLORS` and `STAGE_STATE_COLORS` exported from `types/pipeline.ts` as a single source of truth for all color-coded UI elements (dots, borders, badge text)
- `usePipelineStatus` fetches combined `PipelineFullStatus` (status + stages) from single endpoint to avoid two requests on page load
- `PipelineControlActions` renders `null` when `isAdmin=false` — control section completely hidden for non-admins, not disabled
- E2e tests written as deliverable artifacts; Playwright execution deferred to verify phase per test execution boundary rules

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None — TypeScript compiled clean; all 14 files created as specified.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Data pipeline monitoring page complete and ready for verify phase testing
- All FR-5.1–FR-5.5 features implemented (view status, admin controls, stage retry, logs, run history, DB health)
- Playwright e2e tests ready for execution in verify phase

## Self-Check: PASSED

- All 14 key files present on disk ✓
- Commits e5a173e and b89001d found in git log ✓
- TypeScript compiled clean (tsc --noEmit passed) ✓
