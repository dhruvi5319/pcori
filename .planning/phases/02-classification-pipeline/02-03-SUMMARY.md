---
phase: 02-classification-pipeline
plan: "03"
subsystem: taxonomy
tags: [spring-boot, jpa, postgresql, flyway, fts, taxonomy, hierarchy]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: AuditableEntity, SecurityConfig/@EnableMethodSecurity, GlobalExceptionHandler, DomainExceptions
  - phase: 02-classification-pipeline
    provides: V4 classification schema DDL, V5 taxonomy_categories DDL + seed data
provides:
  - TaxonomyCategory JPA entity (self-referential) with GIN FTS search
  - TaxonomyRepository with recursive CTE descendants query
  - TaxonomyService: full CRUD + tree assembly + cascading deactivation + FTS search
  - TaxonomyController: 11 REST endpoints (/api/taxonomy/**)
  - DTOs: TaxonomyCategoryDto, TaxonomyTreeNode, CreateTaxonomyRequest, UpdateTaxonomyRequest
  - Domain exceptions: CodeDuplicateException, InvalidParentException, InvalidLevelException, CircularReferenceException, InactiveParentException
  - V6 migration fixing created_by/last_modified_by column types to VARCHAR(255)
affects:
  - 02-04-PLAN (KeywordClassificationStrategy needs TaxonomyService.getActiveCategories())
  - 02-06-PLAN (override dialogs use GET /api/taxonomy/active)
  - 02-07-PLAN (taxonomy admin page uses all endpoints)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Self-referential JPA entity with @SQLRestriction(deleted_at IS NULL)"
    - "Recursive CTE via @Query(nativeQuery=true) for descendant cascade"
    - "GIN FTS via PostgreSQL TSVECTOR generated column + plainto_tsquery"
    - "Service-layer @PreAuthorize for RBAC (REVIEWER reads, TAXONOMY_ADMIN writes)"
    - "Cascading deactivation in single @Transactional method (findAllDescendants → saveAll)"

key-files:
  created:
    - backend/src/main/java/com/pcori/platform/domain/taxonomy/TaxonomyCategory.java
    - backend/src/main/java/com/pcori/platform/domain/taxonomy/TaxonomyRepository.java
    - backend/src/main/java/com/pcori/platform/domain/taxonomy/TaxonomyService.java
    - backend/src/main/java/com/pcori/platform/domain/taxonomy/TaxonomyController.java
    - backend/src/main/java/com/pcori/platform/domain/taxonomy/dto/TaxonomyCategoryDto.java
    - backend/src/main/java/com/pcori/platform/domain/taxonomy/dto/TaxonomyTreeNode.java
    - backend/src/main/java/com/pcori/platform/domain/taxonomy/dto/CreateTaxonomyRequest.java
    - backend/src/main/java/com/pcori/platform/domain/taxonomy/dto/UpdateTaxonomyRequest.java
    - backend/src/main/resources/db/migration/V6__fix_audit_columns_type.sql
  modified:
    - backend/src/main/java/com/pcori/platform/common/exception/DomainExceptions.java
    - backend/src/main/java/com/pcori/platform/common/exception/GlobalExceptionHandler.java

key-decisions:
  - "TaxonomyCategory.createdBy mapped as String (not UUID) to match AuditableEntity @CreatedBy pattern — V6 migration alters V5 column type from UUID to VARCHAR(255)"
  - "toDto() exposed as public method on TaxonomyService to allow controller delegation without code duplication"
  - "DELETE endpoint returns 200 with deactivated entity (not 204) to confirm soft-delete semantics"
  - "Cascading deactivation uses recursive CTE query (single DB round-trip) then saveAll in one @Transactional"

patterns-established:
  - "Pattern: Soft-delete with @SQLRestriction — entity invisible after deletedAt IS NOT NULL without explicit queries"
  - "Pattern: Service-layer RBAC — @PreAuthorize on service methods, not controller, for consistent security across all callers"

# Metrics
duration: 5min
completed: 2026-05-23
---

# Phase 2 Plan 03: Taxonomy Domain Summary

**Self-referential TaxonomyCategory JPA entity with GIN full-text search, recursive CTE cascading deactivation, and 11 REST endpoints covering full taxonomy CRUD hierarchy management**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-23T20:30:59Z
- **Completed:** 2026-05-23T20:35:31Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- TaxonomyCategory entity + TaxonomyRepository with all 8 custom finders including recursive CTE for descendant cascade
- TaxonomyService implementing FR-3.1 through FR-3.5: CRUD, tree assembly, cascading deactivation, GIN FTS, active list
- TaxonomyController with all 11 endpoints per TechArch API catalog §Taxonomy
- DTOs (4 records) + 5 new domain exceptions + GlobalExceptionHandler mappings
- V6 migration fixing column type mismatch between V5 DDL (UUID) and AuditableEntity @CreatedBy (String)

## Task Commits

Each task was committed atomically:

1. **Task 1: TaxonomyCategory entity + TaxonomyRepository** - `e5cf59a` (feat)
2. **Task 2: TaxonomyService + TaxonomyController + DTOs** - `b745c45` (feat)

**Plan metadata:** (see below)

## Files Created/Modified

- `backend/src/main/java/com/pcori/platform/domain/taxonomy/TaxonomyCategory.java` - Self-referential @Entity with audit fields, GIN search_vector (insertable=false)
- `backend/src/main/java/com/pcori/platform/domain/taxonomy/TaxonomyRepository.java` - JpaRepository with GIN FTS native queries, recursive CTE findAllDescendants
- `backend/src/main/java/com/pcori/platform/domain/taxonomy/TaxonomyService.java` - Business logic: CRUD, tree, cascading deactivation, search, active list
- `backend/src/main/java/com/pcori/platform/domain/taxonomy/TaxonomyController.java` - 11 REST endpoints per TechArch API catalog
- `backend/src/main/java/com/pcori/platform/domain/taxonomy/dto/TaxonomyCategoryDto.java` - Response DTO record
- `backend/src/main/java/com/pcori/platform/domain/taxonomy/dto/TaxonomyTreeNode.java` - Nested tree response record
- `backend/src/main/java/com/pcori/platform/domain/taxonomy/dto/CreateTaxonomyRequest.java` - Create request with validation annotations
- `backend/src/main/java/com/pcori/platform/domain/taxonomy/dto/UpdateTaxonomyRequest.java` - Partial update request
- `backend/src/main/resources/db/migration/V6__fix_audit_columns_type.sql` - Alters created_by/last_modified_by from UUID→VARCHAR(255) in taxonomy_categories + classifications
- `backend/src/main/java/com/pcori/platform/common/exception/DomainExceptions.java` - Added 5 taxonomy exceptions
- `backend/src/main/java/com/pcori/platform/common/exception/GlobalExceptionHandler.java` - Added handlers for CodeDuplicateException (409) and taxonomy validation (400)

## Decisions Made

- **String audit fields with V6 migration**: V5 DDL mistakenly used `created_by UUID REFERENCES users(id)` but `AuditableEntity` maps `@CreatedBy` as `String` (username). V6 migration alters both `taxonomy_categories` and `classifications` to VARCHAR(255). This matches the AuditableEntity pattern established in Phase 1.
- **Public toDto() on service**: Exposing the mapping method as `public` on TaxonomyService allows the controller to delegate without duplicating logic. Clean alternative to having a separate mapper class for this domain size.
- **DELETE returns 200**: Per success criteria item 6 — confirms soft-delete behavior to callers rather than ambiguous 204.
- **Cascading deactivation**: Single `@Transactional` method uses the recursive CTE `findAllDescendants` then `saveAll` — one DB call to find all descendants, one batch update.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] V5 DDL type mismatch: created_by UUID vs AuditableEntity String**
- **Found during:** Task 1 (TaxonomyCategory entity design)
- **Issue:** V5 taxonomy_categories DDL (already committed) used `created_by UUID REFERENCES users(id)` but AuditableEntity @CreatedBy writes `String` (username). JPA would fail at runtime with type mismatch; classifications table had same issue.
- **Fix:** Created V6__fix_audit_columns_type.sql to ALTER both tables from UUID to VARCHAR(255). Entity uses String fields matching AuditableEntity.
- **Files modified:** `backend/src/main/resources/db/migration/V6__fix_audit_columns_type.sql`
- **Verification:** Entity field types now match DDL column types; follows same pattern as V3 which added VARCHAR(255) audit columns to users
- **Committed in:** e5cf59a (Task 1 commit)

**2. [Rule 1 - Bug] Plan stub `toDto()` in controller returned null**
- **Found during:** Task 2 (TaxonomyController implementation)
- **Issue:** Plan's controller template had `private TaxonomyCategoryDto toDto(TaxonomyCategory c) { return null; }` as stub — would return null for all responses
- **Fix:** Exposed `toDto()` as public method on TaxonomyService; controller delegates to `taxonomyService::toDto`
- **Files modified:** TaxonomyController.java, TaxonomyService.java
- **Committed in:** b745c45 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep — V6 migration is a required correction of V5 DDL mismatch.

## Issues Encountered

- Maven not available in the Daytona dev environment (Java/Maven only in Docker image per Dockerfile). Compilation verification was done via code review rather than `./mvnw compile`. E2E verification via `curl` requires `docker-compose up` which is handled in the verify phase.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Taxonomy domain fully implemented — ready for Plan 04 (KeywordClassificationStrategy uses `TaxonomyService.getActiveCategories()`)
- Plan 05+ (Classification entity, ClassificationService) can reference taxonomy via code string FK
- Plan 06/07 (override dialogs, taxonomy admin page) can consume all 11 endpoints

## Self-Check: PASSED

All 9 key files confirmed on disk. Both task commits confirmed in git log:
- `e5cf59a` — TaxonomyCategory entity + TaxonomyRepository
- `b745c45` — TaxonomyService + TaxonomyController + DTOs + exceptions

---
*Phase: 02-classification-pipeline*
*Completed: 2026-05-23*
