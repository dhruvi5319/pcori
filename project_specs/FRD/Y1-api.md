---

## Y1: REST API Endpoint Catalog

**Base URL:** `/api`
**Auth:** All endpoints require `Authorization: Bearer <jwt>` unless marked `[PUBLIC]`.
**Response format:** `application/json` for all endpoints.
**Error format:** RFC 7807 Problem Details — `{type, title, status, detail, timestamp, errors?: [...]}`.
**Pagination:** `{content: [...], page: N, size: N, totalElements: N, totalPages: N}`.

---

### §Auth — `/api/auth`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | [PUBLIC] | — | Create new user account |
| `POST` | `/api/auth/login` | [PUBLIC] | — | Authenticate; return JWT + refresh token |
| `POST` | `/api/auth/logout` | JWT | any | Invalidate refresh token; clear session |
| `POST` | `/api/auth/refresh` | [PUBLIC] | — | Exchange refresh token for new JWT |
| `GET` | `/api/auth/verify-email` | [PUBLIC] | — | Confirm email via `?token={uuid}` |
| `POST` | `/api/auth/forgot-password` | [PUBLIC] | — | Initiate password reset email |
| `POST` | `/api/auth/reset-password` | [PUBLIC] | — | Complete reset with token + newPassword |

**POST /api/auth/register — Request:**
```json
{
  "username": "jsmith",
  "email": "jsmith@example.com",
  "password": "Secure123!",
  "firstName": "Jane",
  "lastName": "Smith"
}
```
**Response 201:**
```json
{
  "id": "uuid",
  "username": "jsmith",
  "email": "jsmith@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "createdAt": "2026-05-20T10:00:00Z"
}
```

**POST /api/auth/login — Request:**
```json
{ "username": "jsmith", "password": "Secure123!" }
```
**Response 200:**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<uuid>",
  "expiresIn": 3600,
  "user": { "id": "uuid", "username": "jsmith", "roles": ["REVIEWER"] }
}
```

**POST /api/auth/refresh — Request:**
```json
{ "refreshToken": "<uuid>" }
```
**Response 200:**
```json
{ "accessToken": "<new-jwt>", "expiresIn": 3600 }
```

---

### §Users — `/api/users`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/users` | JWT | `ADMIN` | List all users (paginated) |
| `GET` | `/api/users/{id}` | JWT | `ADMIN` | Get user by ID |
| `POST` | `/api/users` | JWT | `ADMIN` | Create user |
| `PUT` | `/api/users/{id}` | JWT | `ADMIN` | Update user |
| `DELETE` | `/api/users/{id}` | JWT | `ADMIN` | Deactivate user (soft) |
| `PATCH` | `/api/users/{id}/status` | JWT | `ADMIN` | Toggle active/inactive |
| `GET` | `/api/users/search` | JWT | `ADMIN` | Search users (`?q=&role=&status=&page=&size=`) |
| `GET` | `/api/users/active` | JWT | `ADMIN` | List active users |

**GET /api/users — Query params:** `page` (default 0), `size` (default 25), `sort` (default `createdAt,desc`).

**POST /api/users — Request:**
```json
{
  "username": "reviewer1",
  "email": "reviewer@org.com",
  "password": "TempPass123!",
  "firstName": "Alice",
  "lastName": "Jones",
  "roles": ["<role-uuid>"]
}
```
**PATCH /api/users/{id}/status — Request:**
```json
{ "isActive": false }
```

---

### §Dashboard — `/api/dashboard`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/dashboard/metrics` | JWT | `REVIEWER` | KPI counts + avg confidence (all-time) |
| `GET` | `/api/dashboard/metrics/range` | JWT | `REVIEWER` | KPI counts with `?startDate=&endDate=` filter |
| `GET` | `/api/dashboard/configuration` | JWT | `REVIEWER` | Get current user's widget config |
| `GET` | `/api/dashboard/configuration/{id}` | JWT | `REVIEWER` | Get specific config by ID |
| `POST` | `/api/dashboard/configuration` | JWT | `REVIEWER` | Create widget config |
| `PUT` | `/api/dashboard/configuration/{id}` | JWT | `REVIEWER` | Update widget config |
| `DELETE` | `/api/dashboard/configuration/{id}` | JWT | `REVIEWER` | Delete widget config |

