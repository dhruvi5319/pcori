---
phase: 04-reporting-admin-polish
plan: "03"
subsystem: api
tags: [java, spring-boot, apache-poi, excel, jpa, async, report]

# Dependency graph
requires:
  - phase: 02-classification-pipeline
    provides: Classification entity and ClassificationRepository + ClassificationSpecification for filter/query
  - phase: 04-reporting-admin-polish
    provides: V8 DDL migration (report_configurations, excel_reports, filter_configurations tables)

provides:
  - Apache POI 5.3.0 (poi-ooxml) Excel generation with XSSF/SXSSF threshold switching
  - ExcelGenerationService with 13-column UX spec order and streaming for >1000 rows
  - ReportService with async generation, template CRUD, preview, download
  - ReportController: 11 REST endpoints at TechArch paths
  - FilterController: 5 CRUD endpoints (user-scoped filter presets)
  - 3 JPA entities: ReportConfiguration, ExcelReport, FilterConfiguration
  - 3 repositories: ReportConfigurationRepository, ExcelReportRepository, FilterConfigurationRepository

affects: [frontend-report-builder, fr-6.1, fr-6.2, fr-6.3, fr-6.4]

# Tech tracking
tech-stack:
  added: [apache-poi-ooxml-5.3.0]
  patterns:
    - "@Async(classificationExecutor) + @Transactional(REQUIRES_NEW) for fire-and-forget Excel generation"
    - "XSSF in-memory (≤1000 rows) vs SXSSF streaming (>1000 rows) workbook strategy"
    - "User-scoped filter configurations with 404-instead-of-403 ownership check (leakage prevention)"
    - "@JdbcTypeCode(SqlTypes.JSON) for JSONB columns (columns/filters/criteria)"

key-files:
  created:
    - backend/src/main/java/com/pcori/platform/domain/report/ReportStatus.java
    - backend/src/main/java/com/pcori/platform/domain/report/ReportConfiguration.java
    - backend/src/main/java/com/pcori/platform/domain/report/ExcelReport.java
    - backend/src/main/java/com/pcori/platform/domain/report/FilterConfiguration.java
    - backend/src/main/java/com/pcori/platform/domain/report/ReportConfigurationRepository.java
    - backend/src/main/java/com/pcori/platform/domain/report/ExcelReportRepository.java
    - backend/src/main/java/com/pcori/platform/domain/report/FilterConfigurationRepository.java
    - backend/src/main/java/com/pcori/platform/domain/report/ExcelGenerationService.java
    - backend/src/main/java/com/pcori/platform/domain/report/ReportService.java
    - backend/src/main/java/com/pcori/platform/domain/report/ReportController.java
    - backend/src/main/java/com/pcori/platform/domain/report/FilterController.java
    - backend/src/main/java/com/pcori/platform/domain/report/dto/ExcelGenerateRequest.java
    - backend/src/main/java/com/pcori/platform/domain/report/dto/PreviewResponse.java
    - backend/src/main/java/com/pcori/platform/domain/report/dto/ReportConfigRequest.java
    - backend/src/main/java/com/pcori/platform/domain/report/dto/ReportConfigResponse.java
    - backend/src/main/java/com/pcori/platform/domain/report/dto/ExcelReportResponse.java
    - backend/src/main/java/com/pcori/platform/domain/report/dto/FilterConfigRequest.java
    - backend/src/main/java/com/pcori/platform/domain/report/dto/FilterConfigResponse.java
  modified:
    - backend/pom.xml

key-decisions:
  - "SXSSFWorkbook(500) streaming threshold at 1000 rows — aligns with plan spec; 500-row flush window prevents OOM for large exports"
  - "Excel file written to temp filesystem path (not S3) — StorageService abstraction exists but S3 integration for reports deferred; download reads from temp path"
  - "FilterController does inline CRUD (no separate FilterService) — simpler for 5-endpoint resource with no cross-domain dependencies"
  - "Ownership check returns 404 (not 403) for unauthorized filter/template access — prevents leaking existence of other users' resources"

patterns-established:
  - "@Async(classificationExecutor) + @Transactional(REQUIRES_NEW): reused pattern from ClassificationPipeline for async Excel generation"
  - "URL path routing: /api/reports/preview and /api/reports/templates declared before /api/reports/{id} to avoid Spring ambiguity"

