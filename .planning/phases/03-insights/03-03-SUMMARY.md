---
phase: 03-insights
plan: "03"
subsystem: notifications
tags: [spring-boot, jpa, rest-api, notifications, java]

# Dependency graph
requires:
  - phase: 03-insights
    provides: V7 Flyway migration with notifications and notification_preferences tables (notification_type, notification_channel enums)
  - phase: 02-classification-pipeline
    provides: ClassificationPipeline async 3-stage pipeline and ClassificationService.applyOverride()
provides:
  - Notification JPA entity mapped to V7 notifications table
  - NotificationPreference JPA entity mapped to V7 notification_preferences table
  - NotificationRepository with paginated query, unread count, and bulk mark-read JPQL
  - NotificationPreferenceRepository with event_type+channel lookup
  - NotificationService: dispatch(), getNotifications(), getUnreadCount(), markRead(), markAllRead(), getPreferences(), updatePreferences()
  - NotificationController: 6 REST endpoints at /api/notifications
  - ClassificationPipeline wired with dispatch calls for CLASSIFIED, FAILED, NEEDS_REVIEW transitions
  - ClassificationService wired with OVERRIDE_SUBMITTED dispatch in applyOverride()
affects: [frontend notification UI (Plan 10), any phase requiring user notification state]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Notification dispatch respects per-user preferences: dispatch() checks IN_APP channel preference before saving, defaults to enabled if no preference record exists"
    - "Async pipeline dispatch: NotificationService.dispatch() called synchronously within classificationExecutor async thread; SecurityContextPropagatingDecorator ensures auth context propagation"
    - "Authentication principal: controllers use (User) auth.getPrincipal() cast for UUID resolution (consistent with ClassificationController pattern)"

key-files:
  created:
    - backend/src/main/java/com/pcori/platform/domain/notification/Notification.java
    - backend/src/main/java/com/pcori/platform/domain/notification/NotificationType.java
    - backend/src/main/java/com/pcori/platform/domain/notification/NotificationChannel.java
    - backend/src/main/java/com/pcori/platform/domain/notification/NotificationPreference.java
    - backend/src/main/java/com/pcori/platform/domain/notification/NotificationRepository.java
    - backend/src/main/java/com/pcori/platform/domain/notification/NotificationPreferenceRepository.java
    - backend/src/main/java/com/pcori/platform/domain/notification/NotificationService.java
    - backend/src/main/java/com/pcori/platform/domain/notification/NotificationController.java
    - backend/src/main/java/com/pcori/platform/domain/notification/dto/NotificationDto.java
    - backend/src/main/java/com/pcori/platform/domain/notification/dto/NotificationPreferenceDto.java
    - backend/src/main/java/com/pcori/platform/domain/notification/dto/UpdatePreferencesRequest.java
  modified:
    - backend/src/main/java/com/pcori/platform/domain/classification/pipeline/ClassificationPipeline.java
    - backend/src/main/java/com/pcori/platform/domain/classification/ClassificationService.java

key-decisions:
  - "NotificationService.dispatch() does not have @Async — it runs synchronously within the classificationExecutor thread (already async); adding @Async would create a nested async executor and lose SecurityContext"
  - "EMAIL channel dispatch is a no-op in Phase 3 (SMTP not configured); preference check still applies but no email is sent"
  - "Default preference: if no NotificationPreference record exists for a user+type+channel combination, notifications are enabled by default (orElse(true))"

patterns-established:
  - "Notification dispatch pattern: call NotificationService.dispatch(userId, type, title, message) after every significant status transition"
  - "Preference upsert: updatePreferences() uses findOrCreate pattern to upsert preference records by (userId, eventType, channel)"

# Metrics
duration: 3min
completed: 2026-05-24
---

# Phase 3 Plan 03: Notification Domain Summary

**Complete notification backend with 6 REST endpoints (FR-8.1, FR-8.2) and event dispatch wired into ClassificationPipeline (3 event types) and ClassificationService (OVERRIDE_SUBMITTED)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-24T00:43:40Z
- **Completed:** 2026-05-24T00:46:30Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Built complete notification domain package: Notification + NotificationPreference JPA entities, 2 repositories, 3 DTOs, NotificationService with 7 methods
- Created NotificationController with all 6 REST endpoints from TechArch spec (/api/notifications with GET, unread-count, PATCH read, POST read-all, GET/PUT preferences)
- Wired dispatch calls into ClassificationPipeline for CLASSIFIED/FAILED/NEEDS_REVIEW status transitions (including the extraction quality gate path)
- Wired OVERRIDE_SUBMITTED dispatch into ClassificationService.applyOverride()

## Task Commits

Each task was committed atomically:

1. **Task 1: Notification JPA entities, repositories, DTOs, and service** - `6c85309` (feat)
2. **Task 2: NotificationController + wire dispatch into ClassificationPipeline and ClassificationService** - `78e0667` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `backend/.../notification/Notification.java` - JPA entity mapping to V7 notifications table
- `backend/.../notification/NotificationChannel.java` - Enum: IN_APP, EMAIL
- `backend/.../notification/NotificationType.java` - Enum: 5 values matching V7 DDL
- `backend/.../notification/NotificationPreference.java` - JPA entity for notification_preferences table
- `backend/.../notification/NotificationRepository.java` - Paginated query, unread count, bulk mark-read JPQL
- `backend/.../notification/NotificationPreferenceRepository.java` - Lookup by userId + eventType + channel
- `backend/.../notification/NotificationService.java` - dispatch(), CRUD for notifications and preferences
- `backend/.../notification/NotificationController.java` - 6 REST endpoints at /api/notifications
- `backend/.../notification/dto/NotificationDto.java` - Record DTO for notification responses
- `backend/.../notification/dto/NotificationPreferenceDto.java` - Record DTO for preference responses
- `backend/.../notification/dto/UpdatePreferencesRequest.java` - Request record for preference updates
- `backend/.../classification/pipeline/ClassificationPipeline.java` - Added NotificationService injection, dispatch calls for 3 status transitions
- `backend/.../classification/ClassificationService.java` - Added NotificationService injection, OVERRIDE_SUBMITTED dispatch in applyOverride()

## Decisions Made
- **No @Async on dispatch()**: dispatch() runs synchronously within the classificationExecutor thread (SecurityContextPropagatingDecorator already handles auth context propagation). Adding @Async would create a nested executor and break SecurityContext.
- **Default preference enabled**: If no preference record exists for a user+type+channel, notifications are enabled by default (`orElse(true)`).
- **EMAIL no-op**: EMAIL channel preference check is implemented but dispatch itself is a no-op in Phase 3 (SMTP/mail service not configured until a later phase).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Maven/Java not available in this environment (no JVM or mvnw present), so compilation verification was done by code review and structural checks (grep for dispatch call counts, endpoint counts). Build compilation will be verified in the verify phase via Docker.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Full notification backend ready for frontend integration (Plan 10: notification UI)
- All 6 REST endpoints registered: GET /api/notifications, GET /api/notifications/unread-count, PATCH /api/notifications/{id}/read, POST /api/notifications/read-all, GET /api/notifications/preferences, PUT /api/notifications/preferences
- Dispatch wired in both async pipeline and override service — frontend UI can poll for notifications after classification events

## Self-Check: PASSED

All 11 created files found on disk. All 2 task commits verified in git history.

---
*Phase: 03-insights*
*Completed: 2026-05-24*
