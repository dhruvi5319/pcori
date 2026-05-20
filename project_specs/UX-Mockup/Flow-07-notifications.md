## Flow-07: Notifications (US-7.1 – US-7.4)

**User Stories:** US-7.1 (In-App Notifications), US-7.2 (Mark as Read), US-7.3 (Preferences), US-7.4 (Email Alerts)
**Journey:** JRN-01.2 Stage 2 (Spot Notifications)

---

### Flow 7-A: Receive In-App Notifications (US-7.1)

**Trigger:** System generates a notification event (classification complete/failed/needs review, pipeline failure, override submitted)
**Exit:** Notification appears in bell panel; unread badge count incremented

```
[System event fires → NotificationService.create()]
     │
     └── Notification record created (isRead=false)
              │
              └── Frontend polls GET /api/notifications/unread-count every 30s
                       (staleTime: 30000 — NOT on every render)
                       │
                       └── Badge count updates on header bell icon: 🔔 [N]
```

**Notification Bell interaction:**

```
[Header → 🔔 [N] Bell click]
     │
     └── Notification dropdown panel opens
              │
              ├── GET /api/notifications?page=0&size=20
              │
              ├── List (sorted createdAt DESC):
              │        ┌────────────────────────────────────────┐
              │        │ ✓ [type icon] Classification Complete   │
              │        │   Plan RP-2026-017 classified          │
              │        │   2 hours ago                         ● │ ← unread dot
              │        ├────────────────────────────────────────┤
              │        │ ✓ [type icon] Classification Failed     │
              │        │   Plan RP-2026-016 failed              │
              │        │   3 hours ago                         ● │
              │        └────────────────────────────────────────┘
              │
              ├── [Mark all as read] link at top of panel
              │
              └── Clicking a notification item:
                       ├── PATCH /api/notifications/{id}/read
                       ├── Unread dot removed; badge count decrements
                       └── If notification links to a plan: navigate to that classification
```

**Notification type icons (lucide-react):**
- `CLASSIFICATION_COMPLETED`: CheckCircle (green)
- `CLASSIFICATION_FAILED`: XCircle (red)
- `CLASSIFICATION_NEEDS_REVIEW`: AlertTriangle (amber)
- `PIPELINE_FAILURE`: AlertOctagon (red)
- `OVERRIDE_SUBMITTED`: Edit (blue)

---

### Flow 7-B: Mark Notifications as Read (US-7.2)

**Trigger:** User clicks individual notification OR clicks "Mark all as read"
**Exit:** Unread indicators cleared; badge count decrements

```
Individual:
[Click notification item]
     └── PATCH /api/notifications/{id}/read
              └── 200 OK → unread dot removed; badge count --

All:
[Mark all as read link]
     └── POST /api/notifications/read-all
              └── 200 OK → all dots removed; badge → 0 (disappears)
```

---

### Flow 7-C: Configure Notification Preferences (US-7.3)

**Trigger:** User navigates to profile settings → Notifications tab
**Exit:** Preferences saved; future notifications follow new rules

```
[User menu → Settings → Notifications]
     │
     └── GET /api/notifications/preferences
              │
              └── Preference grid:
                       ┌─────────────────────────────┬─────────┬─────────┐
                       │ Event Type                  │ In-App  │  Email  │
                       ├─────────────────────────────┼─────────┼─────────┤
                       │ Classification Completed    │   ✓     │   ☐     │
                       │ Classification Failed       │   ✓     │   ✓     │ ← critical
                       │ Classification Needs Review │   ✓     │   ☐     │
                       │ Pipeline Failure            │   ✓     │   ✓     │ ← critical
                       │ Override Submitted          │   ✓     │   ☐     │
                       └─────────────────────────────┴─────────┴─────────┘
                       Email column note: "Email only sent when SMTP is configured"
                       │
                       └── [Save Preferences]
                                └── PUT /api/notifications/preferences
                                         └── 200 OK → Toast (green): "Preferences saved"
```

---
