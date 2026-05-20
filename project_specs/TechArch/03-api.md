---

## 4. API Design

### 4.1 Global Conventions

| Convention | Value |
|---|---|
| Base URL | `/api` |
| Auth | `Authorization: Bearer <jwt>` on all protected endpoints |
| Content-Type | `application/json` (except file upload: `multipart/form-data`) |
| Error format | RFC 7807 Problem Details: `{type, title, status, detail, timestamp, errors?: [{field, message}]}` |
| Pagination | `{content: [...], page: N, size: N, totalElements: N, totalPages: N}` |
| Default page size | 25 |
| Max page size | 100 |
| Soft-delete | `DELETE` endpoints deactivate/soft-delete; never hard-delete |
| Timestamps | ISO-8601 with UTC (`2026-05-20T10:00:00Z`) |

### 4.2 TypeScript Interfaces (Frontend Types)

```typescript
// types/api.ts
export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ErrorResponse {
  type: string
  title: string
  status: number
  detail: string
  timestamp: string
  errors?: FieldError[]
}

export interface FieldError {
  field: string
  message: string
}
```

```typescript
// types/user.ts
export type UserRole = 'REVIEWER' | 'MANAGER' | 'TAXONOMY_ADMIN' | 'ADMIN' | 'VIEWER'

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  isActive: boolean
  isEmailVerified: boolean
  roles: UserRole[]
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    username: string
    roles: UserRole[]
  }
}

export interface RegisterRequest {
  username: string          // 3–50 chars; alphanumeric + underscore
  email: string             // RFC 5322
  password: string          // 8–128 chars; complexity rules
  firstName: string
  lastName: string
}
```

```typescript
// types/classification.ts
export type ClassificationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'CLASSIFIED'
  | 'FAILED'
  | 'NEEDS_REVIEW'

export interface Classification {
  id: string
  planId: string              // RP-2026-001
  title?: string
  status: ClassificationStatus
  // Taxonomy assignment
  pcc?: string
  taxonomyCategory?: string
  taxonomyCode?: string
  taxonomySubcode?: string
  primaryCondition?: string
  secondaryConditions?: string
  icdCodes?: string
  // Extracted content
  projectSummary?: string
  populationSetting?: string
  intervention?: string
  comparator?: string
  primaryOutcome?: string
  secondaryOutcomes?: string
  textPreview?: string        // max 500 chars
  extractionWarning?: string
  // Classification metadata
  confidenceScore?: number    // 0.0–1.0 — displayed as "AI Confidence"
  modelVersion?: string
  processingTimeMs?: number
  // File
  fileId?: string
  fileName?: string
  fileSize?: number
  filePath?: string
  notes?: string
  // Review audit
  uploadedBy: string          // username
  uploadedAt: string
  classifiedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  overrideReason?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface UploadResponse {
  classificationId: string
  planId: string
  status: 'PENDING'
  uploadedAt: string
}

export interface ManualOverrideRequest {
  pcc?: string
  taxonomyCategory?: string
  taxonomyCode?: string
  taxonomySubcode?: string
  overrideReason: string      // required; 1–2000 chars
}

export interface ClassificationFilters {
  page?: number
  size?: number
  sort?: string
  status?: ClassificationStatus
  startDate?: string
  endDate?: string
  pcc?: string
  q?: string
}

export interface ClassificationStatistics {
  total: number
  classified: number
  processing: number
  pending: number
  failed: number
  needsReview: number
  avgConfidence: number
  overrideRate: number
}
```

```typescript
// types/taxonomy.ts
export interface TaxonomyCategory {
  id: string
  code: string
  name: string
  description?: string
  parentId?: string
  isActive: boolean
  level: number              // 0=root/PCC, 1=category, 2=code, 3=subcode
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface TaxonomyTreeNode extends TaxonomyCategory {
  children: TaxonomyTreeNode[]
}

export interface CreateTaxonomyRequest {
  code: string               // 1–50 chars; unique within parent
  name: string               // 1–255 chars
  description?: string
  parentId?: string
  level: number
  displayOrder?: number
}
```