**GET /api/dashboard/metrics — Response 200:**
```json
{
  "total": 1250,
  "classified": 1100,
  "processing": 5,
  "pending": 40,
  "failed": 10,
  "needsReview": 95,
  "avgConfidence": 0.8342
}
```

**POST /api/dashboard/configuration — Request:**
```json
{
  "layout": { "widgets": [{"id": "kpi-total", "position": 0, "size": 3, "visible": true}], "version": 1 }
}
```

---

### §Taxonomy — `/api/taxonomy`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/taxonomy` | JWT | `REVIEWER` | List all categories (paginated) |
| `GET` | `/api/taxonomy/tree` | JWT | `REVIEWER` | Full nested tree |
| `GET` | `/api/taxonomy/{id}` | JWT | `REVIEWER` | Get category by ID |
| `GET` | `/api/taxonomy/code/{code}` | JWT | `REVIEWER` | Get category by code |
| `GET` | `/api/taxonomy/{id}/children` | JWT | `REVIEWER` | Direct children of node |
| `GET` | `/api/taxonomy/search` | JWT | `REVIEWER` | Search (`?q=&activeOnly=true`) |
| `GET` | `/api/taxonomy/active` | JWT | `REVIEWER` | All active categories |
| `POST` | `/api/taxonomy` | JWT | `TAXONOMY_ADMIN` | Create category |
| `PUT` | `/api/taxonomy/{id}` | JWT | `TAXONOMY_ADMIN` | Update category |
| `DELETE` | `/api/taxonomy/{id}` | JWT | `TAXONOMY_ADMIN` | Deactivate (not hard-delete) |
| `PATCH` | `/api/taxonomy/{id}/status` | JWT | `TAXONOMY_ADMIN` | Toggle active status |

**GET /api/taxonomy/tree — Response 200 (example):**
```json
[
  {
    "id": "uuid",
    "code": "T2D",
    "name": "Type 2 Diabetes",
    "level": 0,
    "isActive": true,
    "displayOrder": 1,
    "children": [
      { "id": "uuid2", "code": "SDM", "name": "Shared Decision Making", "level": 1, "children": [] }
    ]
  }
]
```

**POST /api/taxonomy — Request:**
```json
{
  "code": "TELEHEALTH",
  "name": "Telehealth",
  "description": "Remote care interventions",
  "parentId": "uuid",
  "level": 1,
  "displayOrder": 5
}
```

---

### §Classifications — `/api/classifications`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/classifications/upload` | JWT | `REVIEWER` | Upload PDF; returns 202 |
| `GET` | `/api/classifications` | JWT | `REVIEWER` | List (paginated, filterable) |
| `GET` | `/api/classifications/{id}` | JWT | `REVIEWER` | Get classification by ID |
| `GET` | `/api/classifications/{id}/results` | JWT | `REVIEWER` | Get classification result fields only |
| `PUT` | `/api/classifications/{id}/override` | JWT | `REVIEWER` | Apply manual override |
| `POST` | `/api/classifications/{id}/retry` | JWT | `REVIEWER` | Retry failed classification |
| `DELETE` | `/api/classifications/{id}` | JWT | `ADMIN` | Soft-delete classification |
| `GET` | `/api/classifications/search` | JWT | `REVIEWER` | Full-text search (`?q=`) |
| `GET` | `/api/classifications/status/{status}` | JWT | `REVIEWER` | Filter by status |
| `GET` | `/api/classifications/statistics` | JWT | `MANAGER` | Aggregate statistics |
| `GET` | `/api/classifications/recent` | JWT | `REVIEWER` | Recent N classifications (`?limit=10`) |

**POST /api/classifications/upload — Request:** `multipart/form-data`
- `file`: PDF binary
- `title` (optional): string
- `notes` (optional): string

**Response 202:**
```json
{ "classificationId": "uuid", "planId": "RP-2026-001", "status": "PENDING", "uploadedAt": "2026-05-20T10:00:00Z" }
```

**GET /api/classifications — Query params:**
- `page` (default 0), `size` (default 25), `sort` (default `uploadedAt,desc`)
- `status`: enum filter
- `startDate`, `endDate`: ISO-8601 date
- `pcc`: PCC code filter
- `q`: keyword search on planId/title

