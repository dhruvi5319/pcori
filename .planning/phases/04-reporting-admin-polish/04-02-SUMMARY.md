---
phase: 04-reporting-admin-polish
plan: "02"
subsystem: api
tags: [spring-boot, user-management, rbac, jpa-specification, rest-api]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: User entity, UserRepository, Role entity, RoleRepository, DomainExceptions, PasswordEncoder, RBAC setup
provides:
  - UserService with CRUD, deactivation guard, search, and soft-delete
  - UserController with 8 REST endpoints for user management
  - UserSpecification for dynamic JPA query filtering
  - DTOs: CreateUserRequest, UpdateUserRequest, UserResponse
  - ConflictException and InvalidRequestException added to DomainExceptions
affects: [frontend-admin-ui, user-import, audit-logging]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JPA Specification chaining for dynamic multi-field queries (same as ClassificationSpecification)"
    - "Soft-delete via setDeletedAt + @SQLRestriction('deleted_at IS NULL')"
    - "Self-deactivation guard: targetId.equals(currentUserId) check in service layer"
    - "@AuthenticationPrincipal User principal cast (same as ClassificationController resolveUserId)"

key-files:
  created:
    - backend/src/main/java/com/pcori/platform/domain/user/UserService.java
    - backend/src/main/java/com/pcori/platform/domain/user/UserController.java
    - backend/src/main/java/com/pcori/platform/domain/user/UserSpecification.java
    - backend/src/main/java/com/pcori/platform/domain/user/dto/CreateUserRequest.java
    - backend/src/main/java/com/pcori/platform/domain/user/dto/UpdateUserRequest.java
    - backend/src/main/java/com/pcori/platform/domain/user/dto/UserResponse.java
  modified:
    - backend/src/main/java/com/pcori/platform/common/exception/DomainExceptions.java

key-decisions:
  - "ConflictException and InvalidRequestException added to DomainExceptions (missing; required by UserService)"
  - "UserSpecification.byRole() uses a JOIN on User.roles to filter by role name (case-insensitive)"
  - "GET /api/users/active has no @PreAuthorize — intentionally unrestricted for internal domain use"
  - "StatusRequest inner record defined inside UserController for PATCH /status body"

patterns-established:
  - "Deactivation guard pattern: targetId.equals(currentUserId) throws InvalidRequestException"
  - "Soft-delete pattern: setDeletedAt(Instant.now()) + @SQLRestriction on entity"
  - "Role resolution pattern: roleRepository.findByName() with ResourceNotFoundException fallback"

# Metrics
duration: 4min
completed: 2026-05-24
---

# Phase 4 Plan 02: User Management Service & Controller Summary

**UserService + UserController delivering 8 REST endpoints for admin user CRUD, role assignment, deactivation guard, and dynamic JPA Specification search**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-24T03:25:38Z
- **Completed:** 2026-05-24T03:29:51Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Built `UserService` with `createUser`, `updateUser`, `deactivateUser` (self-guard), `reactivateUser`, `deleteUser` (soft), `findById`, `listAll`, `listActive`, and `searchUsers`
- Built `UserController` exposing 8 REST endpoints matching TechArch paths exactly
- Built `UserSpecification` for dynamic multi-field search (keyword / role / status)
- Created 3 DTO records and added 2 missing exception types to `DomainExceptions`
- Backend compiles clean and all existing tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: UserService, UserSpecification, and DTOs** - `555d9cb` (feat)
2. **Task 2: UserController — 8 REST endpoints** - `0e966eb` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `backend/src/main/java/com/pcori/platform/domain/user/UserService.java` — CRUD, deactivation guard, search service
- `backend/src/main/java/com/pcori/platform/domain/user/UserController.java` — 8 REST endpoints
- `backend/src/main/java/com/pcori/platform/domain/user/UserSpecification.java` — JPA Specification (keyword/role/status)
- `backend/src/main/java/com/pcori/platform/domain/user/dto/CreateUserRequest.java` — request record with validation
- `backend/src/main/java/com/pcori/platform/domain/user/dto/UpdateUserRequest.java` — partial update record
- `backend/src/main/java/com/pcori/platform/domain/user/dto/UserResponse.java` — response record with role names
- `backend/src/main/java/com/pcori/platform/common/exception/DomainExceptions.java` — added ConflictException, InvalidRequestException

## Decisions Made

- `ConflictException` and `InvalidRequestException` did not exist in `DomainExceptions.java` — added both (needed for username/email duplicate detection and self-deactivation guard)
- `GET /api/users/active` intentionally has no `@PreAuthorize` so other domains can resolve user IDs without admin role
- `StatusRequest` defined as an inner record inside `UserController` — no separate file needed for a single-field request body
- `UserSpecification.byRole()` performs a JOIN on `User.roles` and does case-insensitive name match to handle role name capitalization variations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added ConflictException and InvalidRequestException to DomainExceptions**
- **Found during:** Task 1 (UserService implementation)
- **Issue:** Plan references `DomainExceptions.ConflictException` and `DomainExceptions.InvalidRequestException` but neither existed in the file
- **Fix:** Added both exception classes with appropriate `@ResponseStatus` annotations (409 CONFLICT and 400 BAD_REQUEST)
- **Files modified:** `backend/src/main/java/com/pcori/platform/common/exception/DomainExceptions.java`
- **Verification:** Compilation succeeded without errors
- **Committed in:** `555d9cb` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required for compilation and correct HTTP status codes. No scope creep.

## Issues Encountered

None — all tasks executed smoothly. Docker Maven container used for compile/test since JDK not installed in environment.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- User management REST API is complete and ready for frontend admin UI integration
- All 8 endpoints match TechArch API spec paths exactly
- PATCH /api/users/{id}/status correctly enforces the self-deactivation guard (FR-7.2)
- Ready for Plan 03 (next plan in Phase 4)

## Self-Check: PASSED

All 6 created files confirmed on disk. Both task commits (555d9cb, 0e966eb) verified in git log.

---
*Phase: 04-reporting-admin-polish*
*Completed: 2026-05-24*