```typescript
// types/dashboard.ts
export interface DashboardMetrics {
  total: number
  classified: number
  processing: number
  pending: number
  failed: number
  needsReview: number
  avgConfidence: number      // field name: avgConfidence; UI label: "Avg. AI Confidence"
}

export interface DashboardConfiguration {
  id: string
  userId: string
  layout: WidgetLayout
  createdAt: string
  updatedAt: string
}

export interface WidgetLayout {
  widgets: WidgetConfig[]
  version: number
}

export interface WidgetConfig {
  id: string
  position: number
  size: number               // 1–12 (12-column grid)
  visible: boolean
}

export interface AccuracyTrendPoint {
  date: string
  aiAccuracy: number
  humanCorrectedAccuracy: number
}

export interface CategoryAccuracy {
  category: string
  total: number
  overrideCount: number
  accuracyRate: number
}

export interface ConfidenceBucket {
  bucket: string             // "0.0-0.1", "0.1-0.2", ...
  count: number
}

export interface ModelPerformance {
  precision: number
  recall: number
  f1: number
  totalEvaluated: number
  insufficient?: boolean
}
```

```typescript
// types/notification.ts
export type NotificationType =
  | 'CLASSIFICATION_COMPLETED'
  | 'CLASSIFICATION_FAILED'
  | 'CLASSIFICATION_NEEDS_REVIEW'
  | 'PIPELINE_FAILURE'
  | 'OVERRIDE_SUBMITTED'

export type NotificationChannel = 'IN_APP' | 'EMAIL'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface NotificationPreference {
  eventType: NotificationType
  channel: NotificationChannel
  enabled: boolean
}
```

```typescript
// types/report.ts
export type ReportStatus = 'GENERATING' | 'READY' | 'FAILED'

export interface ReportConfiguration {
  id: string
  name: string
  ownerId: string
  columns: string[]
  filters: ReportFilters
  createdAt: string
  updatedAt: string
}

export interface ReportFilters {
  status?: ClassificationStatus[]
  startDate?: string
  endDate?: string
  pcc?: string[]
}

export interface ExcelReport {
  id: string
  configurationId?: string
  status: ReportStatus
  generatedAt?: string
  filePath?: string
  errorMessage?: string
  createdAt: string
}

export interface GenerateReportRequest {
  columns?: string[]       // defaults to all if omitted
  filters?: ReportFilters
}

export interface FilterConfiguration {
  id: string
  userId: string
  name: string
  criteria: ReportFilters
  createdAt: string
}
```

### 4.3 Complete API Endpoint Catalog

#### §Auth — `/api/auth`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | None | — | Create account; returns 201 with sanitized User |
| `POST` | `/api/auth/login` | None | — | Authenticate; returns JWT + refresh token |
| `POST` | `/api/auth/logout` | JWT | any | Invalidate refresh token |
| `POST` | `/api/auth/refresh` | None | — | Exchange refresh token for new JWT |
| `GET` | `/api/auth/verify-email?token={uuid}` | None | — | Confirm email verification |
| `POST` | `/api/auth/forgot-password` | None | — | Send password reset email |
| `POST` | `/api/auth/reset-password` | None | — | Complete reset with token + newPassword |

#### §Users — `/api/users`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/users` | JWT | `ADMIN` | List all users (paginated) |
| `GET` | `/api/users/{id}` | JWT | `ADMIN` | Get user by ID |
| `POST` | `/api/users` | JWT | `ADMIN` | Create user with role assignment |
| `PUT` | `/api/users/{id}` | JWT | `ADMIN` | Update user (name, phone, roles) |
| `DELETE` | `/api/users/{id}` | JWT | `ADMIN` | Deactivate user (soft) |
| `PATCH` | `/api/users/{id}/status` | JWT | `ADMIN` | Toggle `isActive` |
| `GET` | `/api/users/search?q=&role=&status=&page=&size=` | JWT | `ADMIN` | Search users |
| `GET` | `/api/users/active` | JWT | `ADMIN` | List active users |

