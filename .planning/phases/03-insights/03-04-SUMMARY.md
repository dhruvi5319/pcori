---
phase: 03-insights
plan: "04"
subsystem: api
tags: [analytics, spring-boot, java, native-sql, entity-manager, pageable]

# Dependency graph
requires:
  - phase: 03-01
    provides: V7 Flyway migration with dashboard_metrics, notifications, pipeline_runs tables
  - phase: 02-classification-pipeline
    provides: classifications table with status/confidence/pcc/override columns and reviewed_by/reviewed_at audit fields

provides:
  - AnalyticsService with 6 native SQL query methods against classifications table
  - AnalyticsController with 6 GET endpoints at /api/analytics/**
  - 6 DTO records: AccuracyTrendPoint, CategoryAccuracyDto, ConfidenceDistributionDto, ProcessingVolumePoint, RecentOverrideDto, ModelPerformanceDto

affects: [analytics-frontend, plan-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Native SQL via EntityManager for analytics queries (flexibility over JPQL for aggregations)"
    - "Date-range defaulting pattern: parseInstant() accepts ISO instant or date-only, falls back to last-30-days"
    - "PostgreSQL width_bucket() for fixed confidence histogram buckets"
    - "Simplified precision/recall/F1: returns zeros if totalEvaluated < 10"

key-files:
  created:
    - backend/src/main/java/com/pcori/platform/domain/analytics/AnalyticsService.java
    - backend/src/main/java/com/pcori/platform/domain/analytics/AnalyticsController.java
    - backend/src/main/java/com/pcori/platform/domain/analytics/dto/AccuracyTrendPoint.java
    - backend/src/main/java/com/pcori/platform/domain/analytics/dto/CategoryAccuracyDto.java
    - backend/src/main/java/com/pcori/platform/domain/analytics/dto/ConfidenceDistributionDto.java
    - backend/src/main/java/com/pcori/platform/domain/analytics/dto/ProcessingVolumePoint.java
    - backend/src/main/java/com/pcori/platform/domain/analytics/dto/RecentOverrideDto.java
    - backend/src/main/java/com/pcori/platform/domain/analytics/dto/ModelPerformanceDto.java
  modified: []

key-decisions:
  - "Analytics endpoints restricted to MANAGER and ADMIN roles via @PreAuthorize at class level"
  - "Native SQL via EntityManager chosen for all analytics queries — avoids JPQL limitations with date_trunc and width_bucket PostgreSQL functions"
  - "Confidence distribution always returns all 10 buckets (filling zeros) — frontend doesn't need to handle missing buckets"
  - "Model performance returns zeros when totalEvaluated < 10 to avoid unreliable metrics with small samples"

patterns-established:
  - "parseInstant() utility: accepts ISO-8601 instant or date-only string, defaults gracefully"
  - "Analytics queries use FILTER (WHERE ...) PostgreSQL aggregate syntax for conditional counts"

# Metrics
duration: 3min
completed: 2026-05-24
---

# Phase 3 Plan 04: Analytics Domain Summary

**Analytics domain with 6 native SQL query methods in AnalyticsService and 6 REST endpoints in AnalyticsController powering accuracy trend, category accuracy, confidence distribution, processing volume, overrides table, and model performance**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-24T00:43:30Z
- **Completed:** 2026-05-24T00:46:19Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Created 6 DTO Java records for type-safe analytics response payloads
- AnalyticsService with 6 EntityManager native SQL query methods against `classifications` table
- AnalyticsController with 6 GET endpoints at `/api/analytics/**` with MANAGER/ADMIN RBAC
- All endpoints default to last-30-days range when date params omitted; accept both ISO instant and date-only formats
- Backend compiles cleanly with all 8 new files

## Task Commits

Each task was committed atomically:

1. **Task 1: Analytics DTOs and AnalyticsService with native SQL queries** - `e71e4e9` (feat)
2. **Task 2: AnalyticsController with all 6 endpoints** - `058af30` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `backend/src/main/java/com/pcori/platform/domain/analytics/AnalyticsService.java` - 6 native SQL query methods using EntityManager against classifications table
- `backend/src/main/java/com/pcori/platform/domain/analytics/AnalyticsController.java` - 6 GET endpoints at /api/analytics/** with MANAGER/ADMIN authorization
- `backend/src/main/java/com/pcori/platform/domain/analytics/dto/AccuracyTrendPoint.java` - bucket, aiAccuracy, humanCorrectedAccuracy, total
- `backend/src/main/java/com/pcori/platform/domain/analytics/dto/CategoryAccuracyDto.java` - category, total, overrideCount, overrideRate
- `backend/src/main/java/com/pcori/platform/domain/analytics/dto/ConfidenceDistributionDto.java` - bucket label, low, high, count (10 fixed buckets)
- `backend/src/main/java/com/pcori/platform/domain/analytics/dto/ProcessingVolumePoint.java` - bucket, count
- `backend/src/main/java/com/pcori/platform/domain/analytics/dto/RecentOverrideDto.java` - classificationId, planId, reviewerUsername, categories, reason, reviewedAt
- `backend/src/main/java/com/pcori/platform/domain/analytics/dto/ModelPerformanceDto.java` - precision, recall, f1Score, totalEvaluated

## Decisions Made

- **MANAGER + ADMIN only:** Analytics pages are operational/oversight views, not reviewer tools — `@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")` at class level enforces this.
- **Native SQL via EntityManager:** JPQL cannot express `date_trunc()`, `width_bucket()`, or `FILTER (WHERE ...)` aggregate syntax — native SQL is the correct tool here.
- **All 10 confidence buckets always returned:** Frontend charts expect a complete 10-element array; filling zeros server-side avoids client-side gap handling.
- **Model performance minimum threshold:** Returns `{0, 0, 0, totalEvaluated}` when `totalEvaluated < 10` — prevents misleading metrics from tiny datasets.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — compilation succeeded on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Analytics domain complete — all 6 endpoints from FR-4.4 and FR-4.6 are implemented
- Ready for Plan 05+ (dashboard, notifications, pipeline monitoring)
- Analytics frontend (Plan 08) can now integrate against `/api/analytics/**` endpoints
- Note: Maven wrapper (`./mvnw`) not present in backend directory; compilation requires Docker Maven image (`maven:3.9-eclipse-temurin-21`)

## Self-Check: PASSED

All 8 created files confirmed on disk. Both task commits (e71e4e9, 058af30) confirmed in git log.

---
*Phase: 03-insights*
*Completed: 2026-05-24*
