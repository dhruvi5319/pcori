---
phase: 04-reporting-admin-polish
plan: "08"
subsystem: ui
tags: [react, next.js, radix-ui, react-markdown, accordion, tanstack-query, tailwind, playwright]

# Dependency graph
requires:
  - phase: 04-reporting-admin-polish
    provides: Help API endpoints (GET /api/help/articles, /api/help/articles/{slug}, /api/help/articles/search, /api/help/faqs, /api/help/feedback)
provides:
  - Two-pane /help page (240px sidebar + fluid article area)
  - HelpCategorySidebar with selected state matching TaxonomyTreeNode pattern
  - HelpArticleView with react-markdown and max-w-[720px] prose container
  - HelpSearchBar with 300ms debounce and ≥2 char minimum
  - FaqSection using Radix Accordion type="single" collapsible
  - FeedbackWidget with thumbs + textarea + submitted state + localStorage persistence
  - Playwright e2e tests for all help center behaviors
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - react-markdown for rendering article content with custom component overrides
    - Radix Accordion.Root type="single" collapsible for FAQ groups
    - FeedbackWidget 4-state machine (default→helpful/not-helpful-selected→submitted)
    - localStorage feedback persistence pattern (feedback-{articleId} = "submitted")
    - 300ms debounce via useEffect + setTimeout (not debounced input value)
    - CSS .faq-chevron [data-state="open"] rotate(90deg) for chevron animation

key-files:
  created:
    - frontend/src/types/help.ts
    - frontend/src/hooks/useHelp.ts
    - frontend/src/app/(protected)/help/page.tsx
    - frontend/src/app/(protected)/help/loading.tsx
    - frontend/src/components/help/HelpCategorySidebar.tsx
    - frontend/src/components/help/HelpArticleView.tsx
    - frontend/src/components/help/HelpArticleSkeleton.tsx
    - frontend/src/components/help/HelpSearchBar.tsx
    - frontend/src/components/help/HelpSearchResults.tsx
    - frontend/src/components/help/HelpEmptyState.tsx
    - frontend/src/components/help/FaqSection.tsx
    - frontend/src/components/help/FaqCategoryGroup.tsx
    - frontend/src/components/help/FaqItem.tsx
    - frontend/src/components/help/FeedbackWidget.tsx
    - frontend/e2e/help.spec.ts
  modified:
    - frontend/src/app/globals.css

key-decisions:
  - "react-markdown v9 ships own TypeScript types — no @types/react-markdown needed (already recorded in STATE.md)"
  - "FeedbackWidget uses localStorage key 'feedback-{articleId}' for session persistence — avoids API round-trip on re-render"
  - "409 Conflict from POST /api/help/feedback treated as success in UX — duplicate submission shows submitted state, not error"
  - "FAQ chevron rotation via CSS .faq-chevron + [data-state='open'] rule in globals.css — Radix data-state attribute drives animation"

patterns-established:
  - "Help sidebar selected state: bg-[#EFF6FF] border-l-[3px] border-[#1D4ED8] — identical to TaxonomyTreeNode selected state"
  - "HelpSearchBar: debounce via useEffect+setTimeout, not debounced input; results overlay only shown when debouncedQuery.length >= 2"

# Metrics
duration: 4min
completed: 2026-05-24
---

# Phase 4 Plan 08: Help Center Frontend Summary

**Two-pane Help Center with react-markdown article viewer, Radix Accordion FAQs, 4-state FeedbackWidget with localStorage persistence, and 300ms debounced search — 15 files, TypeScript clean**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-24T04:04:14Z
- **Completed:** 2026-05-24T04:08:15Z
- **Tasks:** 2
- **Files modified:** 16 (15 new + globals.css)

## Accomplishments