#### §Dashboard — `/api/dashboard`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/dashboard/metrics` | JWT | `REVIEWER` | KPI counts + avgConfidence (all-time) |
| `GET` | `/api/dashboard/metrics/range?startDate=&endDate=` | JWT | `REVIEWER` | Date-filtered metrics |
| `GET` | `/api/dashboard/configuration` | JWT | `REVIEWER` | Current user's widget config |
| `GET` | `/api/dashboard/configuration/{id}` | JWT | `REVIEWER` | Specific config by ID |
| `POST` | `/api/dashboard/configuration` | JWT | `REVIEWER` | Create widget config |
| `PUT` | `/api/dashboard/configuration/{id}` | JWT | `REVIEWER` | Update widget layout |
| `DELETE` | `/api/dashboard/configuration/{id}` | JWT | `REVIEWER` | Delete config (reset to default) |

#### §Taxonomy — `/api/taxonomy`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/taxonomy` | JWT | `REVIEWER` | List all categories (paginated) |
| `GET` | `/api/taxonomy/tree` | JWT | `REVIEWER` | Full nested tree |
| `GET` | `/api/taxonomy/{id}` | JWT | `REVIEWER` | Get category by ID |
| `GET` | `/api/taxonomy/code/{code}` | JWT | `REVIEWER` | Get category by code |
| `GET` | `/api/taxonomy/{id}/children` | JWT | `REVIEWER` | Direct children of node |
| `GET` | `/api/taxonomy/search?q=&activeOnly=true` | JWT | `REVIEWER` | Full-text search |
| `GET` | `/api/taxonomy/active` | JWT | `REVIEWER` | All active categories (flat list) |
| `POST` | `/api/taxonomy` | JWT | `TAXONOMY_ADMIN` | Create category |
| `PUT` | `/api/taxonomy/{id}` | JWT | `TAXONOMY_ADMIN` | Update category |
| `DELETE` | `/api/taxonomy/{id}` | JWT | `TAXONOMY_ADMIN` | Deactivate (not hard-delete) |
| `PATCH` | `/api/taxonomy/{id}/status` | JWT | `TAXONOMY_ADMIN` | Toggle `isActive` (cascading deactivation) |

#### §Classifications — `/api/classifications`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/classifications/upload` | JWT | `REVIEWER` | Upload PDF; returns 202 immediately |
| `GET` | `/api/classifications` | JWT | `REVIEWER` | List (paginated, filterable, sortable) |
| `GET` | `/api/classifications/{id}` | JWT | `REVIEWER` | Get classification by ID |
| `GET` | `/api/classifications/{id}/results` | JWT | `REVIEWER` | Classification result fields only |
| `PUT` | `/api/classifications/{id}/override` | JWT | `REVIEWER` | Apply manual override (reason required) |
| `POST` | `/api/classifications/{id}/retry` | JWT | `REVIEWER` | Retry FAILED classification |
| `DELETE` | `/api/classifications/{id}` | JWT | `ADMIN` | Soft-delete |
| `GET` | `/api/classifications/search?q=` | JWT | `REVIEWER` | Full-text search (planId/title) |
| `GET` | `/api/classifications/status/{status}` | JWT | `REVIEWER` | Filter by status enum |
| `GET` | `/api/classifications/statistics` | JWT | `MANAGER` | Aggregate statistics |
| `GET` | `/api/classifications/recent?limit=10` | JWT | `REVIEWER` | Recent N classifications |

