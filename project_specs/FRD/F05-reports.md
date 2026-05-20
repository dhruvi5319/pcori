---

## F05: Reports
*Maps to FR-6 | Priority: P1 (basic) / P2 (ad-hoc) | Phase: 4 | Depends on: F00, F01*

**Description:** Enables Program Managers and Executive Stakeholders to generate and download Excel reports from classification data without analyst intervention. A one-click Excel export ships first as the high-value P1 deliverable. An ad-hoc builder and saved templates provide power-user reporting after the core export is validated. Large exports (>1,000 rows) use Apache POI `SXSSFWorkbook` streaming to prevent OOM.

---

### Terminology

- **ExcelReport:** Generated `.xlsx` artifact entity; tracks generation status, file path on S3, and download availability.
- **ReportConfiguration:** Named template entity with column selection and filter presets; reusable across runs.
- **FilterConfiguration:** Named saved filter set entity; reusable across reports and UI filter bars.
- **SXSSFWorkbook:** Apache POI streaming variant; required for exports > 1,000 rows; tested to 5,000+ rows.
- **XSSF:** Apache POI standard workbook; used for ≤1,000 row exports; holds full workbook in memory.
- **Content-Disposition:** HTTP header set to `attachment; filename="report.xlsx"` for downloads; must be exposed in CORS `exposedHeaders`.
- **Ad-hoc builder:** UI that lets users select columns, apply filters, preview row count, then generate report.

---

### Sub-features

- FR-6.1 — One-click Excel export (`.xlsx`) of classification data
- FR-6.2 — Download generated reports via `Content-Disposition: attachment` header
- FR-6.3 — Save reusable report templates (named, column selection, filter presets)
- FR-6.4 — Ad-hoc report builder (column selector, filter builder, preview, generate)

---

### Process

#### FR-6.1 / FR-6.2 — One-Click Excel Export
1. User `POST /api/excel/generate` (or `GET /api/excel/download` for direct download) with optional filter params: `status`, `startDate`, `endDate`, `pcc`.
2. System determines row count from filter; if > 1,000 → use `SXSSFWorkbook`; otherwise `XSSFWorkbook`.
3. System queries `classifications` (paginated in chunks of 500 to control memory) — applies `AND deleted_at IS NULL`.
4. System writes rows to workbook: planId, title, status, PCC, taxonomy category, code, subcode, confidence, uploadedBy, classifiedAt, reviewedBy, overrideReason.
5. Returns `200 OK` with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `Content-Disposition: attachment; filename="pcori-report-{timestamp}.xlsx"`.
6. `SXSSFWorkbook` must be disposed (`workbook.close()`) after streaming; temp files flushed.
7. OOM safeguard: tested with 5,000-row dataset; generation must complete in < 10 s.

**Async path (for large reports):**
1. `POST /api/reports` creates an `ExcelReport` record with `status=GENERATING`.
2. Background job generates file, uploads to S3, sets `status=READY`, stores `filePath`.
3. Client polls `GET /api/reports/{id}` until `status=READY`.
4. Client `GET /api/reports/{id}/download` returns pre-signed S3 URL (15-min TTL).

#### FR-6.3 — Saved Report Templates
1. User `POST /api/reports/templates` with `{name, columns: [...], filters: {...}}`.
2. System creates `ReportConfiguration` with `ownerId=currentUser`.
3. `GET /api/reports/templates` — list user's templates.
4. `PUT /api/reports/templates/{id}` — update template.
5. `DELETE /api/reports/templates/{id}` — soft-delete.
6. `POST /api/reports/templates/{id}/run` — execute template and generate report.

#### FR-6.4 — Ad-Hoc Report Builder
1. User configures in UI: column selector (checkboxes from available classification fields), filter builder (status multi-select, date range, PCC multi-select).
2. User clicks "Preview": `GET /api/reports/preview?columns={}&filters={}` returns `{rowCount, sampleRows: [...3 rows]}`.
3. User clicks "Generate Excel": `POST /api/excel/generate` with column and filter selection.
4. System generates report (same path as FR-6.1 above).
5. Available columns: planId, title, status, pcc, taxonomyCategory, taxonomyCode, taxonomySubcode, confidenceScore, uploadedBy, uploadedAt, classifiedAt, reviewedBy, reviewedAt, overrideReason, processingTimeMs, modelVersion.