**PUT /api/classifications/{id}/override — Request:**
```json
{
  "pcc": "T2D",
  "taxonomyCategory": "Shared Decision Making",
  "taxonomyCode": "SDM",
  "taxonomySubcode": "DigitalTool",
  "overrideReason": "AI misclassified - correct PCC is Type 2 Diabetes based on Section 3"
}
```
`overrideReason` is **required**; at least one taxonomy field must be provided.

**GET /api/classifications/statistics — Response 200:**
```json
{
  "total": 1250,
  "classified": 1100,
  "processing": 5,
  "pending": 40,
  "failed": 10,
  "needsReview": 95,
  "avgConfidence": 0.8342,
  "overrideRate": 0.12
}
```

---

### §Pipeline — `/api/pipeline`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/pipeline/status` | JWT | `MANAGER` | Current pipeline state + queue depth |
| `GET` | `/api/pipeline/health` | JWT | `ADMIN` | DB connection pool stats |
| `GET` | `/api/pipeline/stats` | JWT | `MANAGER` | Aggregate run statistics |
| `GET` | `/api/pipeline/{id}` | JWT | `ADMIN` | Get pipeline run by ID |
| `GET` | `/api/pipeline/{id}/stages` | JWT | `MANAGER` | Stage cards for run |
| `GET` | `/api/pipeline/{id}/logs` | JWT | `ADMIN` | Paginated event log |
| `GET` | `/api/pipeline/{id}/history` | JWT | `MANAGER` | Run history list |
| `POST` | `/api/pipeline/{id}/start` | JWT | `ADMIN` | Start pipeline run |
| `POST` | `/api/pipeline/{id}/stop` | JWT | `ADMIN` | Stop pipeline run |
| `POST` | `/api/pipeline/{id}/pause` | JWT | `ADMIN` | Pause pipeline run |
| `POST` | `/api/pipeline/{id}/resume` | JWT | `ADMIN` | Resume paused run |
| `POST` | `/api/pipeline/{id}/stages/{stageId}/retry` | JWT | `ADMIN` | Retry failed stage |
| `POST` | `/api/pipeline/sync` | JWT | `ADMIN` | Manual sync trigger |
| `GET` | `/api/pipeline/connections` | JWT | `ADMIN` | DB connection details |
| `POST` | `/api/pipeline/connections/{id}/check` | JWT | `ADMIN` | Test specific connection |

---

### §Analytics — `/api/analytics`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/analytics/overview` | JWT | `MANAGER` | High-level analytics summary |
| `GET` | `/api/analytics/accuracy-trend` | JWT | `MANAGER` | Accuracy over time (`?startDate=&endDate=&granularity=`) |
| `GET` | `/api/analytics/category-accuracy` | JWT | `MANAGER` | Per-category accuracy breakdown |
| `GET` | `/api/analytics/confidence-distribution` | JWT | `MANAGER` | Histogram of confidence scores |
| `GET` | `/api/analytics/processing-volume` | JWT | `MANAGER` | Upload volume over time |
| `GET` | `/api/analytics/overrides` | JWT | `MANAGER` | Recent overrides table (paginated) |
| `GET` | `/api/analytics/report` | JWT | `MANAGER` | Full analytics report data |
| `GET` | `/api/analytics/model-performance` | JWT | `MANAGER` | Precision/recall/F1 metrics |

---

### §Reports & Excel — `/api/excel`, `/api/reports`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/excel/generate` | JWT | `MANAGER` | Generate + download Excel inline |
| `GET` | `/api/reports` | JWT | `MANAGER` | List generated reports |
| `POST` | `/api/reports` | JWT | `MANAGER` | Create async report |
| `GET` | `/api/reports/{id}` | JWT | `MANAGER` | Get report status |
| `GET` | `/api/reports/{id}/download` | JWT | `MANAGER` | Get pre-signed download URL |
| `GET` | `/api/reports/templates` | JWT | `MANAGER` | List saved templates |
| `POST` | `/api/reports/templates` | JWT | `MANAGER` | Create template |
| `PUT` | `/api/reports/templates/{id}` | JWT | `MANAGER` | Update template |
| `DELETE` | `/api/reports/templates/{id}` | JWT | `MANAGER` | Delete template |
| `POST` | `/api/reports/templates/{id}/run` | JWT | `MANAGER` | Run template |
| `GET` | `/api/reports/preview` | JWT | `MANAGER` | Preview report row count + sample |