#### §Pipeline — `/api/pipeline`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/pipeline/status` | JWT | `MANAGER` | Current state, active runs, queue depth |
| `GET` | `/api/pipeline/health` | JWT | `ADMIN` | DB connection pool stats |
| `GET` | `/api/pipeline/stats` | JWT | `MANAGER` | Aggregate run statistics |
| `GET` | `/api/pipeline/{id}` | JWT | `ADMIN` | Pipeline run by ID |
| `GET` | `/api/pipeline/{id}/stages` | JWT | `MANAGER` | Stage cards (state, duration, errors) |
| `GET` | `/api/pipeline/{id}/logs?page=&size=` | JWT | `ADMIN` | Paginated event log |
| `GET` | `/api/pipeline/{id}/history` | JWT | `MANAGER` | Run history list |
| `POST` | `/api/pipeline/{id}/start` | JWT | `ADMIN` | Start run; 202 or 409 if already running |
| `POST` | `/api/pipeline/{id}/stop` | JWT | `ADMIN` | Graceful stop |
| `POST` | `/api/pipeline/{id}/pause` | JWT | `ADMIN` | Pause after current stage |
| `POST` | `/api/pipeline/{id}/resume` | JWT | `ADMIN` | Resume from PAUSED |
| `POST` | `/api/pipeline/{id}/stages/{stageId}/retry` | JWT | `ADMIN` | Stage-level retry (FAILED only) |
| `POST` | `/api/pipeline/sync` | JWT | `ADMIN` | Manual sync — pick up PENDING records |
| `GET` | `/api/pipeline/connections` | JWT | `ADMIN` | DB connection details |
| `POST` | `/api/pipeline/connections/{id}/check` | JWT | `ADMIN` | Test specific connection |

#### §Analytics — `/api/analytics`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/analytics/overview` | JWT | `MANAGER` | High-level analytics summary |
| `GET` | `/api/analytics/accuracy-trend?startDate=&endDate=&granularity=` | JWT | `MANAGER` | Accuracy over time |
| `GET` | `/api/analytics/category-accuracy?startDate=&endDate=` | JWT | `MANAGER` | Per-category breakdown |
| `GET` | `/api/analytics/confidence-distribution?startDate=&endDate=` | JWT | `MANAGER` | 10-bucket histogram |
| `GET` | `/api/analytics/processing-volume?startDate=&endDate=&granularity=` | JWT | `MANAGER` | Upload volume over time |
| `GET` | `/api/analytics/overrides?limit=&page=` | JWT | `MANAGER` | Recent overrides (paginated) |
| `GET` | `/api/analytics/report` | JWT | `MANAGER` | Full analytics report data |
| `GET` | `/api/analytics/model-performance?startDate=&endDate=` | JWT | `MANAGER` | Precision/recall/F1 |

#### §Reports & Excel — `/api/excel`, `/api/reports`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/excel/generate` | JWT | `MANAGER` | Generate + stream Excel inline |
| `GET` | `/api/reports` | JWT | `MANAGER` | List generated reports |
| `POST` | `/api/reports` | JWT | `MANAGER` | Create async report |
| `GET` | `/api/reports/{id}` | JWT | `MANAGER` | Report status |
| `GET` | `/api/reports/{id}/download` | JWT | `MANAGER` | Pre-signed S3 download URL |
| `GET` | `/api/reports/templates` | JWT | `MANAGER` | List saved templates |
| `POST` | `/api/reports/templates` | JWT | `MANAGER` | Create template |
| `PUT` | `/api/reports/templates/{id}` | JWT | `MANAGER` | Update template |
| `DELETE` | `/api/reports/templates/{id}` | JWT | `MANAGER` | Soft-delete template |
| `POST` | `/api/reports/templates/{id}/run` | JWT | `MANAGER` | Execute template |
| `GET` | `/api/reports/preview` | JWT | `MANAGER` | Preview row count + sample rows |

#### §Files — `/api/files`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/files` | JWT | `ADMIN` | List uploaded files (paginated) |
| `GET` | `/api/files/{id}` | JWT | owner or `ADMIN` | File metadata |
| `GET` | `/api/files/{id}/download-url` | JWT | owner or `ADMIN` | Pre-signed URL (15-min TTL) |
| `DELETE` | `/api/files/{id}` | JWT | `ADMIN` | Soft-delete file record |

