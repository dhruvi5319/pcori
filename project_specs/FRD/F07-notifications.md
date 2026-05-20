---

## F07: Notifications
*Maps to FR-8 | Priority: P2 | Phase: 3→4 | Depends on: F00, F01*

**Description:** Keeps reviewers and administrators informed of key system events without requiring them to poll the UI manually. An in-app notification bell with unread count badge delivers event messages. Per-user preferences control which channels (in-app, email) receive which event types. Email notifications are limited to critical events only to avoid noise.

---

### Terminology

- **Notification:** A single event message for a user; stored as `Notification` entity with `isRead` flag.
- **NotificationPreference:** Per-user, per-event-type, per-channel setting (in-app or email enabled/disabled).
- **Unread count:** Badge count on notification bell; count of `Notification` records where `isRead=false`.
- **Critical events (email):** Only two event types trigger email: `PIPELINE_FAILURE`, `CLASSIFICATION_FAILURE`. All others are in-app only by default.
- **Mark read:** Set `isRead=true` on one or all notifications for the current user.

---

### Notification Event Types

| Event Type | Trigger | Default: In-App | Default: Email |
|---|---|---|---|
| `CLASSIFICATION_COMPLETED` | Pipeline sets status to `CLASSIFIED` | enabled | disabled |
| `CLASSIFICATION_FAILED` | Pipeline sets status to `FAILED` | enabled | enabled (critical) |
| `CLASSIFICATION_NEEDS_REVIEW` | Confidence below threshold | enabled | disabled |
| `PIPELINE_FAILURE` | Unrecoverable pipeline error | enabled | enabled (critical) |
| `OVERRIDE_SUBMITTED` | Reviewer submits override | enabled | disabled |

---

### Sub-features

- FR-8.1 — In-app notification bell with unread count badge; notification list view
- FR-8.1 — Notification types: completed, failed, pipeline failure, override submitted
- FR-8.1 — Mark individual or all notifications read
- FR-8.2 — Per-user notification preferences: in-app and email per event type

---

### Process

#### FR-8.1 — Notification Creation (System-Generated)
1. `ClassificationPipeline` (and other system components) call `NotificationService.create(userId, type, title, message)` after relevant events.
2. System creates `Notification` record with `isRead=false`.
3. If `NotificationPreference.emailEnabled=true` for this user + event type: queue email via `EmailService`.
4. Email is sent only for `CLASSIFICATION_FAILED` and `PIPELINE_FAILURE` by default.

#### FR-8.1 — Notification Bell / List
1. Client `GET /api/notifications?page=0&size=20` — returns paginated notification list for current user.
2. Client `GET /api/notifications/unread-count` — returns `{count: N}` for badge.
3. Frontend polls `unread-count` every 30 s (not on every render; `staleTime: 30000`).
4. Notification list ordered by `createdAt DESC`.
5. Each item shows: type icon, title, message, timestamp, read/unread indicator.

#### FR-8.1 — Mark Read
- `PATCH /api/notifications/{id}/read` — marks single notification read.
- `POST /api/notifications/read-all` — marks all notifications for current user as read.
- Both return `200 OK`.

#### FR-8.2 — Notification Preferences
1. `GET /api/notifications/preferences` — returns current user's preference list (one entry per event type × channel).
2. `PUT /api/notifications/preferences` — update preferences (array of `{eventType, channel, enabled}`).
3. System creates default `NotificationPreference` records for new users (all in-app enabled; email only for critical events).
4. Preferences for non-critical event types: email can be enabled by user but email volume is their responsibility.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `page` | integer | no | Default 0 |
| `size` | integer | no | Default 20; max 50 |
| `preferences` | array | yes (update) | Array of `{eventType, channel: "IN_APP"|"EMAIL", enabled: boolean}` |
| `eventType` | enum | yes | One of: `CLASSIFICATION_COMPLETED`, `CLASSIFICATION_FAILED`, `CLASSIFICATION_NEEDS_REVIEW`, `PIPELINE_FAILURE`, `OVERRIDE_SUBMITTED` |
| `channel` | enum | yes | `IN_APP` or `EMAIL` |

---

### Outputs

| Scenario | HTTP Status | Response |
|---|---|---|
| Notification list | `200 OK` | `{content: [{id, type, title, message, isRead, createdAt}], page, totalElements}` |
| Unread count | `200 OK` | `{count: N}` |
| Mark read | `200 OK` | `{message: "Notification marked as read"}` |
| Mark all read | `200 OK` | `{message: "All notifications marked as read", count: N}` |
| Preferences retrieved | `200 OK` | `[{eventType, channel, enabled}]` |
| Preferences updated | `200 OK` | Updated preferences array |

---

### Validation Rules

- Notifications are per-user; users can only read/mark their own notifications. `403` if attempting to access another user's notification.
- `eventType` and `channel` must be valid enum values. `400 VALIDATION_ERROR` if unknown.
- Preference update: must provide complete array for all event types (partial updates not supported in v1; full replace).
- Email sending: only attempted if `NotificationPreference.emailEnabled=true` AND `EmailService` is available; silently skip if SMTP not configured (dev mode).
- Max stored notifications per user: 500 (oldest deleted on overflow); configurable via `MAX_NOTIFICATIONS_PER_USER` env var.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Notification not found | `404 Not Found` | `NOT_FOUND` | "Notification {id} not found" |
| Access to another user's notification | `403 Forbidden` | `ACCESS_DENIED` | "Access denied" |
| Invalid event type | `400 Bad Request` | `VALIDATION_ERROR` | "Invalid event type: {type}" |
| Invalid channel | `400 Bad Request` | `VALIDATION_ERROR` | "Invalid channel: {channel}" |
| SMTP unavailable (email) | Internal — log warning | — | Email silently skipped; in-app notification still created |

---

### API Surface (this feature)
See `Y1-api.md` §Notifications for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/notifications` | JWT | any |
| `GET` | `/api/notifications/unread-count` | JWT | any |
| `PATCH` | `/api/notifications/{id}/read` | JWT | any |
| `POST` | `/api/notifications/read-all` | JWT | any |
| `GET` | `/api/notifications/preferences` | JWT | any |
| `PUT` | `/api/notifications/preferences` | JWT | any |

---

### Schema Surface (this feature)
Uses tables: `notifications`, `notification_preferences` — see `Y0-schema.md` §Notifications.

Key fields:
- `notifications.user_id` — FK to `users.id`
- `notifications.type` — enum string
- `notifications.is_read` — boolean; default false
- `notification_preferences.channel` — `IN_APP` or `EMAIL`
- `notification_preferences.enabled` — boolean
