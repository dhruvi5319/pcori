---
phase: 03-insights
plan: "05"
subsystem: api
tags: [spring-boot, jpa, dashboard, metrics, configuration, jsonb, classification]

# Dependency graph
requires:
  - phase: 03-01
    provides: V7 Flyway migration with dashboard_configurations and dashboard_metrics tables
  - phase: 02-classification-pipeline
    provides: classifications table with status/confidence columns (FR-2.1)
provides:
  - Dashboard REST API with 7 endpoints for metrics and per-user configuration
  - DashboardService with getMetrics(), getMetricsForRange(), getConfiguration(), saveConfiguration(), deleteConfiguration()
  - ClassificationRepository extended with date-range count methods and findAvgConfidenceForRange
affects: [03-07-dashboard-frontend, future-notification-plans]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JSON-as-TEXT pattern for JSONB columns: manual ObjectMapper serialization/deserialization in entity accessors"
    - "Upsert via findOrCreate: DashboardService.saveConfiguration() reuses existing config entity or creates new one"
    - "Soft-delete pattern: deleteConfiguration() sets deletedAt rather than removing row"
    - "Reuse aggregate query: getMetrics() uses existing getStatistics() to avoid N+1 status counts"

key-files:
  created:
    - backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardConfiguration.java
    - backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardConfigurationRepository.java
    - backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardMetric.java
    - backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardMetricRepository.java
    - backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardService.java
    - backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardController.java
    - backend/src/main/java/com/pcori/platform/domain/dashboard/dto/DashboardMetricsDto.java
    - backend/src/main/java/com/pcori/platform/domain/dashboard/dto/DashboardConfigurationDto.java
    - backend/src/main/java/com/pcori/platform/domain/dashboard/dto/SaveConfigurationRequest.java
  modified:
    - backend/src/main/java/com/pcori/platform/domain/classification/ClassificationRepository.java

key-decisions:
  - "JSON-as-TEXT fallback for JSONB columns: hypersistence-utils not in local Maven cache, used ObjectMapper text serialization per plan fallback guidance"
  - "getMetrics() reuses existing ClassificationRepository.getStatistics() aggregate query to avoid 6 separate COUNT queries"
  - "findAvgConfidenceForRange named findAvgConfidenceForRange (not findAvgConfidence) to avoid collision with potential future overload"

patterns-established:
  - "Dashboard domain package: com.pcori.platform.domain.dashboard with dto sub-package"
  - "DashboardController getUserId(): cast Authentication.getPrincipal() to User entity, call getId()"

# Metrics
duration: 4min
completed: 2026-05-24
---

# Phase 3 Plan 05: Dashboard Domain Summary

**Dashboard backend with 7 REST endpoints for KPI metrics (by-status counts + avg confidence) and per-user widget layout persistence backed by dashboard_configurations table**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-24T00:43:35Z
- **Completed:** 2026-05-24T00:47:40Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- DashboardConfiguration and DashboardMetric JPA entities mapping to V7 migration tables
- DashboardService computing all FR-4.1/4.2/4.6 metrics from ClassificationRepository
- Full CRUD controller with 7 endpoints matching TechArch spec
- Per-user widget layout upsert with soft-delete reset (FR-4.5)
- ClassificationRepository extended with 3 date-range query methods for FR-4.6

## Task Commits

Each task was committed atomically:

1. **Task 1: Dashboard entities, repositories, DTOs, and service** - `85cee5d` (feat)
2. **Task 2: DashboardController with metrics and configuration endpoints** - `ee900ea` (feat)

## Files Created/Modified
- `backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardConfiguration.java` - JPA entity for dashboard_configurations; JSON text layout/widgets
- `backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardConfigurationRepository.java` - findByUserIdAndDeletedAtIsNull
- `backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardMetric.java` - JPA entity for dashboard_metrics
- `backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardMetricRepository.java` - JpaRepository
- `backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardService.java` - all business logic, 5 public methods
- `backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardController.java` - 7 REST endpoints
- `backend/src/main/java/com/pcori/platform/domain/dashboard/dto/DashboardMetricsDto.java` - response record
- `backend/src/main/java/com/pcori/platform/domain/dashboard/dto/DashboardConfigurationDto.java` - response record
- `backend/src/main/java/com/pcori/platform/domain/dashboard/dto/SaveConfigurationRequest.java` - request record
- `backend/src/main/java/com/pcori/platform/domain/classification/ClassificationRepository.java` - added 3 date-range count/avg methods

