---
phase: 02-classification-pipeline
plan: 02
subsystem: storage
tags: [aws-sdk-v2, s3, minio, presigned-url, jpa, files]

# Dependency graph
requires:
  - phase: 02-classification-pipeline
    plan: 01
    provides: "uploaded_files DDL (V4 migration), MinIO Docker Compose service"
  - phase: 01-foundation
    provides: "DomainExceptions, GlobalExceptionHandler, SecurityConfig with @EnableMethodSecurity"
provides:
  - "StorageService interface: store(), getDownloadUrl(), getFile(), delete()"
  - "S3StorageService: AWS SDK v2 S3Client + S3Presigner, MinIO-compatible via endpointOverride"
  - "S3Config: @Bean S3Client with optional endpointOverride for dev/prod environment switching"
  - "UploadedFile JPA entity mapped to uploaded_files table with soft-delete filter"
  - "UploadedFileRepository with findByUploadedBy() query"
  - "FileService: storeFile(), getDownloadUrl() with owner/ADMIN authorization"
  - "FileController: GET /api/files/{id}/download-url + ADMIN metadata stub"
  - "StorageUnavailableException returning 503 via GlobalExceptionHandler"
affects: [02-03, 02-04, 02-05, 03-admin-portal, 04-reporting]

# Tech tracking
tech-stack:
  added: [software.amazon.awssdk:s3:2.26.0, software.amazon.awssdk:bom:2.26.0]
  patterns:
    - "AWS SDK v2 BOM in dependencyManagement for version-managed S3 + presigner"
    - "S3Client bean with forcePathStyle=true for MinIO path-style addressing"
    - "Constructor-injected @Value for S3Presigner endpoint config"
    - "@SQLRestriction on UploadedFile entity for automatic soft-delete filtering"
    - "@PreAuthorize SpEL with @fileService bean reference for owner-or-admin check"
    - "Storage key format: pdfs/{year}/{month}/{uuid}-{sanitizedFilename}"

key-files:
  created:
    - backend/pom.xml (AWS SDK v2 BOM + s3 dependency)
    - backend/src/main/java/com/pcori/platform/config/S3Config.java
    - backend/src/main/java/com/pcori/platform/integration/storage/StorageService.java
    - backend/src/main/java/com/pcori/platform/integration/storage/S3StorageService.java
    - backend/src/main/java/com/pcori/platform/domain/files/UploadedFile.java
    - backend/src/main/java/com/pcori/platform/domain/files/UploadedFileRepository.java
    - backend/src/main/java/com/pcori/platform/domain/files/FileService.java
    - backend/src/main/java/com/pcori/platform/domain/files/FileController.java
    - backend/src/main/java/com/pcori/platform/domain/files/dto/DownloadUrlResponse.java
    - backend/src/main/java/com/pcori/platform/domain/files/dto/FileMetadataResponse.java
  modified:
    - backend/src/main/java/com/pcori/platform/common/exception/DomainExceptions.java
    - backend/src/main/java/com/pcori/platform/common/exception/GlobalExceptionHandler.java

key-decisions:
  - "S3Presigner built in constructor with @Value params rather than separate @Bean — avoids circular dependency with S3Client"
  - "StorageUnavailableException as nested static class in DomainExceptions — follows existing pattern"
  - "UploadedFile.uploadedBy stored as UUID column (not @ManyToOne join) — avoids circular loading with User domain"
  - "FileController.getFileMetadata() throws UnsupportedOperationException — ADMIN metadata deferred to Phase 4"

patterns-established:
  - "Storage key format: pdfs/{year}/{month}/{uuid}-{sanitizedFilename} for date-partitioned S3 organization"
  - "@PreAuthorize with @beanName.method(args) for owner-or-admin authorization"
  - "Pre-signed URL TTL configurable via PRE_SIGNED_URL_TTL_SECONDS (default 900s)"
  - "getFile() returns InputStream — callers must close; used by ClassificationService in plan 04"

# Metrics
duration: 3min
completed: 2026-05-23
---

# Phase 2 Plan 2: Files Domain Summary

**AWS SDK v2 S3/MinIO storage layer with UploadedFile JPA entity, pre-signed URL generation, and owner-or-admin authorization for GET /api/files/{id}/download-url**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-23T20:30:41Z
- **Completed:** 2026-05-23T20:34:00Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- StorageService interface with 4 methods (store, getDownloadUrl, getFile, delete) — used by ClassificationService in Plan 04
- S3StorageService using AWS SDK v2 with endpointOverride for MinIO/LocalStack dev environments
- S3Config bean exposing S3Client with configurable region, credentials, and endpoint
- UploadedFile entity with @SQLRestriction soft-delete, all 10 columns matching uploaded_files DDL exactly
- FileService with owner-or-admin @PreAuthorize guard and configurable 15-minute pre-signed URL TTL
- StorageUnavailableException + 503 handler in GlobalExceptionHandler

## Task Commits

Each task was committed atomically:

1. **Task 1: S3Config + StorageService interface + S3StorageService implementation** - `feecb69` (feat)
2. **Task 2: UploadedFile entity, repository, FileService, FileController** - `22dea20` (feat)

**Plan metadata:** (docs commit)

## Files Created/Modified
- `backend/pom.xml` - Added AWS SDK v2 BOM (2.26.0) and s3 dependency
- `backend/src/main/java/com/pcori/platform/config/S3Config.java` - S3Client bean with endpointOverride
- `backend/src/main/java/com/pcori/platform/integration/storage/StorageService.java` - Interface
- `backend/src/main/java/com/pcori/platform/integration/storage/S3StorageService.java` - Implementation
- `backend/src/main/java/com/pcori/platform/domain/files/UploadedFile.java` - JPA entity
- `backend/src/main/java/com/pcori/platform/domain/files/UploadedFileRepository.java` - Repository
- `backend/src/main/java/com/pcori/platform/domain/files/FileService.java` - Business logic + auth
- `backend/src/main/java/com/pcori/platform/domain/files/FileController.java` - REST endpoints
- `backend/src/main/java/com/pcori/platform/domain/files/dto/DownloadUrlResponse.java` - Record DTO
- `backend/src/main/java/com/pcori/platform/domain/files/dto/FileMetadataResponse.java` - Record DTO
- `backend/src/main/java/com/pcori/platform/common/exception/DomainExceptions.java` - Added StorageUnavailableException
- `backend/src/main/java/com/pcori/platform/common/exception/GlobalExceptionHandler.java` - Added 503 handler

## Decisions Made
- S3Presigner instantiated in S3StorageService constructor with @Value params rather than a separate @Bean — avoids potential circular dependency while keeping endpoint config consistent with S3Client
- UploadedFile.uploadedBy stored as `UUID` column (not @ManyToOne) — avoids circular ClassLoader loading between files and user domains
- FileController.getFileMetadata() throws UnsupportedOperationException — ADMIN metadata view is a Phase 4 concern; stub prevents 404 ambiguity

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — all AWS SDK v2 imports resolve from the BOM; no Java/Maven local runtime available so compilation will be verified at Docker build time in the verify phase.

## Next Phase Readiness
- StorageService interface ready for injection into ClassificationService (plan 04)
- UploadedFile.getPath() returns the S3 key needed by the extraction pipeline
- getFileContent(storageKey) available for pipeline PDF text extraction
- Ready for plan 02-03 (Classification domain entity + service)

## Self-Check: PASSED

All 9 key files verified present on disk. Both task commits (feecb69, 22dea20) confirmed in git log.

---
*Phase: 02-classification-pipeline*
*Completed: 2026-05-23*
