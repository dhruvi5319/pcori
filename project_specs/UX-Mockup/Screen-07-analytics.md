## Screen-07: Analytics (`/analytics`)

**Purpose:** Deep-dive analytics for Program Managers — accuracy trends, confidence distribution, override analysis
**User Stories:** US-3.2 (Date Filter), US-3.3 (Analytics Charts)
**Journey:** JRN-02.1 Stage 3–4

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard │ Classifications │ Analytics │ ...  [🔔] [David ▾]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Analytics                          [Date Range: Apr 21 – May 20 ▾] │
│  Filter applied: Apr 21 – May 20, 2026  [Reset to default]           │
│                                                                       │
│  ── ROW 1: ACCURACY TREND + CATEGORY ACCURACY ──────────────────── │
│  ┌─────────────────────────────────┐ ┌──────────────────────────────┐│
│  │  Accuracy Trend                 │ │  Category Accuracy           ││
│  │  [Line chart]                   │ │  [Horizontal bar chart]      ││
│  │   AI ─── Human Corrected ───    │ │                              ││
│  │  100%|                          │ │  Type 2 Diabetes   ████ 94%  ││
│  │   80%|  ⌒⌒⌒⌒⌒                  │ │  Telehealth        ████ 78%  ││
│  │   60%|    ╲  /                  │ │  Shared Dec. Making████ [!]78%││
│  │       Apr  May                  │ │  ← 22% override: above 15%   ││
│  │  Granularity: [Day▾]            │ │  threshold (bar shows red)   ││
│  │                                 │ │  Heart Failure     ███  92%  ││
│  │  Empty: "Accuracy trend will    │ │                              ││
│  │  appear as override data        │ │  [Click bar → filter overrides│
│  │  accumulates"                   │ │   table to that category]    ││
│  └─────────────────────────────────┘ └──────────────────────────────┘│
│                                                                       │
│  ── ROW 2: CONFIDENCE DISTRIBUTION + PROCESSING VOLUME ───────────── │
│  ┌─────────────────────────────────┐ ┌──────────────────────────────┐│
│  │  AI Confidence Distribution     │ │  Processing Volume           ││
│  │  [Histogram — 10 buckets]       │ │  [Area chart]                ││
│  │  (NEVER "Accuracy Distribution")│ │                              ││
│  │      ██                         │ │   80|  ╱╲                   ││
│  │   ████████                      │ │   40| ╱  ╲  ╱              ││
│  │  ████████████                   │ │    0└─────────              ││
│  │  0.0  0.5  1.0                  │ │   Apr    May                ││
│  └─────────────────────────────────┘ └──────────────────────────────┘│
│                                                                       │
│  ── ROW 3: RECENT OVERRIDES TABLE ──────────────────────────────────  │
│  Recent Overrides                     [Filter by PCC ▾]              │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Plan ID     │ Reviewer │ Original         │ Override     │ Date│  │
│  │ RP-2026-042 │ M. Okonkwo│ BehavioralCoach │ DigitalTool  │ Today│ │
│  │ RP-2026-037 │ M. Okonkwo│ Telehealth      │ DigitalTool  │ Yest │ │
│  └────────────────────────────────────────────────────────────────┘  │
│  [Load more]   Page 1                                                 │
│                                                                       │
│  ── ROW 4: MODEL PERFORMANCE ────────────────────────────────────── │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐           │
│  │  Precision     │ │  Recall        │ │  F1 Score      │           │
│  │    0.87        │ │    0.84        │ │    0.85        │           │
│  └────────────────┘ └────────────────┘ └────────────────┘           │
│  Based on 47 evaluated records  OR                                    │
│  "Insufficient data — model performance requires ≥10 evaluated records"│
└─────────────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Date range filter (cascades everywhere) | Page header |
| Primary | Category accuracy + threshold violations | Row 1 right |
| Secondary | Accuracy trend over time | Row 1 left |
| Secondary | Recent overrides table (drill-down) | Row 3 |
| Tertiary | Confidence distribution + volume | Row 2 |
| Tertiary | Model performance KPIs | Row 4 |

### States Per Chart

| Chart | Loading | Empty/Insufficient | Error |
|---|---|---|---|
| Accuracy Trend | Skeleton | "Trend appears as override data accumulates" | Individual error icon + retry |
| Category Accuracy | Skeleton | "No category data for this period" | Individual error |
| Confidence Distribution | Skeleton | "No confidence data yet" | Individual error |
| Processing Volume | Skeleton | "No plans uploaded in this range" | Individual error |
| Recent Overrides | Skeleton rows | "No overrides in this period" | Individual error |
| Model Performance | Skeleton KPIs | "Insufficient data (< 10 records)" | Individual error |

**One chart failing does NOT block other charts from loading.**
**`isAnimationActive={false}` on all Recharts components in production.**

---
