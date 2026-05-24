---
phase: 04-reporting-admin-polish
plan: "04"
subsystem: api
tags: [spring-boot, jpa, hibernate, postgresql, full-text-search, help-center]

# Dependency graph
requires:
  - phase: 04-reporting-admin-polish
    provides: V8 migration with help_articles, faqs, documentation_feedback tables and search_vector TSVECTOR GENERATED column

provides:
  - HelpArticle, Faq, DocumentationFeedback JPA entities
  - HelpArticleRepository with native SQL full-text search via plainto_tsquery
  - FaqRepository and DocumentationFeedbackRepository
  - HelpService with article CRUD, FAQ CRUD, search, and feedback operations
  - HelpController with 12 REST endpoints at /api/help/*

affects:
  - frontend help center pages (FR-9.1, FR-9.2)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GENERATED ALWAYS AS STORED column excluded from JPA mapping — native SQL only"
    - "@SQLRestriction soft-delete pattern on entities"
    - "DataIntegrityViolationException caught as belt-and-suspenders for DB unique constraint"
    - "Endpoint ordering: /search declared before /{slug} to prevent path conflict"

key-files:
  created:
    - backend/src/main/java/com/pcori/platform/domain/help/HelpArticle.java
    - backend/src/main/java/com/pcori/platform/domain/help/Faq.java
    - backend/src/main/java/com/pcori/platform/domain/help/DocumentationFeedback.java
    - backend/src/main/java/com/pcori/platform/domain/help/HelpArticleRepository.java
    - backend/src/main/java/com/pcori/platform/domain/help/FaqRepository.java
    - backend/src/main/java/com/pcori/platform/domain/help/DocumentationFeedbackRepository.java
    - backend/src/main/java/com/pcori/platform/domain/help/HelpService.java
    - backend/src/main/java/com/pcori/platform/domain/help/HelpController.java
    - backend/src/main/java/com/pcori/platform/domain/help/dto/HelpArticleResponse.java
    - backend/src/main/java/com/pcori/platform/domain/help/dto/HelpArticleRequest.java
    - backend/src/main/java/com/pcori/platform/domain/help/dto/FaqResponse.java
    - backend/src/main/java/com/pcori/platform/domain/help/dto/FaqRequest.java
    - backend/src/main/java/com/pcori/platform/domain/help/dto/FeedbackRequest.java
    - backend/src/main/java/com/pcori/platform/domain/help/dto/FeedbackResponse.java
  modified: []

key-decisions:
  - "search_vector GENERATED ALWAYS AS STORED excluded from JPA entity fields — only referenced in native SQL repository query"
  - "DocumentationFeedback stores articleId and userId as plain UUID columns (not @ManyToOne) to avoid circular loading"
  - "GET /api/help/articles/search declared before GET /api/help/articles/{slug} to prevent Spring path conflict"
  - "DataIntegrityViolationException caught in submitFeedback() as belt-and-suspenders alongside existsByArticleIdAndUserId pre-check"

patterns-established:
  - "GENERATED column exclusion: comment-only in entity, native @Query in repository"
  - "Soft-delete: deletedAt = Instant.now() via service method, @SQLRestriction on entity"

# Metrics
duration: 4min
completed: 2026-05-24
---

# Phase 4 Plan 04: Help Domain Summary

**Complete help center backend: 14 Java files implementing HelpArticle/FAQ/Feedback JPA entities with PostgreSQL GIN full-text search, HelpService with 2-char search enforcement and 409 duplicate feedback handling, and HelpController exposing 12 REST endpoints**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-24T03:39:37Z
- **Completed:** 2026-05-24T03:43:43Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- 3 JPA entities (HelpArticle, Faq, DocumentationFeedback) mapped to V8 DDL tables with correct column names and soft-delete via `@SQLRestriction`
- 3 repositories including HelpArticleRepository with native PostgreSQL GIN full-text search using `search_vector @@ plainto_tsquery()` — GENERATED ALWAYS AS column correctly excluded from entity
- HelpService implementing all article/FAQ CRUD, 2-char minimum search enforcement, and duplicate feedback detection with `DataIntegrityViolationException` catch
- HelpController with all 12 endpoints at exact TechArch paths; `GET /articles/search` declared before `GET /articles/{slug}` to prevent path conflict

## Task Commits

Each task was committed atomically:

1. **Task 1: Help domain entities and repositories with full-text search** - `967425b` (feat)
2. **Task 2: HelpService and HelpController with 12 endpoints** - `a1e7379` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `domain/help/HelpArticle.java` - JPA entity for help_articles table with @SQLRestriction soft-delete
- `domain/help/Faq.java` - JPA entity for faqs table with display_order
- `domain/help/DocumentationFeedback.java` - JPA entity with articleId/userId as plain UUIDs
- `domain/help/HelpArticleRepository.java` - native SQL full-text search via plainto_tsquery
- `domain/help/FaqRepository.java` - category filter + display_order ordering
- `domain/help/DocumentationFeedbackRepository.java` - helpful/not-helpful count queries
- `domain/help/HelpService.java` - all article/FAQ/feedback operations
- `domain/help/HelpController.java` - 12 REST endpoints
- `domain/help/dto/HelpArticleResponse.java` - article read DTO
- `domain/help/dto/HelpArticleRequest.java` - article write DTO with validation
- `domain/help/dto/FaqResponse.java` - FAQ read DTO
- `domain/help/dto/FaqRequest.java` - FAQ write DTO with validation
- `domain/help/dto/FeedbackRequest.java` - feedback write DTO
- `domain/help/dto/FeedbackResponse.java` - feedback response with counts

## Decisions Made

- `search_vector` is a `GENERATED ALWAYS AS STORED` column — excluded from JPA entity fields (Hibernate would attempt to write it causing errors). Referenced only in native `@Query` in `HelpArticleRepository`
- `DocumentationFeedback` stores `articleId` and `userId` as plain `UUID` columns (not `@ManyToOne`) to avoid circular loading and keep the entity simple
- `GET /api/help/articles/search` declared before `GET /api/help/articles/{slug}` in controller — Spring MVC matches more-specific paths first but ordering makes the intent explicit and safe
- `DataIntegrityViolationException` caught in `submitFeedback()` as belt-and-suspenders: the `existsByArticleIdAndUserId` pre-check handles normal cases; the exception catch handles the race condition

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Docker Maven image (`maven:3.9-eclipse-temurin-21`) used for compilation verification since `mvn` is not installed in the shell environment.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Help domain complete (FR-9.1 and FR-9.2 backend ready)
- Plans 05–08 of Phase 4 remain (admin user management and polish)
- Ready for `/pivota_spec-execute-phase 04-05`

## Self-Check: PASSED

All 14 key files verified on disk. Both task commits (967425b, a1e7379) confirmed in git log.

---
*Phase: 04-reporting-admin-polish*
*Completed: 2026-05-24*
