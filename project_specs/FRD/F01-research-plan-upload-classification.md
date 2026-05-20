---

## F01: Research Plan Upload & Classification
*Maps to FR-2 | Priority: P0 | Phase: 2 | Depends on: F00, F02, F09*

**Description:** The core value proposition of the platform. Reviewers upload a PDF research plan and receive an automated taxonomy classification within minutes. The upload endpoint returns `202 Accepted` immediately; a three-stage async pipeline (PDF extract → classify → persist) processes the plan in the background. Status is polled by the frontend every 5–10 seconds. A keyword-based fallback classifier ships for early iterations so the full workflow can be validated before an ML provider is selected.

---

### Terminology

- **async pipeline:** Three-stage `@Async` processing flow: `EXTRACTING` → `CLASSIFYING` → `PERSISTING`; runs on `classificationExecutor` thread pool.
- **keyword classifier:** `ClassificationStrategy` implementation that matches extracted text against a keyword dictionary; active when `classification.strategy=keyword` (default).
- **ML classifier:** `ClassificationStrategy` implementation backed by Spring AI `ChatClient`; active when `classification.strategy=ml`; Phase 5 swap.
- **text quality gate:** Pre-classification check: character count ≥ threshold, printable-char ratio ≥ 0.85, non-empty extraction; failure routes to `NEEDS_REVIEW` with `extractionWarning`.
- **confidence threshold:** Admin-configurable value (default 0.75); classifications below this score route to `NEEDS_REVIEW` instead of `CLASSIFIED`.
- **override:** Manual reviewer correction of any classification field; override reason **required** (not optional).
- **startup recovery:** `@EventListener(ApplicationReadyEvent.class)` job that re-queues `PROCESSING` records stuck beyond configurable timeout.

---

### Sub-features

- FR-2.1 — PDF multipart upload with MIME validation (Apache Tika); drag-and-drop UI with progress bar
- FR-2.2 — PDF text extraction (PDFBox 3.x `Loader.loadPDF()`); text quality gate before classification
- FR-2.3 — Auto-generated `planId` in `RP-YYYY-###` format; `Classification` record creation
- FR-2.4 — Classification fields: PCC, taxonomy category/code/subcode, summary, population, intervention, comparator, outcomes, confidence, model version, processing time
- FR-2.5 — Status lifecycle: `PENDING → PROCESSING → CLASSIFIED / FAILED / NEEDS_REVIEW`
- FR-2.6 — Manual override of all four taxonomy dimensions; override reason required; `reviewedBy`/`reviewedAt` recorded
- FR-2.7 — Retry failed classifications
- FR-2.8 — Paginated, filterable, sortable, keyword-searchable classification list

---

### Process

#### FR-2.1 / FR-2.2 / FR-2.3 — Upload and Pipeline Start
1. Reviewer `POST /api/classifications/upload` — multipart form with file (`application/pdf`) and optional `title`, `notes`.
2. System validates MIME type via Apache Tika; non-PDF returns `400 INVALID_FILE_TYPE`.
3. System validates file size ≤ `MAX_UPLOAD_SIZE_MB` (env var, default 50 MB).
4. System uploads file to S3 via `StorageService`; stores `UploadedFile` record.
5. System generates `planId` = `RP-{YYYY}-{seq}` (year-based sequence, zero-padded to 3 digits, auto-incremented per year).
6. System creates `Classification` record with `status=PENDING`, `uploadedBy=currentUser`, `uploadedAt=now`.
7. System returns `202 Accepted` with `{classificationId, planId, status: "PENDING"}`.
8. `ClassificationPipeline` asynchronously starts stage 1 (`EXTRACTING`).

#### Pipeline Stage 1 — PDF Text Extraction
1. Set `status=PROCESSING`.
2. Download PDF from S3 via `StorageService.getFile()`.
3. Extract text using PDFBox `Loader.loadPDF()` (3.x API; `PDDocument.load()` removed in 3.x).
4. Run text quality gate:
   - Character count ≥ 100 (configurable).
   - Printable character ratio ≥ 0.85.
   - Non-empty extraction.
5. Quality gate failure: set `extractionWarning`, route to `NEEDS_REVIEW`; stop pipeline.
6. Store truncated preview (≤500 chars) on `Classification.textPreview`; never log full text.