# Metrics
duration: 5min
completed: 2026-05-24
---

# Phase 4 Plan 03: Report Domain Summary

**Apache POI-based async Excel generation (XSSF/SXSSF), 11 report endpoints, 5 filter endpoints, and JPA entities for FR-6.1–FR-6.4**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-24T03:31:45Z
- **Completed:** 2026-05-24T03:37:31Z
- **Tasks:** 2
- **Files modified:** 19 + pom.xml = 20

## Accomplishments
- Complete `domain/report/` package: 3 JPA entities + 3 repositories + ExcelGenerationService + ReportService + 2 controllers + 7 DTOs
- Apache POI 5.3.0 added to pom.xml; XSSFWorkbook for ≤1000 rows, SXSSFWorkbook(500) streaming for >1000 rows
- ReportController: 11 REST endpoints at exact TechArch paths with 202 async generate and Content-Disposition: attachment download
- FilterController: 5 CRUD endpoints, fully user-scoped with soft-delete and duplicate name validation
- Backend builds successfully with `mvn package -DskipTests` (BUILD SUCCESS)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Apache POI + create Report domain entities and repositories** - `04ee4bf` (feat)
2. **Task 2: ExcelGenerationService, ReportService, ReportController, FilterController** - `1bde745` (feat)

## Files Created/Modified
- `backend/pom.xml` - Added poi-ooxml 5.3.0 dependency
- `backend/.../report/ReportStatus.java` - Enum: GENERATING, READY, FAILED
- `backend/.../report/ReportConfiguration.java` - JPA entity, report_configurations table, JSONB columns/filters
- `backend/.../report/ExcelReport.java` - JPA entity, excel_reports table, status + file_path
- `backend/.../report/FilterConfiguration.java` - JPA entity, filter_configurations table, JSONB criteria
- `backend/.../report/ReportConfigurationRepository.java` - findByOwnerId, existsByOwnerIdAndName
- `backend/.../report/ExcelReportRepository.java` - findByConfigurationId
- `backend/.../report/FilterConfigurationRepository.java` - findByUserId, existsByUserIdAndName
- `backend/.../report/ExcelGenerationService.java` - Core Excel builder: XSSF/SXSSF switching, column mapping, filter parsing
- `backend/.../report/ReportService.java` - Async generation, template CRUD, preview, download
- `backend/.../report/ReportController.java` - 11 endpoints: generate/list/get/download + template CRUD + preview
- `backend/.../report/FilterController.java` - 5 CRUD endpoints, user-scoped
- `backend/.../report/dto/*.java` - 7 DTOs (ExcelGenerateRequest, PreviewResponse, ReportConfigRequest/Response, ExcelReportResponse, FilterConfigRequest/Response)

## Decisions Made
- SXSSFWorkbook(500) streaming threshold at 1000 rows (per plan spec); 500-row flush window balances memory vs I/O
- Excel files stored to temp filesystem path — StorageService abstraction exists for future S3 swap, but report storage via S3 deferred (no config in current env)
- FilterController does inline logic (no separate FilterService) — simplicity justified for 5-endpoint resource
- URL path ordering: `/api/reports/preview` and `/api/reports/templates` mapped before `/{id}` to avoid Spring path variable ambiguity

## Deviations from Plan

None - plan executed exactly as written.

The plan suggested using `fileService` or a storage service for the generated Excel bytes. Since no dedicated report storage interface exists yet (StorageService is for PDF uploads), the implementation writes to temp filesystem path with a clear comment for future S3 swap. This is consistent with the plan's own note: "store bytes via fileService (or to temp file path)".

## Issues Encountered
None — both tasks compiled cleanly on first attempt.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Report domain complete: all FR-6.1–FR-6.4 backend endpoints implemented
- Front-end can integrate against POST /api/excel/generate (202), GET /api/reports/{id}/download, POST/GET /api/reports/templates, GET /api/reports/preview
- For production: swap temp file storage in ReportService.runGenerationAsync() to use StorageService (S3) — single method change

## Self-Check: PASSED

All 18 created files verified on disk. Both task commits found in git log.

---
*Phase: 04-reporting-admin-polish*
*Completed: 2026-05-24*
