---

## F03: Dashboards & Analytics
*Maps to FR-4 | Priority: P1 | Phase: 3 | Depends on: F00, F01*

**Description:** Provides Program Managers and leadership with real-time visibility into classification volume, accuracy, and reviewer behavior. KPI cards and a recent-activity feed are meaningful from day one. Full analytics charts (accuracy trend, confidence histogram) require override data to accumulate and are initially sparse but grow in utility with usage. All visualizations share a single date-range filter. Per-user widget layout configuration is persisted in the `DashboardConfiguration` entity.

---

### Terminology

- **KPI card:** Summary metric tile (count or average); renders loading skeleton during fetch.
- **Date-range filter:** Start/end date selector that cascades to **all** KPI cards and chart components simultaneously.
- **Accuracy trend:** Line chart comparing human-validated (override) outcomes vs. original AI output; requires override history to be meaningful.
- **AI Confidence:** The model's self-reported confidence score (0.0–1.0); displayed as "AI Confidence", **never** as "Accuracy" (LLM scores are not calibrated probabilities).
- **DashboardMetric:** Pre-aggregated time-series record (`name`, `value`, `category`, `recordedAt`); avoids N×GROUP BY degradation on large datasets.
- **DashboardConfiguration:** Per-user JSON widget layout; persisted per user.
- **isAnimationActive=false:** Recharts charts must disable animation in production to prevent paint jank.
- **Conditional polling:** Frontend polls only when `PROCESSING` records exist; `staleTime` set per resource type (not global `staleTime: 0`).

---

### Sub-features

- FR-4.1 — Status KPI cards: Total Plans, Classified, Processing, Pending, Failed, Needs Review
- FR-4.2 — Average AI Confidence score KPI card
- FR-4.3 — Recent Classifications feed (last N items, sorted by `uploadedAt`)
- FR-4.4 — Analytics charts: accuracy trend, category accuracy, confidence distribution, processing volume, recent overrides, model performance
- FR-4.5 — Per-user dashboard widget layout configuration (persisted)
- FR-4.6 — Date-range filter cascading to all KPIs and charts

---

### Process

#### FR-4.1 / FR-4.2 — KPI Metrics
1. Client `GET /api/dashboard/metrics?startDate={}&endDate={}` (date range optional; defaults to all-time).
2. Backend queries `classifications` table (with `deleted_at IS NULL` explicitly on native queries).
3. Returns aggregate counts per status + average confidence score.
4. Response cached on frontend with `staleTime: 30000` (30 s).
5. Each KPI card renders independently via `useQuery`; card shows skeleton on load, empty state if no data.

#### FR-4.3 — Recent Classifications Feed
1. Client `GET /api/classifications/recent?limit=10` (default limit 10, max 25).
2. Returns latest N classifications ordered by `uploadedAt DESC`.
3. Feed shows: planId, title, status badge, PCC, taxonomy category, confidence %, classifiedAt.
4. Status badge includes text label (color is never the sole indicator — WCAG requirement).

#### FR-4.4 — Analytics Charts

**Accuracy Trend (line chart):**
- `GET /api/analytics/accuracy-trend?startDate={}&endDate={}&granularity={day|week|month}`.
- Compares original AI classification vs. human-corrected (override) value per time bucket.
- Requires override data; returns empty series with guidance message if no overrides exist.
- Data series: `{date, aiAccuracy, humanCorrectedAccuracy}` per bucket.

**Category Accuracy (horizontal bar chart):**
- `GET /api/analytics/category-accuracy?startDate={}&endDate={}`.
- Per-PCC/category breakdown of classification accuracy (overrides / total per category).
- Returns `{category, total, overrideCount, accuracyRate}` per category.

**Confidence Distribution (histogram):**
- `GET /api/analytics/confidence-distribution?startDate={}&endDate={}`.
- Bins: 0–0.1, 0.1–0.2, ... 0.9–1.0 (10 buckets).
- Returns `{bucket, count}` array.
- Labeled "AI Confidence Distribution" (not "Accuracy Distribution").

**Processing Volume (area chart):**
- `GET /api/analytics/processing-volume?startDate={}&endDate={}&granularity={day|week|month}`.
- Count of uploaded plans per time bucket.
- Returns `{date, count}` series.

**Recent Overrides (table):**
- `GET /api/analytics/overrides?limit=10&page=0`.
- Last N overrides with: planId, reviewer, original classification, override classification, reason, date.
- Paginated.

**Model Performance (KPI cards):**
- `GET /api/analytics/model-performance?startDate={}&endDate={}`.
- Returns `{precision, recall, f1, totalEvaluated}`.
- Requires ground truth from override data; shows "Insufficient data" message if `totalEvaluated < 10`.
- Precision, recall, F1 are calculated from override outcomes (human correction = ground truth).

#### FR-4.5 — Widget Configuration
1. `GET /api/dashboard/configuration` — returns current user's widget layout JSON.
2. `POST /api/dashboard/configuration` — create new config for current user.
3. `PUT /api/dashboard/configuration/{id}` — update layout JSON.
4. `DELETE /api/dashboard/configuration/{id}` — reset to default layout.
5. Layout JSON schema: `{widgets: [{id, position, size, visible}], version}`.
6. Each user has at most one active configuration; duplicate creation returns existing.