#### Pipeline Stage 2 — Classification
1. Invoke `ClassificationStrategy.classify(extractedText, taxonomyTree)`.
2. Keyword strategy: match against taxonomy keyword dictionary; assign PCC, category, code, subcode; set `confidenceScore` (0.0–1.0); set `modelVersion=keyword-v{n}`.
3. ML strategy (Phase 5): invoke Spring AI `ChatClient`; structured output to `ClassificationResult` POJO; strip markdown fences; token budget management (truncate text to context window − prompt tokens).
4. On parse failure (ML): fall back to keyword strategy (not `FAILED`).
5. Compare `confidenceScore` against `NEEDS_REVIEW_THRESHOLD` (admin setting, default 0.75).
6. `confidenceScore < threshold` → `NEEDS_REVIEW`; otherwise → `CLASSIFIED`.

#### Pipeline Stage 3 — Persist
1. Update `Classification` with all fields: PCC, taxonomyCategory, taxonomyCode, taxonomySubcode, projectSummary, populationSetting, intervention, comparator, primaryOutcome, secondaryOutcomes, confidenceScore, modelVersion, processingTime (ms), `classifiedAt=now`.
2. Set final `status` (`CLASSIFIED` or `NEEDS_REVIEW`).
3. Record `classifiedAt` timestamp.
4. On any unrecoverable pipeline exception: set `status=FAILED`, store error message.

#### Startup Recovery
- On `ApplicationReadyEvent`: query all `Classification` records where `status=PROCESSING` and `updatedAt < now - STUCK_TIMEOUT_MINUTES` (env var, default 15).
- Re-queue each for pipeline re-start.
- Log count of recovered records at INFO level (no PII/PHI in log message).

#### FR-2.6 — Manual Override
1. Reviewer `PUT /api/classifications/{id}/override` with `{pcc?, taxonomyCategory?, taxonomyCode?, taxonomySubcode?, overrideReason}`.
2. `overrideReason` is **required** (400 if missing or blank).
3. System validates at least one taxonomy field provided.
4. System updates classification fields; sets `reviewedBy=currentUser`, `reviewedAt=now`, `status=CLASSIFIED`.
5. Returns updated `Classification` object.

#### FR-2.7 — Retry
1. User `POST /api/classifications/{id}/retry`.
2. Validates `status=FAILED`.
3. Resets `status=PENDING`, clears error fields.
4. Re-submits to pipeline.
5. Returns `202 Accepted` with updated classification.

#### FR-2.8 — Search / Filter / Paginate
- `GET /api/classifications` with query params: `page`, `size` (default 25), `sort`, `status`, `startDate`, `endDate`, `pcc`, `q` (keyword search on planId/title).
- `JpaSpecificationExecutor` for dynamic filter composition.
- Default sort: `uploadedAt DESC`.
- Filter state preservation: active filter selections must be preserved in frontend state (e.g., URL query params or React context) so that navigating to a classification detail view and returning to the list restores the same filter and page position. This is a frontend routing responsibility, not a backend API change.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `file` | multipart binary | yes | PDF only (Apache Tika MIME validation); max `MAX_UPLOAD_SIZE_MB` |
| `title` | string | no | Max 255 chars; defaults to filename if omitted |
| `notes` | string | no | Max 2000 chars |
| `overrideReason` | string | yes (override) | 1–2000 chars; required on override, not optional |
| `pcc` (override) | string | no | Must match active TaxonomyCategory code |
| `taxonomyCategory` (override) | string | no | Must match active TaxonomyCategory name |
| `taxonomyCode` (override) | string | no | Must match active code in taxonomy |
| `taxonomySubcode` (override) | string | no | Must match active subcode in taxonomy |
| `page` | integer | no | Default 0; min 0 |
| `size` | integer | no | Default 25; max 100 |
| `status` filter | enum | no | One of: `PENDING`, `PROCESSING`, `CLASSIFIED`, `FAILED`, `NEEDS_REVIEW` |
| `startDate`, `endDate` | ISO-8601 date | no | `startDate <= endDate` |

---

### Outputs

| Scenario | HTTP Status | Response |
|---|---|---|
| Upload accepted | `202 Accepted` | `{classificationId, planId, status: "PENDING", uploadedAt}` |
| Classification retrieved | `200 OK` | Full `Classification` object (see schema) |
| Classification list | `200 OK` | `{content: [...], page, size, totalElements, totalPages}` |
| Override applied | `200 OK` | Updated `Classification` object |
| Retry accepted | `202 Accepted` | `{classificationId, status: "PENDING"}` |
| Statistics | `200 OK` | `{total, classified, processing, pending, failed, needsReview, avgConfidence}` |

