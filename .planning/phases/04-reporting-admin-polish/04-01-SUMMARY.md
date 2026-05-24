---
phase: 04-reporting-admin-polish
plan: "01"
subsystem: database
tags: [flyway, postgresql, migration, reporting, help-center, tsvector, gin-index, jsonb]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: users table with UUID primary key (all FK references point here)
  - phase: 02-classification-pipeline
    provides: V4/V5 migrations (classification_schema, taxonomy_seed)
  - phase: 03-insights
    provides: V7 insights schema (V8 follows V7 sequentially)
provides:
  - report_configurations table (JSONB columns/filters, UNIQUE owner_id+name, soft-delete)
  - excel_reports table (report_status enum GENERATING/READY/FAILED, FK to report_configurations)
  - filter_configurations table (JSONB criteria, UNIQUE user_id+name, soft-delete)
  - help_articles table (TSVECTOR GIN full-text search, soft-delete, audit fields)
  - faqs table (display_order, category, soft-delete)
  - documentation_feedback table (UNIQUE article_id+user_id, CASCADE delete)
  - report_status PostgreSQL enum type
affects: [04-02, 04-03, 04-04, 04-05, 04-06, 04-07, 04-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "V8 Flyway migration skips V7 intentionally (V7 reserved for Phase 3 Insights)"
    - "TSVECTOR GENERATED ALWAYS AS STORED pattern for full-text search columns"
    - "GIN index on tsvector for efficient full-text search"
    - "Soft-delete pattern (deleted_at TIMESTAMPTZ) with partial indexes WHERE deleted_at IS NULL"
    - "JSONB columns for flexible structured data (columns, filters, criteria)"

key-files:
  created:
    - backend/src/main/resources/db/migration/V8__reporting_help_schema.sql
  modified: []

key-decisions:
  - "V8 migration number chosen intentionally — V7 is taken by Phase 3 Insights schema; no gap in application"
  - "TSVECTOR GENERATED ALWAYS AS STORED used for help_articles.search_vector — auto-updated on INSERT/UPDATE, no trigger needed"
  - "documentation_feedback.article_id ON DELETE CASCADE ensures feedback is cleaned up when articles are deleted"

patterns-established:
  - "Phase 4 all tables use soft-delete pattern (deleted_at TIMESTAMPTZ) with partial WHERE deleted_at IS NULL indexes"
  - "JSONB columns for report/filter configurations allow schema-less extension without migrations"

# Metrics
duration: 1min
completed: 2026-05-24
---

# Phase 4 Plan 01: Reporting & Help Center Schema Summary

**Flyway V8 migration creating 6 Phase 4 tables (report_configurations, excel_reports, filter_configurations, help_articles, faqs, documentation_feedback) with report_status enum and GIN full-text search index on help_articles**

## Performance

- **Duration:** 1 min
- **Started:** 2026-05-24T03:23:00Z
- **Completed:** 2026-05-24T03:23:41Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created V8 Flyway migration with complete Phase 4 database schema
- Established report_status enum (GENERATING, READY, FAILED) for excel_reports lifecycle tracking
- Implemented GIN full-text search on help_articles via TSVECTOR GENERATED ALWAYS AS STORED column
- All 6 tables use soft-delete pattern with partial indexes for query efficiency
- UNIQUE constraints match TechArch spec exactly (owner_id+name, user_id+name, article_id+user_id)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create V8 Flyway migration with Phase 4 DDL** - `452ce00` (feat)

**Plan metadata:** _(to be updated after docs commit)_

## Files Created/Modified
- `backend/src/main/resources/db/migration/V8__reporting_help_schema.sql` - Complete Phase 4 DDL: 6 tables, 1 enum, 9 indexes

## Decisions Made
- V8 migration number chosen intentionally — V7 is taken by Phase 3 Insights (V7__insights_schema.sql already exists); using V8 is correct and does not create a gap
- TSVECTOR GENERATED ALWAYS AS STORED eliminates need for triggers to maintain search_vector on help_articles
- documentation_feedback uses ON DELETE CASCADE from help_articles — feedback logically belongs to its article

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- V8 schema is the foundational dependency for all Wave 2 plans (04-02 through 04-08)
- JPA entities for report_configurations, excel_reports, filter_configurations, help_articles, faqs, and documentation_feedback can now be created
- No blockers — migration file is complete and named correctly

---
*Phase: 04-reporting-admin-polish*
*Completed: 2026-05-24*