#### §Filters — `/api/filters`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/filters` | JWT | `REVIEWER` | Current user's saved filter configs |
| `POST` | `/api/filters` | JWT | `REVIEWER` | Create filter config |
| `GET` | `/api/filters/{id}` | JWT | `REVIEWER` | Get filter config by ID |
| `PUT` | `/api/filters/{id}` | JWT | `REVIEWER` | Update filter config |
| `DELETE` | `/api/filters/{id}` | JWT | `REVIEWER` | Soft-delete filter config |

#### §Notifications — `/api/notifications`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/notifications?page=&size=` | JWT | any | Paginated notification list (current user) |
| `GET` | `/api/notifications/unread-count` | JWT | any | `{count: N}` for badge |
| `PATCH` | `/api/notifications/{id}/read` | JWT | any | Mark single notification read |
| `POST` | `/api/notifications/read-all` | JWT | any | Mark all read |
| `GET` | `/api/notifications/preferences` | JWT | any | Per-user preference list |
| `PUT` | `/api/notifications/preferences` | JWT | any | Update preferences (full replace) |

#### §Help — `/api/help`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/help/articles` | JWT | any | Article list (title, slug, category, publishedAt) |
| `GET` | `/api/help/articles/{slug}` | JWT | any | Full article with Markdown content |
| `GET` | `/api/help/articles/search?q=` | JWT | any | Full-text search (min 2 chars) |
| `POST` | `/api/help/articles` | JWT | `ADMIN` | Create article |
| `PUT` | `/api/help/articles/{id}` | JWT | `ADMIN` | Update article |
| `DELETE` | `/api/help/articles/{id}` | JWT | `ADMIN` | Soft-delete article |
| `GET` | `/api/help/faqs?category=` | JWT | any | FAQ list (accordion) |
| `POST` | `/api/help/faqs` | JWT | `ADMIN` | Create FAQ |
| `PUT` | `/api/help/faqs/{id}` | JWT | `ADMIN` | Update FAQ |
| `DELETE` | `/api/help/faqs/{id}` | JWT | `ADMIN` | Soft-delete FAQ |
| `POST` | `/api/help/feedback` | JWT | any | Submit article feedback (upsert) |
| `GET` | `/api/help/articles/{id}/feedback` | JWT | `ADMIN` | Feedback summary |

### 4.4 Key Request/Response Examples

**Classification Upload (202):**
```
POST /api/classifications/upload
Content-Type: multipart/form-data
Authorization: Bearer <jwt>

file: [PDF binary]
title: "Research Plan 2026 - Heart Failure Study"
notes: "Priority review requested"

→ 202 Accepted
{
  "classificationId": "550e8400-e29b-41d4-a716-446655440000",
  "planId": "RP-2026-001",
  "status": "PENDING",
  "uploadedAt": "2026-05-20T10:00:00Z"
}
```

**Override (200):**
```
PUT /api/classifications/{id}/override
{
  "pcc": "T2D",
  "taxonomyCategory": "Shared Decision Making",
  "taxonomyCode": "SDM",
  "taxonomySubcode": "DigitalTool",
  "overrideReason": "AI misclassified — correct PCC is Type 2 Diabetes per Section 3 of plan"
}
```

**Excel Export (200 — binary stream):**
```
POST /api/excel/generate
{
  "columns": ["planId", "title", "status", "pcc", "confidenceScore", "reviewedBy"],
  "filters": {
    "status": ["CLASSIFIED", "NEEDS_REVIEW"],
    "startDate": "2026-01-01",
    "endDate": "2026-05-20"
  }
}

→ 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="pcori-report-20260520.xlsx"
[binary stream]
```

---

*Section 4 of 7 — TechArch-PCORI.md*
