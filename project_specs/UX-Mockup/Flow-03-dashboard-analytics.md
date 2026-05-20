## Flow-03: Dashboard & Analytics (US-3.1 – US-3.6)

**User Stories:** US-3.1 (KPI Cards), US-3.2 (Date Filter), US-3.3 (Analytics Charts), US-3.4 (Recent Feed), US-3.5 (Widget Config), US-3.6 (Executive View)
**Journey:** JRN-02.1 (Health Check → Anomaly → Report), JRN-05.1 (Executive KPI Check)

---

### Flow 3-A: Dashboard Initial Load (US-3.1, US-3.4)

**Trigger:** User navigates to `/dashboard`
**Exit:** All KPI cards populated; recent feed visible; date range applied

```
[GET /api/dashboard/metrics?startDate=&endDate=]  ← last 30 days default
     │
     ├── KPI cards render independently via separate useQuery hooks:
     │        ├── Total Plans    → skeleton → number
     │        ├── Classified     → skeleton → number
     │        ├── Processing     → skeleton → number
     │        ├── Pending        → skeleton → number
     │        ├── Failed         → skeleton → number
     │        ├── Needs Review   → skeleton → number
     │        └── Avg AI Confidence → skeleton → XX.X%
     │
     ├── [GET /api/classifications/recent?limit=10]
     │        └── Recent Classifications feed renders
     │
     ├── "Data current as of [timestamp]" label under KPI cards
     │
     └── Empty state (no data yet):
              Icon + "No classification data yet"
              [Upload your first plan →] CTA button
```

**TanStack Query config:** `staleTime: 30000` (30s) — NOT `staleTime: 0`
**Conditional polling:** Poll only while any `PROCESSING` records exist

---

### Flow 3-B: Apply Date Range Filter (US-3.2)

**Trigger:** User changes date range picker at top of dashboard
**Exit:** All cards and charts simultaneously refresh with new date range

```
[Date Range Picker → user selects new range]
     │
     ├── Client-side validation: startDate ≤ endDate
     │        └── If invalid: inline error; no API call made
     │
     └── On valid selection:
              ├── All useQuery hooks with date params invalidated simultaneously
              ├── ALL of these refetch in parallel:
              │        ├── /api/dashboard/metrics?startDate=...&endDate=...
              │        ├── /api/classifications/recent
              │        ├── /api/analytics/accuracy-trend
              │        ├── /api/analytics/category-accuracy
              │        ├── /api/analytics/confidence-distribution
              │        ├── /api/analytics/processing-volume
              │        └── /api/analytics/overrides
              │
              ├── "Filter applied: [date range]" persistent label shown
              │
              └── Each card/chart shows its own skeleton while loading
                       (one failing chart does NOT block others)
```

---

### Flow 3-C: Analytics Charts (US-3.3)

**Trigger:** User navigates to `/analytics`
**Exit:** All six chart sections populated or showing appropriate empty/insufficient-data states

```
[/analytics page]
     │
     ├── Date range picker (same as dashboard; defaults to last 30 days)
     │
     ├── Charts rendered in tabs or sections:
     │
     ├── 1. Accuracy Trend (line chart)
     │        GET /api/analytics/accuracy-trend
     │        ├── Has data: line chart (aiAccuracy + humanCorrectedAccuracy series)
     │        └── No overrides yet: "Accuracy trend will appear as override data accumulates"
     │
     ├── 2. Category Accuracy (horizontal bar chart)
     │        GET /api/analytics/category-accuracy
     │        ├── Override rate > 15%: bar highlighted red (with text label "Above threshold")
     │        └── Click bar: filter Recent Overrides table to that category (JRN-02.1 drill-down)
     │
     ├── 3. AI Confidence Distribution (histogram)
     │        GET /api/analytics/confidence-distribution
     │        Label: "AI Confidence Distribution" (NEVER "Accuracy Distribution")
     │        10 buckets: 0.0–0.1, 0.1–0.2, ..., 0.9–1.0
     │
     ├── 4. Processing Volume (area chart)
     │        GET /api/analytics/processing-volume
     │        Granularity selector: Day / Week / Month
     │
     ├── 5. Recent Overrides (table)
     │        GET /api/analytics/overrides
     │        Columns: Plan ID │ Reviewer │ Original │ Override │ Reason │ Date
     │        Paginated; filterable by PCC category
     │
     └── 6. Model Performance (KPI cards)
              GET /api/analytics/model-performance
              ├── totalEvaluated ≥ 10: shows Precision / Recall / F1
              └── totalEvaluated < 10: "Insufficient data — model performance metrics
                                        require at least 10 evaluated records"
```

**Recharts config:** `isAnimationActive={false}` in production build (all charts)

---

### Flow 3-D: Widget Layout Configuration (US-3.5)

**Trigger:** User clicks "Customize Dashboard" button on dashboard
**Exit:** Layout saved; dashboard reloads with new widget arrangement

```
[Dashboard → "Customize" button]
     │
     └── Widget configuration mode:
              ├── Drag handles visible on each card
              ├── Toggle visibility per widget (checkbox)
              ├── 12-column grid positions
              │
              ├── [Reset to Default] → DELETE /api/dashboard/configuration/{id}
              │        └── Toast: "Layout reset to default"
              │
              └── [Save Layout]
                       └── PUT /api/dashboard/configuration/{id}
                                └── Toast (green): "Layout saved"
```

**GET /api/dashboard/configuration** on load — creates default if none exists

---