**POST /api/excel/generate — Request:**
```json
{
  "columns": ["planId", "title", "status", "pcc", "confidenceScore"],
  "filters": {
    "status": ["CLASSIFIED", "NEEDS_REVIEW"],
    "startDate": "2026-01-01",
    "endDate": "2026-05-20",
    "pcc": ["T2D", "HF"]
  }
}
```
**Response 200:** Binary `.xlsx` stream with `Content-Disposition: attachment; filename="pcori-report-20260520.xlsx"`.

---

### §Files — `/api/files`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/files` | JWT | `ADMIN` | List all uploaded files (paginated) |
| `GET` | `/api/files/{id}` | JWT | owner or `ADMIN` | Get file metadata |
| `GET` | `/api/files/{id}/download-url` | JWT | owner or `ADMIN` | Get pre-signed download URL |
| `DELETE` | `/api/files/{id}` | JWT | `ADMIN` | Soft-delete file record |

**GET /api/files/{id}/download-url — Response 200:**
```json
{ "url": "https://bucket.s3.amazonaws.com/pdfs/2026/05/uuid-plan.pdf?X-Amz-...", "expiresAt": "2026-05-20T10:15:00Z" }
```

---

### §Filters — `/api/filters`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/filters` | JWT | `REVIEWER` | List current user's saved filter configs |
| `POST` | `/api/filters` | JWT | `REVIEWER` | Create filter config |
| `GET` | `/api/filters/{id}` | JWT | `REVIEWER` | Get filter config |
| `PUT` | `/api/filters/{id}` | JWT | `REVIEWER` | Update filter config |
| `DELETE` | `/api/filters/{id}` | JWT | `REVIEWER` | Delete filter config |

---

### §Notifications — `/api/notifications`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/notifications` | JWT | any | List current user's notifications |
| `GET` | `/api/notifications/unread-count` | JWT | any | Unread badge count |
| `PATCH` | `/api/notifications/{id}/read` | JWT | any | Mark single notification read |
| `POST` | `/api/notifications/read-all` | JWT | any | Mark all notifications read |
| `GET` | `/api/notifications/preferences` | JWT | any | Get notification preferences |
| `PUT` | `/api/notifications/preferences` | JWT | any | Update notification preferences |

---

### §Help — `/api/help`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/help/articles` | JWT | any | List articles (summary) |
| `GET` | `/api/help/articles/{slug}` | JWT | any | Get article by slug (full content) |
| `GET` | `/api/help/articles/search` | JWT | any | Search articles (`?q=`) |
| `POST` | `/api/help/articles` | JWT | `ADMIN` | Create article |
| `PUT` | `/api/help/articles/{id}` | JWT | `ADMIN` | Update article |
| `DELETE` | `/api/help/articles/{id}` | JWT | `ADMIN` | Delete article |
| `GET` | `/api/help/faqs` | JWT | any | List FAQs (`?category=`) |
| `POST` | `/api/help/faqs` | JWT | `ADMIN` | Create FAQ |
| `PUT` | `/api/help/faqs/{id}` | JWT | `ADMIN` | Update FAQ |
| `DELETE` | `/api/help/faqs/{id}` | JWT | `ADMIN` | Delete FAQ |
| `POST` | `/api/help/feedback` | JWT | any | Submit article feedback |
| `GET` | `/api/help/articles/{id}/feedback` | JWT | `ADMIN` | Get feedback summary for article |

---

### §Actuator — `/actuator` (Production-restricted)

| Path | Exposed Externally | Notes |
|---|---|---|
| `/actuator/health` | Yes | Basic health check |
| `/actuator/prometheus` | Yes (internal IP or admin role) | Metrics scrape endpoint |
| All others | No | Restricted to internal network or `ADMIN` role |

Swagger UI: enabled on `dev` profile only; disabled in `prod` profile.