## Decisions Made
- **JSON-as-TEXT fallback for JSONB:** `hypersistence-utils` not available in local Maven cache; used `ObjectMapper` text serialization/deserialization in entity convenience accessors. The column DDL still declares `jsonb` (matching V7 migration), so PostgreSQL still validates JSON at DB level. This is transparent to the service layer.
- **Reuse `getStatistics()` for full metrics:** Rather than issuing 6 COUNT queries, `getMetrics()` delegates to the pre-existing `ClassificationRepository.getStatistics()` aggregate JPQL query. Avoids N+1.
- **Method named `findAvgConfidenceForRange`:** Named distinctly from a hypothetical `findAvgConfidence` to avoid JPQL method overload ambiguity with Instant parameters.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used JSON-as-TEXT instead of hypersistence-utils JSONB type**
- **Found during:** Task 1 (DashboardConfiguration entity creation)
- **Issue:** Plan preferred `@Type(JsonBinaryType.class)` from `io.hypersistence:hypersistence-utils-hibernate-63` but explicitly allowed TEXT fallback; the dependency was not in pom.xml and not in local Maven cache
- **Fix:** Used `@Column(columnDefinition = "jsonb")` String columns with manual ObjectMapper serialization/deserialization in getLayout()/setLayout()/getWidgets()/setWidgets() convenience accessors; column DDL is still jsonb so PostgreSQL validates JSON
- **Files modified:** `DashboardConfiguration.java`
- **Verification:** `BUILD SUCCESS` confirmed
- **Committed in:** `85cee5d`

**2. [Rule 1 - Bug] Used `ClassificationRepository.getStatistics()` instead of separate count calls**
- **Found during:** Task 1 (DashboardService implementation)
- **Issue:** Plan's `computeMetrics()` pseudocode showed 6+ separate `countByStatus*` calls, but `ClassificationRepository` already has `getStatistics()` which aggregates all counts in one JPQL query; using separate calls would issue 6 COUNT queries
- **Fix:** `getMetrics()` delegates to `getStatistics()`, avoiding N+1. The date-range path still uses per-status counts (necessary for the date filter)
- **Files modified:** `DashboardService.java`
- **Verification:** Logical verification — `getStatistics()` returns all required fields
- **Committed in:** `85cee5d`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug/optimization)
**Impact on plan:** Both auto-fixes improve correctness and efficiency. No scope creep. All must_haves truths satisfied.

## Issues Encountered
None — compilation succeeded first attempt for both tasks.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dashboard API complete; all 7 TechArch endpoints implemented
- Ready for Plan 07 (dashboard frontend) which depends on this API
- DashboardConfigurationRepository is ready to store per-user layouts from the frontend

## Self-Check: PASSED
- `backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardConfiguration.java` — FOUND
- `backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardConfigurationRepository.java` — FOUND
- `backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardMetric.java` — FOUND
- `backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardMetricRepository.java` — FOUND
- `backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardService.java` — FOUND
- `backend/src/main/java/com/pcori/platform/domain/dashboard/DashboardController.java` — FOUND
- `backend/src/main/java/com/pcori/platform/domain/dashboard/dto/DashboardMetricsDto.java` — FOUND
- `backend/src/main/java/com/pcori/platform/domain/dashboard/dto/DashboardConfigurationDto.java` — FOUND
- `backend/src/main/java/com/pcori/platform/domain/dashboard/dto/SaveConfigurationRequest.java` — FOUND
- Commits `85cee5d` (Task 1) and `ee900ea` (Task 2) — FOUND

---
*Phase: 03-insights*
*Completed: 2026-05-24*
