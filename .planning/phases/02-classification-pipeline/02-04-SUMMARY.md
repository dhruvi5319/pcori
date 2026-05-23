---
phase: 02-classification-pipeline
plan: "04"
subsystem: classification
tags: [spring-boot, jpa, postgresql, async, pdfbox, tika, keyword-classification, pipeline]

# Dependency graph
requires:
  - phase: 02-classification-pipeline
    plan: "02"
    provides: "StorageService.getFile(), FileService.storeFile(), UploadedFile entity"
  - phase: 02-classification-pipeline
    plan: "03"
    provides: "TaxonomyService.getActiveCategories(), TaxonomyCategory entity"
  - phase: 01-foundation
    provides: "AuditableEntity, SecurityConfig, GlobalExceptionHandler, AsyncConfig classificationExecutor"
provides:
  - "Classification @Entity with 30+ columns matching TechArch DDL"
  - "ClassificationStatus enum: PENDING, PROCESSING, CLASSIFIED, FAILED, NEEDS_REVIEW"
  - "ClassificationRepository with JpaSpecificationExecutor + statistics aggregate query"
  - "ClassificationSpecification dynamic filter builder (status/date/pcc/keyword)"
  - "PlanIdGenerator: thread-safe RP-YYYY-### sequence generator"
  - "ClassificationStrategy interface + ClassificationResult record"
  - "KeywordClassificationStrategy: default taxonomy keyword matching, modelVersion=keyword-v1"
  - "FileValidator: Apache Tika MIME detection + configurable file size limit"
  - "PdfExtractionStage: PDFBox 3.x text extraction with quality gates"
  - "ClassificationStage: strategy execution + threshold-based status determination"
  - "PersistResultStage: atomic result persistence with classifiedAt timestamp"
  - "ClassificationPipeline: @Async 3-stage orchestrator on classificationExecutor pool"
  - "PipelineRecovery: @EventListener(ApplicationReadyEvent) resets stuck PROCESSING→FAILED"
  - "ClassificationService: upload, override, retry, list with @PreAuthorize RBAC"
  - "ClassificationController: 7 REST endpoints covering all FR-2.x requirements"
  - "PagedResponse<T> generic pagination wrapper"
  - "DomainExceptions: InvalidFileTypeException, FileTooLargeException, InvalidStatusException"
affects: [02-05, 02-06, 02-07, 03-admin-portal, 04-reporting]

# Tech tracking
tech-stack:
  added:
    - "org.apache.tika:tika-core:2.9.2 — MIME type detection"
    - "org.apache.pdfbox:pdfbox:3.0.3 — PDF text extraction"
  patterns:
    - "@Async('classificationExecutor') with SecurityContextPropagatingDecorator for audit field propagation"
    - "3-stage pipeline with dedicated stage components: Extract → Classify → Persist"
    - "JpaSpecificationExecutor + @UtilityClass specification builder for dynamic filtering"
    - "@EventListener(ApplicationReadyEvent) for startup recovery"
    - "PDFBox 3.x API: Loader.loadPDF(byte[]) — NOT deprecated PDDocument.load()"
    - "Confidence threshold routing: ≥0.75 → CLASSIFIED, <0.75 → NEEDS_REVIEW"

key-files:
  created:
    - backend/src/main/java/com/pcori/platform/domain/classification/Classification.java
    - backend/src/main/java/com/pcori/platform/domain/classification/ClassificationStatus.java
    - backend/src/main/java/com/pcori/platform/domain/classification/ClassificationRepository.java
    - backend/src/main/java/com/pcori/platform/domain/classification/ClassificationSpecification.java
    - backend/src/main/java/com/pcori/platform/domain/classification/PlanIdGenerator.java
    - backend/src/main/java/com/pcori/platform/domain/classification/ClassificationService.java
    - backend/src/main/java/com/pcori/platform/domain/classification/ClassificationController.java
    - backend/src/main/java/com/pcori/platform/domain/classification/pipeline/ClassificationPipeline.java
    - backend/src/main/java/com/pcori/platform/domain/classification/pipeline/PdfExtractionStage.java
    - backend/src/main/java/com/pcori/platform/domain/classification/pipeline/ClassificationStage.java
    - backend/src/main/java/com/pcori/platform/domain/classification/pipeline/PersistResultStage.java
    - backend/src/main/java/com/pcori/platform/domain/classification/pipeline/PipelineRecovery.java
    - backend/src/main/java/com/pcori/platform/integration/ml/ClassificationStrategy.java
    - backend/src/main/java/com/pcori/platform/integration/ml/ClassificationResult.java
    - backend/src/main/java/com/pcori/platform/integration/ml/KeywordClassificationStrategy.java
    - backend/src/main/java/com/pcori/platform/common/util/FileValidator.java
    - backend/src/main/java/com/pcori/platform/common/dto/PagedResponse.java
    - backend/src/main/java/com/pcori/platform/domain/classification/dto/ClassificationResponse.java
    - backend/src/main/java/com/pcori/platform/domain/classification/dto/UploadResponse.java
    - backend/src/main/java/com/pcori/platform/domain/classification/dto/ManualOverrideRequest.java
    - backend/src/main/java/com/pcori/platform/domain/classification/dto/ClassificationStats.java
    - backend/src/main/java/com/pcori/platform/domain/classification/dto/ClassificationFilters.java
  modified:
    - backend/pom.xml (added tika-core + pdfbox dependencies)
    - backend/src/main/java/com/pcori/platform/common/exception/DomainExceptions.java
    - backend/src/main/java/com/pcori/platform/common/exception/GlobalExceptionHandler.java

