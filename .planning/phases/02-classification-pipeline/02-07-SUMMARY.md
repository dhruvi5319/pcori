---
phase: 02-classification-pipeline
plan: "07"
subsystem: ui
tags: [react, next-js, tanstack-query, react-hook-form, radix-ui, tailwind, taxonomy, playwright]

# Dependency graph
requires:
  - phase: 02-classification-pipeline
    provides: TaxonomyController 11 REST endpoints (/api/taxonomy/**)
provides:
  - /taxonomy two-pane management page (320px left tree + fluid right detail pane)
  - TaxonomyTree + TaxonomyTreeNode: collapsible tree with CSS max-height transition
  - TaxonomySearchBar: 300ms debounced search with Loader2 spinner
  - TaxonomyDetailPane: empty state, inline edit form, node detail with action buttons
  - TaxonomyEditForm: react-hook-form, Save disabled until isDirty
  - TaxonomyAddDialog: Radix Dialog with live breadcrumb preview
  - DeactivateConfirmDialog: cascade child count warning, red bg-[#DC2626] button (not gradient)
  - useTaxonomy hook: useTaxonomyTree, useTaxonomySearch, useCreateTaxonomy, useUpdateTaxonomy, useSetTaxonomyStatus
  - TaxonomyCategory/TaxonomyTreeNode/CreateTaxonomyRequest/UpdateTaxonomyRequest TypeScript types
  - e2e/taxonomy.spec.ts: 6 Playwright tests
affects:
  - phase-3 (UI patterns established for taxonomy admin)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useTaxonomy hook pattern: TAXONOMY_KEYS query key factory, staleTime 60s for static taxonomy data"
    - "Two-pane layout: 320px flex-shrink-0 left + flex-1 min-w-[400px] right with overflow-hidden parent"
    - "CSS max-height transition for tree expand/collapse (no JS height measurement)"
    - "Inline edit mode: state-driven component swap inside same pane (no dialog)"
    - "Radix Dialog for Add/Deactivate modals — consistent with plan 06 patterns"

key-files:
  created:
    - frontend/src/types/taxonomy.ts
    - frontend/src/hooks/useTaxonomy.ts
    - frontend/src/components/taxonomy/TaxonomyTree.tsx
    - frontend/src/components/taxonomy/TaxonomyTreeNode.tsx
    - frontend/src/components/taxonomy/TaxonomySearchBar.tsx
    - frontend/src/components/taxonomy/TaxonomyDetailPane.tsx
    - frontend/src/components/taxonomy/TaxonomyEditForm.tsx
    - frontend/src/components/taxonomy/TaxonomyAddDialog.tsx
    - frontend/src/components/taxonomy/DeactivateConfirmDialog.tsx
    - frontend/src/app/(protected)/taxonomy/page.tsx
    - frontend/src/app/(protected)/taxonomy/loading.tsx
    - e2e/taxonomy.spec.ts
  modified: []

key-decisions:
  - "CSS max-height transition (0→9999px) used for tree expand/collapse — no JS ResizeObserver needed; matches UI-SPEC 0.2s ease"
  - "Playwright E2E tests written as artifacts; execution deferred to verify phase per test execution boundary rules"
  - "isAdmin hardcoded to true in taxonomy page.tsx — role-gating from JWT context deferred to Phase 3"
  - "useTaxonomySearch enabled only when q.length > 0 to avoid unnecessary API calls on empty input"

patterns-established:
  - "Pattern: query key factory (TAXONOMY_KEYS) with typed const arrays — matches useClassifications pattern from plan 05/06"
  - "Pattern: inline edit mode via boolean state (isEditing) in detail pane — no separate route/dialog needed"
  - "Pattern: Radix Dialog.Root open/onOpenChange for deactivate confirm — same pattern as plan 06 dialogs"

# Metrics
duration: 4min
completed: 2026-05-23
---

# Phase 2 Plan 07: Taxonomy Management UI Summary

**Two-pane /taxonomy management page with collapsible tree, inline edit, Add Category dialog with live breadcrumb, and Deactivate confirm with cascade warning — all matching UI-SPEC §Screen 5 exactly**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-23T20:45:34Z
- **Completed:** 2026-05-23T20:50:11Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Full taxonomy management page with 320px left tree pane + fluid right detail pane
- TaxonomyTreeNode with chevron toggle, opacity-50 inactive nodes, selected `bg-[#EFF6FF] border-l-[3px] border-[#1D4ED8]`, CSS max-height transition
- TaxonomySearchBar with 300ms debounce, Loader2 spinner during fetch, results showing CODE — Name format
- TaxonomyDetailPane: empty state, inline edit form (Save disabled until dirty), node detail with E2 raised card
- TaxonomyAddDialog: live breadcrumb preview `Root > [Parent] > [Code]` updating on keystroke
- DeactivateConfirmDialog: cascade child count warning (amber), red `bg-[#DC2626]` button (NOT gradient), dismiss autoFocus
- useTaxonomy hook covering all 5 mutations/queries with toast success/error feedback
- 6 Playwright tests covering all key flows

## Task Commits

Each task was committed atomically:

1. **Task 1: TypeScript types, useTaxonomy hook, TaxonomyTree + TaxonomyTreeNode + TaxonomySearchBar** - `c6d5ffa` (feat)
2. **Task 2: TaxonomyDetailPane, EditForm, AddDialog, DeactivateDialog + /taxonomy page + Playwright** - `f260b29` (feat)

**Plan metadata:** (see below)

_Note: Task 2 files were committed atomically in f260b29; the plan 02-07 metadata commit is separate._

## Files Created/Modified

- `frontend/src/types/taxonomy.ts` - TaxonomyCategory, TaxonomyTreeNode, CreateTaxonomyRequest, UpdateTaxonomyRequest interfaces
- `frontend/src/hooks/useTaxonomy.ts` - TAXONOMY_KEYS factory + 5 hooks: useTaxonomyTree (staleTime 60s), useTaxonomySearch, useCreateTaxonomy, useUpdateTaxonomy, useSetTaxonomyStatus
- `frontend/src/components/taxonomy/TaxonomyTree.tsx` - Full tree from API with skeleton loading
- `frontend/src/components/taxonomy/TaxonomyTreeNode.tsx` - Chevron toggle, indent lines, selected state, inactive opacity
- `frontend/src/components/taxonomy/TaxonomySearchBar.tsx` - 300ms debounce, spinner, results list
- `frontend/src/components/taxonomy/TaxonomyDetailPane.tsx` - Empty state, inline edit, detail view with action buttons
- `frontend/src/components/taxonomy/TaxonomyEditForm.tsx` - react-hook-form, Save disabled until isDirty
- `frontend/src/components/taxonomy/TaxonomyAddDialog.tsx` - Radix Dialog, live breadcrumb preview
- `frontend/src/components/taxonomy/DeactivateConfirmDialog.tsx` - Cascade warning, red bg-[#DC2626] button
- `frontend/src/app/(protected)/taxonomy/page.tsx` - Two-pane layout, page header with Add Category CTA
- `frontend/src/app/(protected)/taxonomy/loading.tsx` - Skeleton pulse fallback
- `e2e/taxonomy.spec.ts` - 6 Playwright tests

## Decisions Made

- **CSS max-height transition**: Used `max-height: 0 → 9999px` with `transition-all duration-200 ease` for tree expand/collapse. No JS height measurement needed. Matches UI-SPEC 0.2s ease requirement exactly.
- **isAdmin hardcoded true**: Role-gating from JWT auth context deferred — `isAdmin={true}` in page.tsx with comment noting production wiring. Avoids coupling to auth context before Phase 3.
- **Inline edit mode**: `isEditing` boolean state in TaxonomyDetailPane swaps between detail view and TaxonomyEditForm in-place (no dialog). Matches UI-SPEC "edit replaces detail pane" requirement.
- **E2E tests as artifacts**: Playwright tests written but execution deferred to verify phase per test execution boundary rules.

## Deviations from Plan

None - plan executed exactly as written.

The plan provided complete, correct component code. Minor adjustments:
- Added proper TypeScript typing to `countDescendants` in DeactivateConfirmDialog (replaced `any` with `TaxonomyTreeNode[]`)
- Changed JSX string `'` to `&apos;` in TaxonomySearchBar empty state message to avoid React ESLint warning
- Imported `TaxonomyTreeNode` type explicitly in TaxonomyAddDialog and DeactivateConfirmDialog for type safety

These are minor TypeScript/JSX correctness fixes, not behavioral changes.

## Issues Encountered

None - all TypeScript checks passed on first attempt. `npx next build` succeeded with "✓ Compiled successfully in 14.5s".

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Taxonomy UI complete — Phase 2 frontend fully implemented
- All 12 files confirmed on disk, TypeScript compiles clean, Next.js build succeeds
- E2E tests ready for verify phase execution
- Phase 3 can use taxonomy components as reference for future admin screens

## Self-Check: PASSED

All 12 key files confirmed on disk:
- FOUND: frontend/src/types/taxonomy.ts
- FOUND: frontend/src/hooks/useTaxonomy.ts
- FOUND: frontend/src/components/taxonomy/TaxonomyTree.tsx
- FOUND: frontend/src/components/taxonomy/TaxonomyTreeNode.tsx
- FOUND: frontend/src/components/taxonomy/TaxonomySearchBar.tsx
- FOUND: frontend/src/components/taxonomy/TaxonomyDetailPane.tsx
- FOUND: frontend/src/components/taxonomy/TaxonomyEditForm.tsx
- FOUND: frontend/src/components/taxonomy/TaxonomyAddDialog.tsx
- FOUND: frontend/src/components/taxonomy/DeactivateConfirmDialog.tsx
- FOUND: frontend/src/app/(protected)/taxonomy/page.tsx
- FOUND: frontend/src/app/(protected)/taxonomy/loading.tsx
- FOUND: e2e/taxonomy.spec.ts

Task commits confirmed in git log:
- `c6d5ffa` — Task 1: taxonomy types, useTaxonomy hook, TaxonomyTree + TaxonomyTreeNode + TaxonomySearchBar
- `f260b29` — Task 2: TaxonomyDetailPane, EditForm, AddDialog, DeactivateDialog + /taxonomy page + Playwright

---
*Phase: 02-classification-pipeline*
*Completed: 2026-05-23*