#### FR-6.5 — Saved Filter Configurations
1. User `POST /api/filters` with `{name, criteria: {status?, startDate?, endDate?, pcc?}}`.
2. System creates `FilterConfiguration` for current user.
3. Filter sets reusable in report builder and classification list filter bar.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `columns` | array of string | no (default all) | Must be from allowed column list |
| `filters.status` | enum array | no | Subset of `PENDING`, `PROCESSING`, `CLASSIFIED`, `FAILED`, `NEEDS_REVIEW` |
| `filters.startDate` | ISO-8601 date | no | Format `YYYY-MM-DD` |
| `filters.endDate` | ISO-8601 date | no | Format `YYYY-MM-DD`; ≥ `startDate` |
| `filters.pcc` | string array | no | Active PCC codes |
| `name` (template) | string | yes | 1–100 chars |
| `filterName` | string | yes (filter save) | 1–100 chars |

---

### Outputs

| Scenario | HTTP Status | Response |
|---|---|---|
| Direct Excel download | `200 OK` | Binary `.xlsx` stream with `Content-Disposition` header |
| Async report created | `202 Accepted` | `{reportId, status: "GENERATING"}` |
| Report status check | `200 OK` | `{reportId, status, generatedAt?, filePath?}` |
| Report download (async) | `200 OK` | `{downloadUrl: "<pre-signed-s3-url>"}` |
| Template created | `201 Created` | `ReportConfiguration` object |
| Templates list | `200 OK` | Array of `ReportConfiguration` objects |
| Preview result | `200 OK` | `{rowCount, sampleRows: []}` |
| Filter saved | `201 Created` | `FilterConfiguration` object |

---

### Validation Rules

- Column list: must be subset of allowed columns (see FR-6.4 list). Invalid column name → `400 INVALID_COLUMN`.
- `startDate <= endDate`; `400 INVALID_DATE_RANGE` if violated.
- Row count limit: if preview shows > 50,000 rows, warn user before generation (no hard block in v1).
- `SXSSFWorkbook` required for > 1,000 rows; system auto-selects based on row count.
- `SXSSFWorkbook` must call `workbook.close()` in `finally` block; temp files in system temp dir cleaned up on close.
- `Content-Disposition` header must be included in CORS `exposedHeaders` config.
- Report download URLs: pre-signed S3 URLs with 15-min TTL; not permanent.
- Template name: unique per user; `409 DUPLICATE_NAME` if violated.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Invalid column name | `400 Bad Request` | `INVALID_COLUMN` | "Column '{name}' is not a valid report column" |
| Invalid date range | `400 Bad Request` | `INVALID_DATE_RANGE` | "startDate must be before or equal to endDate" |
| Report not found | `404 Not Found` | `NOT_FOUND` | "Report {id} not found" |
| Report not ready | `409 Conflict` | `REPORT_NOT_READY` | "Report is still generating" |
| Template not found | `404 Not Found` | `NOT_FOUND` | "Report template {id} not found" |
| Duplicate template name | `409 Conflict` | `DUPLICATE_NAME` | "Template name already exists" |
| Generation failure | `500 Internal Server Error` | `GENERATION_FAILED` | "Report generation failed; try again" |

---

### API Surface (this feature)
See `Y1-api.md` §Reports for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `POST` | `/api/excel/generate` | JWT | `MANAGER` |
| `GET` | `/api/reports` | JWT | `MANAGER` |
| `POST` | `/api/reports` | JWT | `MANAGER` |
| `GET` | `/api/reports/{id}` | JWT | `MANAGER` |
| `GET` | `/api/reports/{id}/download` | JWT | `MANAGER` |
| `GET` | `/api/reports/templates` | JWT | `MANAGER` |
| `POST` | `/api/reports/templates` | JWT | `MANAGER` |
| `PUT` | `/api/reports/templates/{id}` | JWT | `MANAGER` |
| `DELETE` | `/api/reports/templates/{id}` | JWT | `MANAGER` |
| `POST` | `/api/reports/templates/{id}/run` | JWT | `MANAGER` |
| `GET` | `/api/reports/preview` | JWT | `MANAGER` |
| `GET` | `/api/filters` | JWT | `REVIEWER` |
| `POST` | `/api/filters` | JWT | `REVIEWER` |
| `PUT` | `/api/filters/{id}` | JWT | `REVIEWER` |
| `DELETE` | `/api/filters/{id}` | JWT | `REVIEWER` |

---

### Schema Surface (this feature)
Uses tables: `report_configurations`, `excel_reports`, `filter_configurations` — see `Y0-schema.md` §Reports.

Key fields:
- `report_configurations.columns` — `JSONB` array of column names
- `report_configurations.filters` — `JSONB` filter object
- `excel_reports.status` — enum: `GENERATING`, `READY`, `FAILED`
- `excel_reports.file_path` — S3 object key; null until `READY`
- `filter_configurations.criteria` — `JSONB` filter criteria object