---

### Validation Rules

- PDF-only: MIME type must be `application/pdf` (Apache Tika, not extension-only check). Error `400 INVALID_FILE_TYPE`.
- File size ≤ `MAX_UPLOAD_SIZE_MB` env var (default 50 MB). Error `413 FILE_TOO_LARGE`.
- `planId` generation: `RP-{4-digit year}-{3-digit zero-padded sequence per year}` e.g., `RP-2026-001`. Sequence resets per year. Atomic counter to prevent duplicates under concurrent load.
- `overrideReason`: must be non-blank string, 1–2000 chars. `400 VALIDATION_ERROR` if missing.
- Taxonomy override fields: each code/subcode must reference an active (`is_active=true`) TaxonomyCategory; `400 INVALID_TAXONOMY_CODE` if not found or inactive.
- `NEEDS_REVIEW_THRESHOLD`: admin-configurable (0.0–1.0); default 0.75; stored in application settings table; never hardcoded.
- Retry only allowed on `status=FAILED`. `400 INVALID_STATUS` if other status.
- Extracted text: never logged at INFO/DEBUG; never stored in full in DB; truncated preview ≤500 chars stored in `textPreview` field only.
- Text quality gate thresholds: `MIN_CHAR_COUNT` (default 100), `MIN_PRINTABLE_RATIO` (default 0.85) — both configurable.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Non-PDF file uploaded | `400 Bad Request` | `INVALID_FILE_TYPE` | "Only PDF files are accepted" |
| File exceeds size limit | `413 Payload Too Large` | `FILE_TOO_LARGE` | "File exceeds maximum allowed size of {n}MB" |
| Classification not found | `404 Not Found` | `NOT_FOUND` | "Classification {id} not found" |
| Override reason missing | `400 Bad Request` | `VALIDATION_ERROR` | "Override reason is required" |
| Invalid taxonomy code on override | `400 Bad Request` | `INVALID_TAXONOMY_CODE` | "Taxonomy code {code} is not active" |
| Retry on non-FAILED record | `400 Bad Request` | `INVALID_STATUS` | "Retry is only available for FAILED classifications" |
| Pipeline stage exception | Internal — sets `status=FAILED` | — | Error stored on `Classification.errorMessage` |
| S3 upload failure | `503 Service Unavailable` | `STORAGE_UNAVAILABLE` | "File storage is unavailable. Try again." |
| Text extraction empty | Routes to `NEEDS_REVIEW` | — | `extractionWarning="No extractable text found"` |
| Low confidence | Routes to `NEEDS_REVIEW` | — | `confidenceScore < threshold` |

---

### API Surface (this feature)
See `Y1-api.md` §Classifications for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `POST` | `/api/classifications/upload` | JWT | `REVIEWER` |
| `GET` | `/api/classifications` | JWT | `REVIEWER` |
| `GET` | `/api/classifications/{id}` | JWT | `REVIEWER` |
| `GET` | `/api/classifications/{id}/results` | JWT | `REVIEWER` |
| `PUT` | `/api/classifications/{id}/override` | JWT | `REVIEWER` |
| `POST` | `/api/classifications/{id}/retry` | JWT | `REVIEWER` |
| `DELETE` | `/api/classifications/{id}` | JWT | `ADMIN` |
| `GET` | `/api/classifications/search` | JWT | `REVIEWER` |
| `GET` | `/api/classifications/status/{status}` | JWT | `REVIEWER` |
| `GET` | `/api/classifications/statistics` | JWT | `MANAGER` |
| `GET` | `/api/classifications/recent` | JWT | `REVIEWER` |

---

### Schema Surface (this feature)
Uses tables: `classifications`, `uploaded_files` — see `Y0-schema.md` §Classification.

Key fields:
- `classifications.plan_id` — `RP-YYYY-###` format; unique
- `classifications.status` — enum: `PENDING`, `PROCESSING`, `CLASSIFIED`, `FAILED`, `NEEDS_REVIEW`
- `classifications.confidence_score` — `DECIMAL(5,4)`; 0.0000–1.0000
- `classifications.override_reason` — text; null until override applied
- `classifications.reviewed_by` — FK to `users.id`; null until reviewed
- `classifications.text_preview` — varchar(500); truncated extracted text for debug
- `classifications.extraction_warning` — varchar(255); quality gate failure message
- `classifications.model_version` — varchar(100); `keyword-v{n}` or ML provider version
