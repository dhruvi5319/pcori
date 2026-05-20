## Screen-03: Dashboard (`/dashboard`)

**Purpose:** At-a-glance portfolio health for Program Managers and Executives
**User Stories:** US-3.1 (KPI Cards), US-3.2 (Date Filter), US-3.4 (Recent Feed), US-3.5 (Widget Config), US-3.6 (Executive View)
**Journey:** JRN-02.1 Stage 1–2, JRN-05.1 Stage 1–2

### Layout (12-column grid)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard│Classifications│Taxonomy│Pipeline│Analytics│...    │
│                                              [🔔 3] [David ▾] Logout │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Dashboard                                    [Date Range ▾] [Customize] │
│  Data current as of 09:45 AM                  Apr 21 – May 20, 2026  │
│                                                                       │
│  ROW 1 — KPI Cards (4 across)                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ Total Plans  │ │  Classified  │ │  Processing  │ │ Avg AI Conf. │ │
│  │    143       │ │    128       │ │      3       │ │    81.2%     │ │
│  │              │ │   [+5 today] │ │ [pulsing]    │ │              │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                                       │
│  ROW 2 — Status Breakdown (3 across)                                 │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────┐   │
│  │ Pending          │ │ Failed           │ │ Needs Review       │   │
│  │ ● 8              │ │ ● 2 [red]        │ │ ● 4 [amber]        │   │
│  └──────────────────┘ └──────────────────┘ └────────────────────┘   │
│                                                                       │
│  ─ ─ ─ ─ ─ ─ ─ If FAILED or NEEDS_REVIEW > 0 ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  [⚠ 4 plans need review · 2 failed] [Filter to NEEDS_REVIEW] [Filter to FAILED] │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                                       │
│  ROW 3 — Quick Actions (4 cards)                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌─────────────┐  │
│  │ [↑] Upload  │ │ [☰] View    │ │ [📊] Generate│ │ [🌿] Manage │  │
│  │ Plan        │ │ Classifications│ Reports    │ Taxonomy    │  │
│  └─────────────┘ └─────────────┘ └──────────────┘ └─────────────┘  │
│                                                                       │
│  ROW 4 — Recent Classifications                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Plan ID     │ Title          │ Status    │ PCC    │ Conf │ Date  │ │
│  │ RP-2026-043 │ Telehealth...  │ ● CLASSIFIED│ T2D │ 82% │ Today │ │
│  │ RP-2026-042 │ Shared Dec...  │ ● NEEDS_REVIEW│SDM│ 71% │ Today │ │
│  │ RP-2026-041 │ Remote Pat...  │ ● PROCESSING│ ---│ ---  │ Today │ │
│  │ RP-2026-040 │ Cancer Scr...  │ ● FAILED   │ --- │ ---  │ Yest. │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  [View all Classifications →]                                         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Total classified count, Avg AI Confidence | Row 1 KPI cards |
| Secondary | Failed + Needs Review counts with alert strip | Row 2 |
| Secondary | Quick action shortcuts | Row 3 |
| Tertiary | Recent activity feed | Row 4 |

### States

| State | Appearance | User Feedback |
|---|---|---|
| Loading | Each KPI card shows skeleton independently | N/A |
| Empty (no data) | Icon + "No classification data yet" + [Upload your first plan] CTA | Empty state per card |
| Error (one card fails) | Individual card: error icon + [Retry] | Does not block other cards |
| Active PROCESSING | Processing card: pulsing blue + polling active | N/A |
| VIEWER role | No Quick Actions row; no Upload button | Read-only view |

### Interactive Elements

| Element | Type | Behavior |
|---|---|---|
| Date Range picker | Dropdown | Cascades to all cards + charts simultaneously |
| Customize | Button | Opens widget layout configuration mode |
| KPI cards | Informational | No click action (stat only) |
| Recent feed row | Clickable | → classification detail |
| Alert strip filter links | Quick filter | → /classifications?status=NEEDS_REVIEW etc |
| Quick Action cards | Navigation | → respective routes |

---