#### FR-4.6 — Date Range Filter
- Date range selector in dashboard/analytics UI sends `startDate` / `endDate` query params.
- Filter cascades to **all** KPI card queries and all chart queries simultaneously.
- On filter change: all `useQuery` hooks with date params invalidated and refetched.
- Default range: last 30 days.
- Allowed range: any valid date range; no enforced max span in v1.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `startDate` | ISO-8601 date | no | Format `YYYY-MM-DD`; must be ≤ `endDate` |
| `endDate` | ISO-8601 date | no | Format `YYYY-MM-DD`; must be ≥ `startDate` |
| `granularity` | enum | no | `day`, `week`, `month`; default `day` |
| `limit` | integer | no | 1–25; default 10 |
| `page` | integer | no | Default 0 |
| `widgetLayout` | JSON | yes (config) | Valid `{widgets: [...]}` object |

---

### Outputs

| Endpoint | HTTP Status | Response Shape |
|---|---|---|
| `GET /metrics` | `200 OK` | `{total, classified, processing, pending, failed, needsReview, avgConfidence}` |
| `GET /metrics/range` | `200 OK` | Same as metrics but date-filtered |
| `GET /classifications/recent` | `200 OK` | Array of summary classification objects |
| `GET /analytics/accuracy-trend` | `200 OK` | `{series: [{date, aiAccuracy, humanCorrectedAccuracy}]}` |
| `GET /analytics/category-accuracy` | `200 OK` | `[{category, total, overrideCount, accuracyRate}]` |
| `GET /analytics/confidence-distribution` | `200 OK` | `[{bucket, count}]` (10 buckets) |
| `GET /analytics/processing-volume` | `200 OK` | `[{date, count}]` |
| `GET /analytics/overrides` | `200 OK` | Paginated override list |
| `GET /analytics/model-performance` | `200 OK` | `{precision, recall, f1, totalEvaluated}` |
| `GET /dashboard/configuration` | `200 OK` | `DashboardConfiguration` object |

---

### Validation Rules

- All analytics queries must explicitly include `AND deleted_at IS NULL` in native SQL (Hibernate `@SQLRestriction` does not apply to `nativeQuery=true`).
- `avgConfidence` displayed as "AI Confidence" — never labeled "Accuracy" in UI or API response field names.
- Model performance metrics require `totalEvaluated >= 10`; return `{insufficient: true, message: "..."}` below threshold.
- Date range: `startDate <= endDate`; `400 INVALID_DATE_RANGE` if violated.
- Widget configuration: `position` and `size` values must be within 12-column grid bounds.
- `DashboardMetric` table must be the source for time-series aggregation queries (not direct `GROUP BY` on `classifications` at scale).
- Recharts: `isAnimationActive={false}` required in production build to prevent paint jank.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Invalid date range | `400 Bad Request` | `INVALID_DATE_RANGE` | "startDate must be before or equal to endDate" |
| Configuration not found | `404 Not Found` | `NOT_FOUND` | "Dashboard configuration not found" |
| Invalid widget layout JSON | `400 Bad Request` | `VALIDATION_ERROR` | "Invalid widget layout format" |
| Insufficient data (model perf) | `200 OK` | — | `{insufficient: true, totalEvaluated: N}` (not an error HTTP status) |

---

### API Surface (this feature)
See `Y1-api.md` §Dashboard and §Analytics for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/dashboard/metrics` | JWT | `REVIEWER` |
| `GET` | `/api/dashboard/metrics/range` | JWT | `REVIEWER` |
| `GET` | `/api/dashboard/configuration` | JWT | `REVIEWER` |
| `POST` | `/api/dashboard/configuration` | JWT | `REVIEWER` |
| `PUT` | `/api/dashboard/configuration/{id}` | JWT | `REVIEWER` |
| `DELETE` | `/api/dashboard/configuration/{id}` | JWT | `REVIEWER` |
| `GET` | `/api/analytics/overview` | JWT | `MANAGER` |
| `GET` | `/api/analytics/accuracy-trend` | JWT | `MANAGER` |
| `GET` | `/api/analytics/category-accuracy` | JWT | `MANAGER` |
| `GET` | `/api/analytics/confidence-distribution` | JWT | `MANAGER` |
| `GET` | `/api/analytics/processing-volume` | JWT | `MANAGER` |
| `GET` | `/api/analytics/overrides` | JWT | `MANAGER` |
| `GET` | `/api/analytics/model-performance` | JWT | `MANAGER` |

---

### Schema Surface (this feature)
Uses tables: `dashboard_configurations`, `dashboard_metrics` — see `Y0-schema.md` §Dashboard.

Key fields:
- `dashboard_configurations.user_id` — FK to `users.id`; unique per user
- `dashboard_configurations.layout` — `JSONB` column storing widget layout
- `dashboard_metrics.name` — metric identifier (e.g., `classifications_total`)
- `dashboard_metrics.value` — `DECIMAL(15,4)`
- `dashboard_metrics.category` — grouping key (e.g., `status`, `pcc`)
- `dashboard_metrics.recorded_at` — `TIMESTAMPTZ`
