---
phase: 02-classification-pipeline
plan: 01
subsystem: database
tags: [flyway, postgresql, minio, s3, migration, classification, taxonomy]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "users table, V1-V3 Flyway migrations, Docker Compose base"
provides:
  - "MinIO object storage service in Docker Compose with pcori-files bucket"
  - "uploaded_files table DDL for tracking PDF uploads"
  - "classifications table DDL with full taxonomy metadata, confidence_score, override fields, GIN FTS index"
  - "classification_status enum (PENDING, PROCESSING, CLASSIFIED, FAILED, NEEDS_REVIEW)"
  - "taxonomy_categories table DDL with self-referential parent_id, GIN FTS index"
  - "10 PCORI PCC root seed rows in taxonomy_categories"
affects: [02-02, 02-03, 02-04, 02-05, 02-06, 02-07, 03-admin-portal, 04-reporting]

# Tech tracking
tech-stack:
  added: [minio/minio:latest, minio/mc:latest]
  patterns:
    - "Flyway versioned migrations: V4=classification_schema, V5=taxonomy_seed (V3 taken by audit columns)"
    - "PostgreSQL GENERATED ALWAYS AS STORED tsvector for GIN FTS"
    - "Partial indexes with WHERE deleted_at IS NULL for soft-delete pattern"
    - "UNIQUE(code, parent_id) for self-referential taxonomy tree nodes"

key-files:
  created:
    - backend/src/main/resources/db/migration/V4__classification_schema.sql
    - backend/src/main/resources/db/migration/V5__taxonomy_seed.sql
  modified:
    - docker-compose.yml

key-decisions:
  - "V4/V5 numbering used instead of V3/V4 from plan — V3 was already taken by Phase 1 audit columns migration"
  - "UNIQUE(code, parent_id) allows NULL parent_id for root nodes while preventing duplicate siblings"
  - "created_by/last_modified_by mapped as UUID REFERENCES users(id) in DDL — matches AuditableEntity pattern"
  - "GIN FTS index on generated search_vector column in both classifications and taxonomy_categories"

patterns-established:
  - "Partial index pattern: WHERE deleted_at IS NULL used for all soft-delete filtered queries"
  - "Startup recovery: idx_class_processing partial index enables efficient PROCESSING→FAILED recovery on restart"

# Metrics
duration: 1min
completed: 2026-05-23
---

# Phase 2 Plan 1: Classification Pipeline Schema Summary

**MinIO Docker Compose service with pcori-files bucket + Flyway V4/V5 migrations establishing classification_status enum, uploaded_files and classifications tables with GIN FTS indexes, and taxonomy_categories with 10 PCORI PCC seed rows**

## Performance

- **Duration:** 1 min
- **Started:** 2026-05-23T20:30:40Z
- **Completed:** 2026-05-23T20:31:47Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added MinIO service to Docker Compose with health check and minio-setup initializer that creates the `pcori-files` bucket with private access
- Created V4 migration: `classification_status` enum + `uploaded_files` table + `classifications` table with all 38 columns including `confidence_score DECIMAL(5,4)`, `text_preview VARCHAR(500)`, `extraction_warning VARCHAR(255)`, `override_reason TEXT`, GIN FTS index on `search_vector`
- Created V5 migration: `taxonomy_categories` table with self-referential `parent_id`, `UNIQUE(code, parent_id)` constraint, GIN FTS index, and 10 PCORI PCC root-level seed rows

## Task Commits

Each task was committed atomically:

1. **Task 1: Add MinIO service to Docker Compose** - `773253d` (feat)
2. **Task 2: Flyway V4 — uploaded_files + classifications DDL** - `a6197c8` (feat)
3. **Task 3: Flyway V5 — taxonomy_categories DDL + PCORI seed** - `ad65c72` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `docker-compose.yml` - Added minio, minio-setup services, minio_data volume, and backend storage env vars
- `backend/src/main/resources/db/migration/V4__classification_schema.sql` - classification_status enum, uploaded_files and classifications tables with indexes and GIN FTS
- `backend/src/main/resources/db/migration/V5__taxonomy_seed.sql` - taxonomy_categories table with FTS and 10 PCORI PCC seed rows

## Decisions Made
- **V4/V5 not V3/V4:** Plan specified V3__classification_schema.sql and V4__taxonomy_seed.sql, but V3 was already taken by the Phase 1 audit columns migration. Per STATE.md note, files were created as V4/V5 instead.
- **UUID references for created_by/last_modified_by in taxonomy_categories:** Matches the AuditableEntity pattern used throughout the codebase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected migration version numbers**
- **Found during:** Task 2 (Flyway V3 — classification schema)
- **Issue:** Plan specified `V3__classification_schema.sql` but V3 already exists as `V3__add_audit_columns.sql` from Phase 1. Using V3 would cause Flyway checksum conflict on startup.
- **Fix:** Created `V4__classification_schema.sql` and `V5__taxonomy_seed.sql` instead, matching the STATE.md accumulated context note: "Flyway migrations V3 (Phase 1 audit columns) already taken; V4=classification_schema, V5=taxonomy_seed"
- **Files modified:** V4__classification_schema.sql, V5__taxonomy_seed.sql (naming only)
- **Verification:** Files created with correct names; no V3 conflict
- **Committed in:** a6197c8, ad65c72

---

**Total deviations:** 1 auto-fixed (1 bug — migration version numbering)
**Impact on plan:** Necessary correction to prevent Flyway startup failure. No schema content was changed.

## Issues Encountered
None — migration files match the plan DDL exactly (with corrected version numbers).

## User Setup Required
None — no external service configuration required beyond what Docker Compose provides.

## Next Phase Readiness
- Schema foundation complete: all tables, enums, indexes in place
- MinIO service ready for S3StorageService integration
- Ready for Plan 02-02: Classification domain model (JPA entities mapping V4/V5 tables)
- Flyway will apply V4+V5 automatically on next `docker compose up` when backend starts

---
*Phase: 02-classification-pipeline*
*Completed: 2026-05-23*

## Self-Check: PASSED

- ✅ `docker-compose.yml` — exists
- ✅ `backend/src/main/resources/db/migration/V4__classification_schema.sql` — exists
- ✅ `backend/src/main/resources/db/migration/V5__taxonomy_seed.sql` — exists
- ✅ Commit `773253d` (Task 1) — verified in git log
- ✅ Commit `a6197c8` (Task 2) — verified in git log
- ✅ Commit `ad65c72` (Task 3) — verified in git log