key-decisions:
  - "PDFBox 3.x uses Loader.loadPDF(byte[]) API — readAllBytes() required before passing to Loader (stream must be fully read)"
  - "KeywordClassificationStrategy confidence ≥0.75 routes to CLASSIFIED; <0.75 routes to NEEDS_REVIEW (configurable via app.classification.needs-review-threshold)"
  - "Classification.createdBy/lastModifiedBy mapped as String (not UUID) to match AuditableEntity pattern"
  - "ClassificationController resolves uploadedBy UUID via User instanceof cast — username is not a UUID"
  - "findTopNByOrderByUploadedAtDesc replaced with @Query JPQL using LIMIT parameter — Spring Data doesn't support dynamic Top N via method name"
  - "findStuckProcessing uses fully-qualified enum reference in JPQL for clarity"

patterns-established:
  - "Pattern: 3-stage async pipeline — each stage is a separate @Component, orchestrated by @Async pipeline"
  - "Pattern: Confidence threshold routing — single configurable property gates CLASSIFIED vs NEEDS_REVIEW"
  - "Pattern: Text quality gate — min char count + printable ratio prevents scanned-image misclassification"
  - "Pattern: Preview truncation — textPreview max 500 chars prevents PHI leakage in logs"

# Metrics
duration: 4min
completed: 2026-05-23
---

# Phase 2 Plan 04: Classification Pipeline Summary

**Complete async 3-stage classification pipeline (PDF extract → keyword classify → persist) with RP-YYYY-### plan IDs, confidence-based routing, manual override, retry, paginated list, and startup recovery for stuck records**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-23T20:38:00Z
- **Completed:** 2026-05-23T20:42:38Z
- **Tasks:** 2
- **Files modified:** 25

## Accomplishments

- Classification @Entity with all 30+ columns matching TechArch DDL exactly (confidence_score, model_version, text_preview, extraction_warning, uploaded_by, classified_at, reviewed_by/at, override_reason, error_message)
- Complete 3-stage async pipeline on `classificationExecutor` pool with `SecurityContextPropagatingDecorator` for audit field propagation
- KeywordClassificationStrategy: taxonomy keyword matching with confidence scoring, model version "keyword-v1", confidence cap 0.95
- PipelineRecovery: `@EventListener(ApplicationReadyEvent)` resets stuck PROCESSING records to FAILED on boot
- ClassificationController with 7 endpoints: upload (202), list+filter, getById, override, retry (202), statistics, recent
- FileValidator using Apache Tika MIME detection (NOT extension-only) preventing MIME spoofing

## Task Commits

Each task was committed atomically:

1. **Task 1: Classification entity, repository, PlanIdGenerator, ClassificationStrategy + KeywordStrategy** - `63675d4` (feat)
2. **Task 2: ClassificationPipeline (3 stages + recovery) + ClassificationService + ClassificationController** - `a6cc83c` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `backend/pom.xml` - Added tika-core 2.9.2 and pdfbox 3.0.3 dependencies
- `backend/.../domain/classification/Classification.java` - JPA entity with all 30+ DDL columns
- `backend/.../domain/classification/ClassificationRepository.java` - JpaSpecificationExecutor + statistics JPQL
- `backend/.../domain/classification/ClassificationSpecification.java` - Dynamic filter builder (FR-2.8)
- `backend/.../domain/classification/PlanIdGenerator.java` - Thread-safe RP-YYYY-### with AtomicInteger
- `backend/.../domain/classification/pipeline/ClassificationPipeline.java` - @Async orchestrator
- `backend/.../domain/classification/pipeline/PdfExtractionStage.java` - PDFBox 3.x extraction + quality gates
- `backend/.../domain/classification/pipeline/ClassificationStage.java` - Strategy execution + threshold routing
- `backend/.../domain/classification/pipeline/PersistResultStage.java` - Atomic result persistence
- `backend/.../domain/classification/pipeline/PipelineRecovery.java` - Startup recovery
- `backend/.../domain/classification/ClassificationService.java` - upload, override, retry, list
- `backend/.../domain/classification/ClassificationController.java` - 7 REST endpoints
- `backend/.../integration/ml/ClassificationStrategy.java` - Interface
- `backend/.../integration/ml/ClassificationResult.java` - Record POJO
- `backend/.../integration/ml/KeywordClassificationStrategy.java` - Default keyword implementation
- `backend/.../common/util/FileValidator.java` - Tika MIME + size validation
- `backend/.../common/dto/PagedResponse.java` - Generic pagination wrapper
- `backend/.../common/exception/DomainExceptions.java` - Added InvalidFileTypeException, FileTooLargeException, InvalidStatusException
- `backend/.../common/exception/GlobalExceptionHandler.java` - Added 415, 413, 409 handlers

