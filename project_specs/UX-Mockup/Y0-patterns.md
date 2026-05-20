## Interaction Patterns

### Pattern: Loading States (PRD §8.4)

**Specification:** Spinner for ≤2s waits; skeleton placeholders for table rows and cards

| Component | Loading Behavior |
|---|---|
| KPI cards | Individual skeleton per card (independent `useQuery`) |
| Table rows | 5–8 skeleton rows with animated shimmer |
| Charts | Skeleton chart area (fixed height, animated shimmer) |
| Dialog content | Skeleton form fields |
| Two-pane tree | Skeleton tree lines (left) + skeleton form (right) |
| Button (submitting) | Spinner icon + disabled state + descriptive label |

**Implementation:** Tailwind CSS `animate-pulse` on skeleton containers; `opacity-50 cursor-not-allowed` on disabled buttons

---

### Pattern: Empty States (PRD §8.4)

**Specification:** Icon + message + primary CTA

| Screen | Empty Condition | Icon | Message | CTA |
|---|---|---|---|---|
| Dashboard | No classifications | Chart icon | "No classification data yet" | [Upload your first plan] |
| Classifications | No results for filter | Search icon | "No plans match your filters" | [Clear Filters] |
| Classifications | No plans at all | Upload icon | "No plans yet" | [↑ Upload Plan] |
| Taxonomy | No seed data | Tree icon | "No taxonomy categories found. Seed data required." | None |
| Analytics | No override data | TrendingUp icon | "Accuracy trend will appear as override data accumulates" | None |
| Model Performance | < 10 records | BarChart icon | "Insufficient data — requires ≥10 evaluated records" | None |
| Reports | No templates | FileText icon | "No templates yet" | [Create Template] |
| Users | No users | Users icon | "No users found" | [Add User] |
| Help | No search results | HelpCircle icon | "No articles found for '[query]'" | [Contact Support] |
| Notifications | No notifications | Bell icon | "No notifications" | None |

---

### Pattern: Error Communication (PRD §8.4)

**sonner toast configuration:** Top-right, rich colors, 4s default duration

| Error Type | Toast Color | Content | Action |
|---|---|---|---|
| API error (generic) | Red | "Something went wrong — try again" | [Retry] button |
| Validation error | Red | Specific field-level message | None |
| File type rejection | Red | "Only PDF files are accepted" | None |
| File too large | Red | "File exceeds 50MB maximum" | None |
| Session expired | Amber | "Session expired — please log in again" | Auto-redirect /login |
| Permission denied | Red | "You don't have permission for this action" | None |
| Network offline | Amber | "Connection lost — working offline" | None |
| Storage unavailable | Red | "Storage service unavailable — try again" | [Retry] |

**Inline field errors:** Red text below field on blur; form submit blocked until resolved

---

### Pattern: Success Communication (PRD §8.4)

| Action | Toast Content |
|---|---|
| Upload accepted | "Plan [RP-XXXX] submitted — classification in progress" |
| Override saved | "Override saved — classification updated" |
| Taxonomy category added | "Category added" |
| Taxonomy category updated | "Category updated" |
| Taxonomy deactivated | "Code deactivated" |
| User created | "Account created — verification email sent to [email]" |
| User deactivated | "[username] deactivated" |
| Report downloaded | "Report downloaded — [N] records" |
| Template saved | "Template saved" |
| Pipeline started | "Pipeline started" |
| Preferences saved | "Preferences saved" |
| Override submitted | "Override saved" |
| Retry queued | "Classification requeued" |

---

### Pattern: Destructive Action Confirmation (PRD §8.4)

**Specification:** Confirmation dialog with explicit red "Confirm" button

All dialogs:
- Focus trapped inside dialog (Radix UI Dialog primitive)
- ESC key closes without action
- Backdrop click closes without action (for safety)
- Red destructive button is the rightmost button
- [Cancel] is always the leftmost option

Applies to: Delete taxonomy (deactivate), Deactivate user, Delete report template, Delete classification, Pipeline Stop

---

### Pattern: Form Validation (PRD §8.4, §8.6)

**Library:** react-hook-form + zod
**Behavior:**
- Validation triggered on field blur
- Error messages appear below the field inline (red text)
- Submit button disabled until all required fields pass validation
- On server error: field-level errors mapped to specific fields when possible; general toast for unattributable errors
- Password fields: show/hide toggle (👁 icon)
- Explicit `htmlFor` / `aria-label` on all form fields (WCAG 2.1 AA)

---

### Pattern: Session Expiry Redirect (PRD §8.4)

**Trigger:** Any protected API call returns 401

```
Any protected API call returns 401 TOKEN_EXPIRED
     │
     ├── TanStack Query's onError handler detects 401
     ├── Toast (amber): "Session expired — please log in again"
     └── Redirect → /login?redirect=[current-path]
              │
              └── After login: redirect back to [current-path]
```

---

### Pattern: Notification Bell Badge

**Location:** Header, right side, always visible on authenticated pages
**Update frequency:** Polls `GET /api/notifications/unread-count` every 30s (`staleTime: 30000`)
**Badge:** Red dot with count; hidden when count = 0

```
[🔔]      ← no notifications
[🔔 3]    ← 3 unread (badge count)
[🔔 99+]  ← 99+ unread (capped display)
```

---

### Pattern: Status Badge Component

**Used everywhere status is displayed:** Classifications list, detail view, dashboard feed, notification items, reports list

**Implementation:** Single reusable `StatusBadge` component

```
<StatusBadge status="CLASSIFIED" />
  → <span class="badge badge-green">Classified</span>

<StatusBadge status="PROCESSING" />
  → <span class="badge badge-blue animate-pulse">Processing</span>

<StatusBadge status="NEEDS_REVIEW" />
  → <span class="badge badge-amber">Needs Review</span>

<StatusBadge status="FAILED" />
  → <span class="badge badge-red">Failed</span>

<StatusBadge status="PENDING" />
  → <span class="badge badge-gray">Pending</span>
```

**WCAG requirement:** Color alone is NEVER used — always color + text label together.

---

### Pattern: Date Range Filter (Shared)

**Used on:** Dashboard, Analytics, Reports, Classification list
**Default range:** Last 30 days
**Constraint:** `startDate <= endDate` enforced client-side before any API call
**Persistence:** Within session (TanStack Query cache); not persisted across sessions

```
[Date Range ▾]  Apr 21 – May 20, 2026
     │
     └── Popover calendar picker:
              ├── Quick presets: Today | Last 7 days | Last 30 days | This quarter | Custom
              └── Custom: startDate calendar + endDate calendar
```

**On Dashboard/Analytics:** Filter cascades simultaneously to ALL KPI cards and charts via React context + TanStack Query `invalidateQueries`

---