- Complete `/help` two-pane layout: 240px fixed sidebar (categories + article links) + fluid article area with search, article view, and FAQ section
- `HelpArticleView` renders article.content via ReactMarkdown with custom component overrides; max-w-[720px] container with line-height 1.6
- `HelpSearchBar` enforces ≥2 char minimum with inline "Type at least 2 characters" message; 300ms debounce before search fires; results overlay with click-outside/Escape dismissal
- `FaqSection` uses Radix `Accordion.Root type="single" collapsible`; ChevronRight rotates 90° on open via `.faq-chevron` CSS class in globals.css
- `FeedbackWidget` cycles through 4 states: default → helpful/not-helpful-selected → submitted; submitted state shows CheckCircle2 + "Thank you for your feedback!"; 409 duplicate handled gracefully; localStorage prevents re-display

## Task Commits

Each task was committed atomically:

1. **Task 1: Types, hooks, help page, sidebar, article view, and search** - `e2e222d` (feat)
2. **Task 2: FaqSection (Radix Accordion), FeedbackWidget, and Playwright tests** - `56c6a93` (feat)

**Plan metadata:** (docs commit follows)

_Note: Playwright e2e tests written as artifacts; execution deferred to verify phase per test execution boundary rules._

## Files Created/Modified

- `frontend/src/types/help.ts` — HelpArticle, Faq, FeedbackResponse interfaces
- `frontend/src/hooks/useHelp.ts` — HELP_KEYS factory + 6 hooks (useArticles, useArticle, useSearchArticles, useFaqs, useArticleFeedback, useSubmitFeedback)
- `frontend/src/app/(protected)/help/page.tsx` — Two-pane Help Center page with auto-select first article
- `frontend/src/app/(protected)/help/loading.tsx` — Next.js loading UI: sidebar + article skeletons
- `frontend/src/components/help/HelpCategorySidebar.tsx` — Articles grouped by category, selected state = TaxonomyTreeNode pattern
- `frontend/src/components/help/HelpArticleView.tsx` — react-markdown with custom h2/p/code components, max-w-[720px]
- `frontend/src/components/help/HelpArticleSkeleton.tsx` — Title rect + 4 content rects; HelpSidebarSkeleton (8 rectangles)
- `frontend/src/components/help/HelpSearchBar.tsx` — 300ms debounce, ≥2 char check, results overlay, click-outside/Escape close
- `frontend/src/components/help/HelpSearchResults.tsx` — listbox role, matched term highlight, empty state + Contact Support link
- `frontend/src/components/help/HelpEmptyState.tsx` — BookOpen icon + no articles message
- `frontend/src/components/help/FaqSection.tsx` — useFaqs, category grouping, loading skeleton, error retry
- `frontend/src/components/help/FaqCategoryGroup.tsx` — Accordion.Root type="single" collapsible per category
- `frontend/src/components/help/FaqItem.tsx` — Accordion.Item with ChevronRight faq-chevron rotation
- `frontend/src/components/help/FeedbackWidget.tsx` — 4-state machine: default/helpful-selected/not-helpful-selected/submitted
- `frontend/e2e/help.spec.ts` — 5 Playwright tests: layout, search min length, search results, FAQ, feedback widget
- `frontend/src/app/globals.css` — Added .faq-chevron and [data-state="open"] .faq-chevron rules

## Decisions Made

- **react-markdown v9 TypeScript types**: Ships built-in — no @types/react-markdown required (already in STATE.md from plan 04-07)
- **FeedbackWidget localStorage**: Key `feedback-{articleId}` set to "submitted" after success — persists across page navigation without API round-trip
- **409 Conflict → submitted state**: Duplicate feedback submission treated as UX success — no error toast, widget shows submitted state
- **FAQ chevron CSS**: `.faq-chevron` class + `[data-state="open"] .faq-chevron { transform: rotate(90deg) }` in globals.css — Radix data-state attribute drives the animation cleanly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 4 is now complete — all 8 plans executed
- Help Center frontend fully implemented with FR-9.1 (browse articles/FAQs) and FR-9.2 (submit feedback)
- All 15 planned files created; TypeScript compiles cleanly
- Playwright e2e tests written and ready for verify phase execution

---
*Phase: 04-reporting-admin-polish*
*Completed: 2026-05-24*

## Self-Check: PASSED

All 15 key files exist on disk. Both task commits (e2e222d, 56c6a93) verified in git log.