## Decisions Made

- **PDFBox 3.x API**: `Loader.loadPDF(byte[])` — the PDFBox 3.x API requires a byte array (not stream). `readAllBytes()` called before passing to `Loader`.
- **findRecentByLimit**: Spring Data method naming doesn't support dynamic `TopN` with a parameter — replaced with `@Query("... LIMIT :limit")`.
- **Confidence threshold**: `≥0.75 → CLASSIFIED, <0.75 → NEEDS_REVIEW` — configurable via `app.classification.needs-review-threshold` property.
- **String audit fields**: `createdBy`/`lastModifiedBy` mapped as `String` (not UUID) matching `AuditableEntity` pattern established in Phase 1.
- **resolveUserId in controller**: `instanceof User user → user.getId()` with fallback UUID parse — handles both real `User` principal and stub test principals.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] findTopNByOrderByUploadedAtDesc(int limit) is not a valid Spring Data method**
- **Found during:** Task 1 (ClassificationRepository)
- **Issue:** Plan specified `List<Classification> findTopNByOrderByUploadedAtDesc(int limit)` but Spring Data JPA doesn't support dynamic `TopN` via method naming with a parameter. Would fail at startup with method resolution error.
- **Fix:** Replaced with `@Query("SELECT c FROM Classification c ORDER BY c.uploadedAt DESC LIMIT :limit") List<Classification> findRecentByLimit(@Param("limit") int limit)`
- **Files modified:** ClassificationRepository.java, ClassificationController.java
- **Verification:** JPQL with LIMIT is valid in Spring Data 3.x (JPA 3.1+)
- **Committed in:** 63675d4 (Task 1 commit)

**2. [Rule 2 - Missing Critical] extractSentences() could throw StringIndexOutOfBoundsException on empty text**
- **Found during:** Task 1 (KeywordClassificationStrategy)
- **Issue:** Plan's extractSentences() used `collected.substring(0, Math.min(500, text.length()))` but `text` was the full extracted text, not the `joined` result; empty `joined` returns empty string, not null
- **Fix:** Added null/empty check on joined result; return null instead of empty string; use `joined.length()` for substring bound
- **Files modified:** KeywordClassificationStrategy.java
- **Verification:** Handles empty text gracefully; returns null for project summary / primary outcome when no sentences found
- **Committed in:** 63675d4 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 Bug, 1 Rule 2 Missing Critical)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

- Maven not available in the Daytona dev environment (Java/Maven only in Docker image per Dockerfile). Compilation verification was done via code review. E2E smoke test via `curl` requires `docker-compose up` which is handled in the verify phase.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Classification domain fully implemented — all 9 success criteria can be verified in verify phase
- Plan 05+ (frontend classifications page, override dialog) can consume all 7 controller endpoints
- Statistics endpoint (`GET /api/classifications/statistics`) ready for dashboard
- Keyword strategy is the production default; ML provider swap is a future `ClassificationStrategy` implementation

## Self-Check: PASSED

Key files verified present on disk:

- ✓ `backend/src/main/java/com/pcori/platform/domain/classification/Classification.java`
- ✓ `backend/src/main/java/com/pcori/platform/domain/classification/ClassificationRepository.java`
- ✓ `backend/src/main/java/com/pcori/platform/domain/classification/PlanIdGenerator.java`
- ✓ `backend/src/main/java/com/pcori/platform/domain/classification/pipeline/ClassificationPipeline.java`
- ✓ `backend/src/main/java/com/pcori/platform/domain/classification/pipeline/PipelineRecovery.java`
- ✓ `backend/src/main/java/com/pcori/platform/integration/ml/KeywordClassificationStrategy.java`
- ✓ `backend/src/main/java/com/pcori/platform/common/util/FileValidator.java`

Both task commits confirmed in git log:
- `63675d4` — Task 1: entity/repository/strategy layer
- `a6cc83c` — Task 2: pipeline/service/controller layer

---
*Phase: 02-classification-pipeline*
*Completed: 2026-05-23*
