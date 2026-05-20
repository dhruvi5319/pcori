# Functional Requirements Document (FRD)
## PCORI Research Analytics Platform

| Field | Value |
|---|---|
| **Product Name** | PCORI Research Analytics Platform |
| **Project Acronym** | PCORI |
| **FRD Version** | 1.0 |
| **Source PRD** | `project_specs/ref_docs/PRD.md` v1.0 |
| **Date** | 2026-05-20 |
| **Status** | Draft — awaiting compliance review before real PHI data |

---

## Scope

This document specifies the functional behavior of the PCORI Research Analytics Platform in sufficient detail for implementation without ambiguity. It covers all ten functional requirements (FR-1 through FR-10) mapped to PRD features F0 through F9. Each section defines exact inputs, outputs, validation rules, error states, API surface, and database schema surface. Cross-feature concerns (full DDL, consolidated API catalog, error codes, external integrations) are captured in the Y-series appendices.

**In scope:** All features in PRD v1.0 phases 1–4 (functional implementation). Phase 5 (ML provider swap) and Phase 6 (hardening) are architecturally specified but provider-specific parameters are marked TBD.

**Out of scope:** SSO/SAML, WebSocket real-time, multi-tenancy, ML model training UI, cross-org federation. See PRD §3.2.

---

## How to Read This Document

- **Feature chunks** are named `F{nn}-{slug}.md` (zero-padded). Each covers one PRD feature / FR group.
- **FR-IDs** (e.g., `FR-1.1`) match the canonical requirement IDs in `ref_docs/PRD.md` Section 6 exactly.
- **Y-series chunks** contain cross-feature technical specs: schema DDL, API catalog, error catalog, integration contracts.
- **Tables** use compact format (≤4 columns). Full DDL in `Y0-schema.md`; full API in `Y1-api.md`.
- **"see §"** cross-references refer to sections within the assembled `FRD-PCORI.md`.

---

## Master Table of Contents

| Section | File | Description |
|---|---|---|
| **F00** | `F00-authentication-authorization.md` | FR-1: Auth, JWT, RBAC, account lifecycle |
| **F01** | `F01-research-plan-upload-classification.md` | FR-2: PDF upload, async pipeline, classification, override |
| **F02** | `F02-taxonomy-management.md` | FR-3: PCORI/ICD-10 taxonomy CRUD, hierarchy, search |
| **F03** | `F03-dashboards-analytics.md` | FR-4: KPI cards, analytics charts, widget config |
| **F04** | `F04-pipeline-monitoring.md` | FR-5: Pipeline stage health, controls, logs |
| **F05** | `F05-reports.md` | FR-6: Excel export, ad-hoc builder, templates |
| **F06** | `F06-user-management.md` | FR-7: Admin user CRUD, role assignment |
| **F07** | `F07-notifications.md` | FR-8: In-app notifications, preferences |
| **F08** | `F08-help-center.md` | FR-9: Articles, FAQs, feedback |
| **F09** | `F09-file-management.md` | FR-10: S3 storage, UploadedFile entity, pre-signed URLs |
| **Y0** | `Y0-schema.md` | Database DDL — all entities |
| **Y1** | `Y1-api.md` | REST API endpoint catalog — all controllers |
| **Y2** | `Y2-errors.md` | Cross-feature HTTP error catalog |
| **Y3** | `Y3-integrations.md` | External integration contracts |

---

## Cross-Cutting Terminology

| Term | Meaning |
|---|---|
| **PCORI** | Patient-Centered Outcomes Research Institute |
| **PCC** | Primary Clinical Condition (e.g., Type 2 Diabetes, Heart Failure) |
| **Taxonomy Category** | High-level PCORI research grouping (e.g., Shared Decision Making, Telehealth) |
| **Taxonomy Code / Subcode** | Short alphanumeric codes describing intervention type |
| **Classification** | A processed research plan record with assigned taxonomy fields |
| **Override** | Manual correction of automated classification by a reviewer; reason is **required** |
| **Pipeline** | Three-stage async process: PDF extract → classify → persist |
| **planId** | Auto-generated plan identifier, format `RP-YYYY-###` (e.g., `RP-2026-001`) |
| **ICD-10** | International Classification of Diseases, 10th Revision |
| **NEEDS_REVIEW** | Classification status: AI confidence fell below admin-configurable threshold (default 0.75) |
| **BAA** | Business Associate Agreement — required before processing PHI with ML provider |
| **AuditableEntity** | JPA `@MappedSuperclass` base with `createdAt`, `updatedAt`, `createdBy`, `lastModifiedBy` |
| **Soft-delete** | `deleted_at` timestamp set instead of row removal; `@SQLRestriction("deleted_at IS NULL")` applied |
| **JWT** | JSON Web Token; 1-hour default validity; secret from env var only |
| **RBAC** | Role-Based Access Control via `User → Role → Permission` many-to-many model |
| **Pre-signed URL** | Temporary S3 object URL with 15-minute TTL; never a permanent public URL |
| **`202 Accepted`** | Upload response pattern: request accepted, pipeline runs asynchronously |
| **StorageService** | Interface abstracting S3/MinIO/Azure Blob; swappable via `@ConditionalOnProperty` |
| **ClassificationStrategy** | Interface abstracting keyword vs. ML classification; swappable via `@ConditionalOnProperty` |

---

## Cross-Cutting Non-Functional Requirements (Summary)

These apply to every feature and are not repeated in individual feature chunks.

| Category | Requirement |
|---|---|
| **Security** | JWT secret from env var only (512-bit min); BCrypt password hashing; CORS restricted to known origins; no wildcard; HTTPS in prod; account lockout; Swagger UI disabled in prod profile |
| **Performance** | Upload `202` response < 2 s (excluding model latency); dashboard load < 1.5 s; P95 API < 500 ms (excl. inference); page size default 25 |
| **Auditability** | All entities extend `AuditableEntity`; every classification stores `uploadedBy`, `reviewedBy`, `overrideReason`, `modelVersion`; soft-delete everywhere |
| **PHI Safeguards** | Extracted PDF text never logged above TRACE; never stored in full in DB; S3 denies public access; pre-signed URLs only; compliance review before real PHI |
| **Data Integrity** | `SecurityContextPropagatingDecorator` (TaskDecorator) on `classificationExecutor` prevents null audit fields in async threads |
| **Accessibility** | WCAG 2.1 AA; Radix UI primitives; color never sole status indicator; focus trap on dialogs; explicit form labels |
| **Reliability** | Startup recovery for stuck `PROCESSING` records; `CallerRunsPolicy` on executor; failed classifications retryable |
| **Database** | Dev: PostgreSQL 16 via Docker Compose (H2 eliminated); Prod: PostgreSQL or MySQL; `ddl-auto=validate` in prod; Flyway migrations from V1 |

---

## Personas and Roles

| Persona | Application Role | Key Permissions |
|---|---|---|
| Research Reviewer | `REVIEWER` | Upload plans, view classifications, submit overrides |
| Program Manager | `MANAGER` | All Reviewer perms + dashboards, reports, analytics |
| Taxonomy Administrator | `TAXONOMY_ADMIN` | Taxonomy CRUD, activate/deactivate codes |
| System Administrator | `ADMIN` | All perms + user CRUD, role assignment, pipeline control |
| Executive / Stakeholder | `VIEWER` | Read-only: dashboard, analytics, reports download |

---

*FRD v1.0 — PCORI Research Analytics Platform*
*Generated: 2026-05-20*
---

## F00: Authentication & Authorization
*Maps to FR-1 | Priority: P0 | Phase: 1 | Depends on: none*

**Description:** Secure, stateless JWT authentication with full account lifecycle management. This feature is the foundation that all other features depend on — no protected endpoint can be called without a valid `Authorization: Bearer <jwt>` header. Role-based access control (RBAC) via a `User → Role → Permission` many-to-many model gates every admin and domain feature. JWT secret is sourced exclusively from environment variables; the application refuses to start if the variable is missing.

---

### Terminology

- **JWT (JSON Web Token):** Signed, stateless access token; 1-hour default validity; configurable via `JWT_EXPIRATION_MS` env var.
- **Refresh Token:** Long-lived token stored server-side; used to issue a new JWT without re-login.
- **Role:** Named set of permissions (e.g., `REVIEWER`, `ADMIN`); assigned to users via `user_roles` join table.
- **Permission:** Atomic capability (resource + action pair, e.g., `classifications:write`).
- **Account Lockout:** Auto-lock after configurable failed-login threshold (`MAX_LOGIN_ATTEMPTS`); unlocks after TTL or admin action.
- **Email Verification Token:** Single-use token emailed on registration; account marked `emailVerified=true` on redemption.
- **Password Reset Token:** Single-use token emailed on forgot-password request; expires after `PASSWORD_RESET_TTL_MINUTES`.

---

### Sub-features

- FR-1.1 — User self-registration (username, email, BCrypt password, first/last name)
- FR-1.2 — Login with JWT issuance (1-hour default, configurable)
- FR-1.3 — Failed-login tracking and configurable account lockout
- FR-1.4 — Password reset via emailed link with configurable TTL
- FR-1.5 — Email verification flow for new accounts
- FR-1.6 — Logout (client-side token clearing; session invalidation)
- FR-1.7 — JWT validation on every protected request via `OncePerRequestFilter`
- FR-1.8 — RBAC: roles ↔ permissions many-to-many; `@PreAuthorize` at service layer

---

### Process

#### FR-1.1 Registration
1. Client `POST /api/auth/register` with `{username, email, password, firstName, lastName}`.
2. System validates: username unique, email unique and well-formed, password meets complexity rules.
3. System hashes password with BCrypt (strength 12).
4. System creates `User` record with `isActive=false`, `isEmailVerified=false`.
5. System generates `emailVerificationToken` (UUID), stores on user record.
6. System sends verification email via `EmailService`.
7. System returns `201 Created` with sanitized user object (no password hash).

#### FR-1.2 Login
1. Client `POST /api/auth/login` with `{username, password}`.
2. System checks `isActive`; if `false` → `403 ACCOUNT_INACTIVE`.
3. System checks `lockedUntil`; if in future → `403 ACCOUNT_LOCKED`.
4. System checks `isEmailVerified`; if `false` → `403 EMAIL_NOT_VERIFIED`.
5. System validates BCrypt password hash.
6. On mismatch: increment `loginAttempts`; if threshold reached, set `lockedUntil = now + lockout TTL`; return `401 INVALID_CREDENTIALS`.
7. On match: reset `loginAttempts = 0`, set `lastLoginAt = now`.
8. System generates signed JWT (HS512, subject = user UUID, includes roles claim).
9. System generates refresh token (UUID), stores with expiry.
10. Returns `200 OK` with `{accessToken, refreshToken, expiresIn, user}`.

#### FR-1.3 Account Lockout
- Failed login increments `loginAttempts` counter.
- When `loginAttempts >= MAX_LOGIN_ATTEMPTS` (env var, default 5): set `lockedUntil = now + LOCKOUT_DURATION_MINUTES`.
- Locked account returns `403 ACCOUNT_LOCKED` with remaining lock time.
- Admin can manually unlock via `PATCH /api/users/{id}/status`.
- Lock auto-expires when `lockedUntil` is in the past.

#### FR-1.4 Password Reset
1. Client `POST /api/auth/forgot-password` with `{email}`.
2. System always returns `200 OK` (prevents email enumeration).
3. If user found: generate `passwordResetToken` (UUID), set `passwordResetExpiresAt = now + TTL`.
4. Send reset email with link containing token.
5. Client `POST /api/auth/reset-password` with `{token, newPassword}`.
6. Validate token exists, not expired, password meets complexity.
7. Hash new password, clear token fields, return `200 OK`.

#### FR-1.5 Email Verification
1. Client `GET /api/auth/verify-email?token={token}`.
2. System looks up user by `emailVerificationToken`.
3. If not found or already verified: `400 INVALID_TOKEN`.
4. Set `isEmailVerified=true`, clear token, return `200 OK`.

#### FR-1.6 Logout
1. Client `POST /api/auth/logout` (JWT required in header).
2. System invalidates refresh token server-side (marks expired).
3. Returns `200 OK`. Client clears tokens from storage.

#### FR-1.7 JWT Validation
- `JwtAuthFilter` (`OncePerRequestFilter`) intercepts every request.
- Extracts `Authorization: Bearer <token>` header.
- Validates: signature (HS512, secret from env), expiry, subject (UUID maps to active user).
- On valid: populates `SecurityContextHolder` with `UsernamePasswordAuthenticationToken`.
- On invalid/missing: returns `401 UNAUTHORIZED` (public routes excluded: `/api/auth/**`, `/`, `/api/actuator/health`).

#### FR-1.8 RBAC
- Roles assigned to user via `user_roles` join table.
- Permissions assigned to roles via `role_permissions` join table.
- `@PreAuthorize("hasRole('ADMIN')")` or `@PreAuthorize("hasAuthority('classifications:write')")` at service layer methods (not controller-only).
- Unauthorized access returns `403 FORBIDDEN`.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `username` | string | yes | 3–50 chars; alphanumeric + underscore; unique |
| `email` | string | yes | Valid RFC 5322 format; unique; max 255 chars |
| `password` | string | yes | 8–128 chars; ≥1 uppercase, ≥1 lowercase, ≥1 digit |
| `firstName` | string | yes | 1–100 chars |
| `lastName` | string | yes | 1–100 chars |
| `token` (verify/reset) | string | yes | Valid UUID format; not expired |
| `newPassword` | string | yes (reset) | Same complexity rules as `password` |

---

### Outputs

| Scenario | HTTP Status | Response Body |
|---|---|---|
| Registration success | `201 Created` | `{id, username, email, firstName, lastName, createdAt}` |
| Login success | `200 OK` | `{accessToken, refreshToken, expiresIn, user: {id, username, roles}}` |
| Token refresh | `200 OK` | `{accessToken, expiresIn}` |
| Email verification | `200 OK` | `{message: "Email verified"}` |
| Password reset initiated | `200 OK` | `{message: "If account exists, reset email sent"}` |
| Password reset complete | `200 OK` | `{message: "Password updated"}` |
| Logout | `200 OK` | `{message: "Logged out"}` |

---

### Validation Rules

- Username: unique, 3–50 chars, alphanumeric + underscore only. Return `400 VALIDATION_ERROR` with field-level error if violated.
- Email: unique, RFC 5322, max 255 chars.
- Password: 8–128 chars, complexity rules (uppercase, lowercase, digit).
- JWT secret: must be present in env (`JWT_SECRET`); minimum 512-bit length (64 chars); startup `IllegalStateException` if missing.
- `emailVerificationToken`: single-use; consumed on first valid redemption.
- `passwordResetToken`: single-use; consumed on successful reset; expires per `PASSWORD_RESET_TTL_MINUTES` env var (default 60).
- Account lockout: `MAX_LOGIN_ATTEMPTS` env var (default 5); `LOCKOUT_DURATION_MINUTES` env var (default 30).
- JWT expiry: `JWT_EXPIRATION_MS` env var (default 3600000 = 1 hour).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Username already taken | `409 Conflict` | `USERNAME_TAKEN` | "Username already in use" |
| Email already registered | `409 Conflict` | `EMAIL_TAKEN` | "Email already registered" |
| Invalid credentials | `401 Unauthorized` | `INVALID_CREDENTIALS` | "Invalid username or password" |
| Account locked | `403 Forbidden` | `ACCOUNT_LOCKED` | "Account locked. Try again after {time}" |
| Account inactive | `403 Forbidden` | `ACCOUNT_INACTIVE` | "Account is deactivated" |
| Email not verified | `403 Forbidden` | `EMAIL_NOT_VERIFIED` | "Please verify your email before logging in" |
| Invalid/expired reset token | `400 Bad Request` | `INVALID_TOKEN` | "Reset token is invalid or expired" |
| Invalid/expired verify token | `400 Bad Request` | `INVALID_TOKEN` | "Verification token is invalid or expired" |
| JWT expired | `401 Unauthorized` | `TOKEN_EXPIRED` | "Access token has expired" |
| JWT invalid signature | `401 Unauthorized` | `TOKEN_INVALID` | "Invalid access token" |
| JWT missing | `401 Unauthorized` | `TOKEN_MISSING` | "Authorization header required" |
| Insufficient role/permission | `403 Forbidden` | `ACCESS_DENIED` | "Insufficient permissions" |
| Password complexity violation | `400 Bad Request` | `VALIDATION_ERROR` | Field-level error message |
| JWT_SECRET missing at startup | Application exits | — | `IllegalStateException: JWT_SECRET environment variable is required` |

---

### API Surface (this feature)
See `Y1-api.md` §Auth (`/api/auth`) for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | — |
| `POST` | `/api/auth/login` | None | — |
| `POST` | `/api/auth/logout` | JWT | any |
| `POST` | `/api/auth/refresh` | None (refresh token in body) | — |
| `GET` | `/api/auth/verify-email` | None | — |
| `POST` | `/api/auth/forgot-password` | None | — |
| `POST` | `/api/auth/reset-password` | None | — |

---

### Schema Surface (this feature)
Uses tables: `users`, `roles`, `permissions`, `user_roles`, `role_permissions` — see `Y0-schema.md` §Auth.

Key fields:
- `users.email_verification_token` — UUID; cleared after verification
- `users.password_reset_token` — UUID; cleared after reset
- `users.login_attempts` — integer counter
- `users.locked_until` — `TIMESTAMPTZ`; null when not locked
- `users.is_email_verified` — boolean
- `users.is_active` — boolean (admin-controlled)
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
---

## F02: Taxonomy Management
*Maps to FR-3 | Priority: P0 | Phase: 2 | Depends on: F00*

**Description:** Taxonomy Administrators maintain the PCORI/ICD-10 taxonomy as the single source of truth for classification targets. The taxonomy is a self-referential JPA entity tree. Taxonomy codes are never hard-deleted — activate/deactivate preserves historical classification references while removing codes from future classification targets. The taxonomy must be seeded via Flyway repeatable migration before the classification pipeline can produce meaningful results. The full hierarchical tree is exposed via a dedicated endpoint consumed by the two-pane admin UI.

---

### Terminology

- **TaxonomyCategory:** Single node in the taxonomy tree (can be PCC, category, code, or subcode level depending on `level` field).
- **Parent-child hierarchy:** Self-referential FK `parent_id → taxonomy_categories.id`; root nodes have `parent_id = NULL`.
- **Level:** Integer (0=root/PCC, 1=category, 2=code, 3=subcode); used for UI rendering and validation.
- **Display order:** Integer per sibling group controlling sort order in tree view.
- **Activate/deactivate:** `is_active` boolean flag; deactivated codes cannot be targeted by new classifications but remain on historical records.
- **Repeatable seed migration:** Flyway `R__seed_taxonomy.sql` — re-runs on any content change; idempotent upserts.

---

### Sub-features

- FR-3.1 — Full CRUD on taxonomy categories (code, name, description, level, displayOrder, parentId)
- FR-3.2 — Parent-child hierarchy (self-referential); tree and children endpoints
- FR-3.3 — Activate/deactivate without deletion; soft lifecycle
- FR-3.4 — Search by code, name, or description text
- FR-3.5 — Full hierarchical tree view (`GET /api/taxonomy/tree`) and children of a node (`GET /api/taxonomy/{id}/children`)

---

### Process

#### FR-3.1 — CRUD

**Create:**
1. Admin `POST /api/taxonomy` with `{code, name, description, parentId?, level, displayOrder}`.
2. System validates `code` unique within sibling group (same parent).
3. If `parentId` provided: validate parent exists and is active.
4. System creates `TaxonomyCategory` record with `isActive=true`.
5. Returns `201 Created` with full entity.

**Read (single):**
1. `GET /api/taxonomy/{id}` — returns single category with parent reference.
2. `GET /api/taxonomy/code/{code}` — lookup by code string.

**Update:**
1. Admin `PUT /api/taxonomy/{id}` with updatable fields.
2. System validates code uniqueness if code changed.
3. Cannot change `parentId` to create circular reference.
4. Returns `200 OK` with updated entity.

**Delete:**
- Taxonomy categories are **never hard-deleted**.
- If a "delete" action is triggered, system deactivates (`is_active=false`) instead.
- `DELETE /api/taxonomy/{id}` → behaves as deactivate, returns `200 OK` with deactivated entity.
- Reason: historical `Classification` records reference taxonomy codes; hard-delete breaks referential integrity.

#### FR-3.2 — Tree and Children

**Tree:**
1. `GET /api/taxonomy/tree` — returns entire tree as nested JSON structure.
2. Root nodes (level=0, `parent_id IS NULL`) at top level; children nested recursively.
3. Ordered by `display_order` within each sibling group.
4. Response includes `children` array on each node.
5. Large taxonomy trees (>500 nodes): lazy loading per subtree acceptable in v2; v1 returns full tree.

**Children:**
1. `GET /api/taxonomy/{id}/children` — returns direct children of the specified node.
2. Returns flat list ordered by `display_order`.

#### FR-3.3 — Activate/Deactivate
1. Admin `PATCH /api/taxonomy/{id}/status` with `{isActive: true/false}`.
2. Deactivating a parent also deactivates all descendants (cascading deactivation).
3. Activated nodes: only if parent is also active.
4. Returns updated entity.

#### FR-3.4 — Search
1. `GET /api/taxonomy/search?q={term}` — full-text search on `code`, `name`, `description`.
2. Returns flat list of matching categories (all levels), ordered by relevance.
3. Supports `activeOnly=true` query param (default true) to filter inactive.

#### FR-3.5 — Active Codes List
1. `GET /api/taxonomy/active` — returns all active categories as flat list.
2. Used by classification override dropdown and keyword classifier initialization.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `code` | string | yes (create) | 1–50 chars; alphanumeric + hyphens; unique within parent |
| `name` | string | yes (create) | 1–255 chars |
| `description` | string | no | Max 2000 chars |
| `parentId` | UUID | no | Must reference existing active category; null for root |
| `level` | integer | yes (create) | 0–3; must be parent.level + 1 if parent provided |
| `displayOrder` | integer | no | Default 0; used for sibling sort order |
| `isActive` | boolean | yes (status) | `true` or `false` |
| `q` | string | yes (search) | 1–100 chars |

---

### Outputs

| Scenario | HTTP Status | Response |
|---|---|---|
| Category created | `201 Created` | Full `TaxonomyCategory` object |
| Category retrieved | `200 OK` | Full `TaxonomyCategory` object with parent ref |
| Tree retrieved | `200 OK` | Nested tree structure (root nodes with `children` arrays) |
| Children retrieved | `200 OK` | Flat list of direct children |
| Category updated | `200 OK` | Updated `TaxonomyCategory` object |
| Status toggled | `200 OK` | Updated entity with new `isActive` |
| Search results | `200 OK` | `{content: [...], totalElements}` |
| Active list | `200 OK` | Array of active `TaxonomyCategory` objects |
| Not found | `404 Not Found` | Error response |

---

### Validation Rules

- `code` must be unique among siblings (same `parent_id`). Duplicate codes at different levels are allowed.
- `level` must equal `parent.level + 1` when `parentId` is provided; root nodes must have `level=0`.
- Circular references: system must reject a `parentId` update that would create a cycle (a node cannot be its own ancestor).
- Cascading deactivation: deactivating a node deactivates all descendant nodes in the same transaction.
- Activation constraint: a node can only be activated if its parent is also active (root nodes excepted).
- Active codes only for classification: `ClassificationStrategy` must only target `is_active=true` categories.
- `@SQLRestriction("deleted_at IS NULL")` applied to entity; soft-delete of taxonomy categories sets `deleted_at` (admin hard-delete path, not routinely used).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Category not found | `404 Not Found` | `NOT_FOUND` | "Taxonomy category {id} not found" |
| Duplicate code in sibling group | `409 Conflict` | `CODE_DUPLICATE` | "Code '{code}' already exists under this parent" |
| Invalid parent (not found/inactive) | `400 Bad Request` | `INVALID_PARENT` | "Parent category not found or inactive" |
| Level mismatch | `400 Bad Request` | `INVALID_LEVEL` | "Level must be parent level + 1" |
| Circular reference | `400 Bad Request` | `CIRCULAR_REFERENCE` | "Cannot set parent: would create circular reference" |
| Activate with inactive parent | `400 Bad Request` | `INACTIVE_PARENT` | "Cannot activate: parent category is inactive" |

---

### API Surface (this feature)
See `Y1-api.md` §Taxonomy for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/taxonomy` | JWT | `REVIEWER` |
| `GET` | `/api/taxonomy/tree` | JWT | `REVIEWER` |
| `GET` | `/api/taxonomy/{id}` | JWT | `REVIEWER` |
| `GET` | `/api/taxonomy/code/{code}` | JWT | `REVIEWER` |
| `GET` | `/api/taxonomy/{id}/children` | JWT | `REVIEWER` |
| `GET` | `/api/taxonomy/search` | JWT | `REVIEWER` |
| `GET` | `/api/taxonomy/active` | JWT | `REVIEWER` |
| `POST` | `/api/taxonomy` | JWT | `TAXONOMY_ADMIN` |
| `PUT` | `/api/taxonomy/{id}` | JWT | `TAXONOMY_ADMIN` |
| `DELETE` | `/api/taxonomy/{id}` | JWT | `TAXONOMY_ADMIN` |
| `PATCH` | `/api/taxonomy/{id}/status` | JWT | `TAXONOMY_ADMIN` |

---

### Schema Surface (this feature)
Uses table: `taxonomy_categories` — see `Y0-schema.md` §Taxonomy.

Key fields:
- `taxonomy_categories.code` — varchar(50); unique within parent
- `taxonomy_categories.parent_id` — self-referential FK to `taxonomy_categories.id`; nullable (root)
- `taxonomy_categories.level` — integer (0–3)
- `taxonomy_categories.is_active` — boolean; default true
- `taxonomy_categories.display_order` — integer; default 0

Seed data: loaded via Flyway repeatable migration `R__seed_taxonomy.sql` (upsert on `code`; re-runs on change).
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
---

## F04: Pipeline Monitoring
*Maps to FR-5 | Priority: P1 | Phase: 3 | Depends on: F00, F01*

**Description:** Provides System Administrators and Program Managers with operational visibility into the classification pipeline. Surfaces stage-level health, stuck records, and run history. Control actions (start/stop/pause/resume) and stage-level retry allow operators to manage the pipeline without direct database access. The pipeline monitoring UI is only meaningful after the async pipeline (F01) is operational.

---

### Terminology

- **Pipeline run:** A single execution lifecycle of the classification pipeline from trigger to completion or failure.
- **Stage:** One of three pipeline phases: `EXTRACT`, `CLASSIFY`, `PERSIST`. Each stage has independent state and retry capability.
- **Stage state:** `IDLE`, `RUNNING`, `PAUSED`, `STOPPED`, `FAILED`, `COMPLETED`.
- **Pipeline state:** Aggregate of stage states; one of `RUNNING`, `PAUSED`, `STOPPED`, `FAILED`.
- **Queue depth:** Number of `CLASSIFICATION` records in `PENDING` status awaiting pipeline pickup.
- **Stuck record:** Classification in `PROCESSING` status beyond `STUCK_TIMEOUT_MINUTES` env var.
- **CallerRunsPolicy:** `ThreadPoolTaskExecutor` rejection handler; prevents silent task drops under load by running rejected tasks on the calling thread.

---

### Sub-features

- FR-5.1 — View pipeline status, stage cards, and DB/queue health panel
- FR-5.2 — Control actions: Start, Stop, Pause, Resume
- FR-5.3 — Stage-level retry for individual failed stages
- FR-5.4 — Pipeline event log viewer, run history, DB connection health
- FR-5.5 — Manual sync trigger

---

### Process

#### FR-5.1 — Status and Health View
1. Client `GET /api/pipeline/status` — returns current pipeline state, active run count, queue depth.
2. Client `GET /api/pipeline/health` — returns DB connection pool stats (active, idle, max), queue depth.
3. Client `GET /api/pipeline/{id}/stages` — returns list of stage cards with: stage name, state, last run timestamp, duration (ms), error message (if failed).
4. Stuck records: query returns `classifications` where `status=PROCESSING` and `updated_at < now - STUCK_TIMEOUT_MINUTES`.
5. Stuck records are highlighted in the monitoring UI with a warning indicator.
6. Frontend polls `GET /api/pipeline/status` every 10 s while any pipeline run is active.

#### FR-5.2 — Control Actions
- `POST /api/pipeline/{id}/start` — starts a pipeline run; returns `202 Accepted` if queued, `409 ALREADY_RUNNING` if a run is active.
- `POST /api/pipeline/{id}/stop` — gracefully stops current run; in-flight stage completes, subsequent stages skipped.
- `POST /api/pipeline/{id}/pause` — pauses processing after current stage completes; state persisted.
- `POST /api/pipeline/{id}/resume` — resumes a paused pipeline from where it stopped.
- All control actions require `ADMIN` role.
- All return `200 OK` (or `202` for start) with updated pipeline state.

#### FR-5.3 — Stage-Level Retry
1. Admin `POST /api/pipeline/{id}/stages/{stageId}/retry`.
2. Validates stage is in `FAILED` state; `400 INVALID_STAGE_STATE` otherwise.
3. Resets stage to `IDLE`, re-queues for execution.
4. Returns `202 Accepted` with stage status.

#### FR-5.4 — Logs and Run History
- `GET /api/pipeline/{id}/logs` — returns pipeline event log entries (time, level, message); paginated; monospaced panel in UI.
- `GET /api/pipeline/{id}/history` — returns list of past pipeline runs with: runId, startedAt, completedAt, status, recordsProcessed, failedCount.
- `GET /api/pipeline/stats` — aggregate statistics: total runs, total processed, total failed, avg duration.
- Log entries must never contain extracted PDF text or PHI.

#### FR-5.5 — Manual Sync
- `POST /api/pipeline/sync` — triggers a one-off sync job to pick up any `PENDING` classifications not yet in active pipeline run.
- Returns `202 Accepted` with `{queued: N}` count.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `id` (pipeline run) | UUID | yes (stage ops) | Valid pipeline run ID |
| `stageId` | string | yes (stage retry) | One of: `EXTRACT`, `CLASSIFY`, `PERSIST` |
| `page` | integer | no | Default 0 |
| `size` | integer | no | Default 50 for logs |

---

### Outputs

| Endpoint | HTTP Status | Response Shape |
|---|---|---|
| `GET /pipeline/status` | `200 OK` | `{state, activeRuns, queueDepth, stuckRecordCount}` |
| `GET /pipeline/health` | `200 OK` | `{dbConnections: {active, idle, max}, queueDepth}` |
| `GET /pipeline/{id}/stages` | `200 OK` | `[{stage, state, lastRunAt, durationMs, errorMessage}]` |
| `GET /pipeline/{id}/logs` | `200 OK` | Paginated `[{timestamp, level, message}]` |
| `GET /pipeline/{id}/history` | `200 OK` | `[{runId, startedAt, completedAt, status, processed, failed}]` |
| `GET /pipeline/stats` | `200 OK` | `{totalRuns, totalProcessed, totalFailed, avgDurationMs}` |
| `POST /pipeline/{id}/start` | `202 Accepted` | `{state: "RUNNING", runId}` |
| `POST /pipeline/{id}/stop` | `200 OK` | `{state: "STOPPED"}` |
| `POST /pipeline/sync` | `202 Accepted` | `{queued: N}` |

---

### Validation Rules

- Control actions (`start`, `stop`, `pause`, `resume`, `sync`) require `ADMIN` role; `403` otherwise.
- `start`: returns `409 ALREADY_RUNNING` if a run is already in `RUNNING` state.
- `resume`: only valid if state is `PAUSED`; `400 INVALID_STATE` otherwise.
- Stage retry: stage must be in `FAILED` state; `400 INVALID_STAGE_STATE` otherwise.
- Log entries: must not contain raw extracted text; maximum log message length 1000 chars; truncate at 500 chars if oversized.
- `STUCK_TIMEOUT_MINUTES`: configurable env var (default 15); used for stuck-record surfacing in UI.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Pipeline not found | `404 Not Found` | `NOT_FOUND` | "Pipeline run {id} not found" |
| Already running | `409 Conflict` | `ALREADY_RUNNING` | "A pipeline run is already active" |
| Invalid state for action | `400 Bad Request` | `INVALID_STATE` | "Action not valid for current pipeline state: {state}" |
| Invalid stage for retry | `400 Bad Request` | `INVALID_STAGE_STATE` | "Stage {stageId} is not in FAILED state" |
| Insufficient permissions | `403 Forbidden` | `ACCESS_DENIED` | "Pipeline control requires ADMIN role" |

---

### API Surface (this feature)
See `Y1-api.md` §Pipeline for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/pipeline/status` | JWT | `MANAGER` |
| `GET` | `/api/pipeline/health` | JWT | `ADMIN` |
| `GET` | `/api/pipeline/stats` | JWT | `MANAGER` |
| `GET` | `/api/pipeline/{id}` | JWT | `ADMIN` |
| `GET` | `/api/pipeline/{id}/stages` | JWT | `MANAGER` |
| `GET` | `/api/pipeline/{id}/logs` | JWT | `ADMIN` |
| `GET` | `/api/pipeline/{id}/history` | JWT | `MANAGER` |
| `POST` | `/api/pipeline/{id}/start` | JWT | `ADMIN` |
| `POST` | `/api/pipeline/{id}/stop` | JWT | `ADMIN` |
| `POST` | `/api/pipeline/{id}/pause` | JWT | `ADMIN` |
| `POST` | `/api/pipeline/{id}/resume` | JWT | `ADMIN` |
| `POST` | `/api/pipeline/{id}/stages/{stageId}/retry` | JWT | `ADMIN` |
| `POST` | `/api/pipeline/sync` | JWT | `ADMIN` |
| `GET` | `/api/pipeline/connections` | JWT | `ADMIN` |
| `POST` | `/api/pipeline/connections/{id}/check` | JWT | `ADMIN` |

---

### Schema Surface (this feature)
Pipeline monitoring reads from `classifications` table (for stuck records, queue depth). Pipeline run state is managed in-memory by `ThreadPoolTaskExecutor` and persisted to an optional `pipeline_runs` event log table (if implemented for history persistence). See `Y0-schema.md` §Pipeline.

Key runtime state:
- `classifications.status = 'PROCESSING'` + `updated_at` — used for stuck record detection
- `classifications.status = 'PENDING'` — queue depth count
- Pipeline runs/logs optionally persisted for audit history
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
| `GET` | `/api/reports` | JWT | `MANAGER`, `VIEWER` |
| `POST` | `/api/reports` | JWT | `MANAGER` |
| `GET` | `/api/reports/{id}` | JWT | `MANAGER`, `VIEWER` |
| `GET` | `/api/reports/{id}/download` | JWT | `MANAGER`, `VIEWER` |
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
---

## F06: User Management (Admin)
*Maps to FR-7 | Priority: P0 | Phase: 1 + 4 | Depends on: F00*

**Description:** System Administrators provision, manage, and deactivate user accounts without IT intervention. Role assignment is done through the admin UI, tied to the backend `Role` entity. Accounts are deactivated (not hard-deleted) to preserve audit trail integrity — every classification record references `uploadedBy` / `reviewedBy` and those foreign keys must remain valid.

---

### Terminology

- **Deactivation:** Setting `is_active=false` on a user account; the user cannot log in; their historical records are preserved.
- **Hard-delete:** Explicitly **prohibited** for user accounts; would break FK references on `classifications.uploaded_by` and `classifications.reviewed_by`.
- **Role assignment:** Assigning one or more `Role` entities to a user via `user_roles` join table; admin UI shows multi-select.
- **Email verification enforcement:** Admin-created accounts must complete email verification before the user can log in with real data.

---

### Sub-features

- FR-7.1 — CRUD user accounts; assign roles
- FR-7.2 — Toggle active/inactive status (deactivate/reactivate)
- FR-7.3 — Search and filter users

---

### Process

#### FR-7.1 — Create User
1. Admin `POST /api/users` with `{username, email, password, firstName, lastName, roles: [roleId, ...]}`.
2. System validates: username unique, email unique, password complexity.
3. BCrypt hash password.
4. Create `User` record with `isActive=true`, `isEmailVerified=false`.
5. Assign roles via `user_roles`.
6. Send verification email.
7. Returns `201 Created` with sanitized user object (no password hash).

#### FR-7.1 — Read Users
- `GET /api/users` — paginated list (default page size 25).
- `GET /api/users/{id}` — single user detail with roles.
- `GET /api/users/active` — list of active users only.
- `GET /api/users/search?q={term}&role={roleId}&status={active|inactive}` — search by username, email, name.

#### FR-7.1 — Update User
1. Admin `PUT /api/users/{id}` with updatable fields: `firstName`, `lastName`, `phoneNumber`, `roles`.
2. Cannot change `username` or `email` via this endpoint (separate dedicated flows if needed).
3. Role update: replaces existing role assignments with new set.
4. Returns `200 OK` with updated user object.

#### FR-7.1 — Delete (Deactivate)
- `DELETE /api/users/{id}` → **behaves as deactivation** (not hard-delete).
- Sets `is_active=false`.
- User cannot log in after deactivation.
- All historical records preserved.
- Returns `200 OK` with deactivated user.

#### FR-7.2 — Toggle Status
1. Admin `PATCH /api/users/{id}/status` with `{isActive: true/false}`.
2. Deactivating: sets `is_active=false`; any active refresh tokens invalidated.
3. Reactivating: sets `is_active=true`; user can log in again.
4. Cannot deactivate own account (prevent accidental lockout).
5. Returns `200 OK` with updated user.

#### FR-7.3 — Search and Filter
- `GET /api/users/search?q={}&role={roleId}&status={active|inactive}&page={}&size={}`.
- `q` searches: username, email, firstName + lastName concatenated.
- `role` filter: by role ID.
- `status` filter: `active` = `is_active=true`; `inactive` = `is_active=false`.
- Default sort: `createdAt DESC`.
- Paginated; default page size 25.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `username` | string | yes (create) | 3–50 chars; alphanumeric + underscore; unique |
| `email` | string | yes (create) | RFC 5322; max 255 chars; unique |
| `password` | string | yes (create) | 8–128 chars; complexity rules |
| `firstName` | string | yes (create) | 1–100 chars |
| `lastName` | string | yes (create) | 1–100 chars |
| `phoneNumber` | string | no | Max 20 chars |
| `roles` | UUID array | yes (create) | At least one valid `Role.id`; `400` if role not found |
| `isActive` | boolean | yes (status) | `true` or `false` |
| `q` (search) | string | no | 1–100 chars |

---

### Outputs

| Scenario | HTTP Status | Response |
|---|---|---|
| User created | `201 Created` | User object (no password; includes roles) |
| User retrieved | `200 OK` | User object with roles and last login |
| User list | `200 OK` | `{content: [...], page, size, totalElements}` |
| User updated | `200 OK` | Updated user object |
| User deactivated | `200 OK` | Updated user with `isActive: false` |
| Status toggled | `200 OK` | Updated user |
| Search results | `200 OK` | Paginated user list |

---

### Validation Rules

- `username` unique across all users (active and inactive). `409 USERNAME_TAKEN`.
- `email` unique across all users (active and inactive). `409 EMAIL_TAKEN`.
- Password complexity: 8–128 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit.
- `roles`: must reference existing `Role` records; `400 INVALID_ROLE` if not found.
- Cannot deactivate own account: `400 SELF_DEACTIVATION`.
- Hard-delete forbidden: `DELETE /api/users/{id}` must deactivate, never drop the row.
- Role assignment: UI shows multi-select bound to available `Role` entities; roles seeded via Flyway.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Username already taken | `409 Conflict` | `USERNAME_TAKEN` | "Username already in use" |
| Email already registered | `409 Conflict` | `EMAIL_TAKEN` | "Email already registered" |
| User not found | `404 Not Found` | `NOT_FOUND` | "User {id} not found" |
| Invalid role ID | `400 Bad Request` | `INVALID_ROLE` | "Role {id} not found" |
| Self-deactivation | `400 Bad Request` | `SELF_DEACTIVATION` | "Cannot deactivate your own account" |
| Insufficient permissions | `403 Forbidden` | `ACCESS_DENIED` | "User management requires ADMIN role" |

---

### API Surface (this feature)
See `Y1-api.md` §Users for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/users` | JWT | `ADMIN` |
| `GET` | `/api/users/{id}` | JWT | `ADMIN` |
| `POST` | `/api/users` | JWT | `ADMIN` |
| `PUT` | `/api/users/{id}` | JWT | `ADMIN` |
| `DELETE` | `/api/users/{id}` | JWT | `ADMIN` |
| `PATCH` | `/api/users/{id}/status` | JWT | `ADMIN` |
| `GET` | `/api/users/search` | JWT | `ADMIN` |
| `GET` | `/api/users/active` | JWT | `ADMIN` |

---

### Schema Surface (this feature)
Uses tables: `users`, `roles`, `permissions`, `user_roles`, `role_permissions` — see `Y0-schema.md` §Auth.

Key fields:
- `users.is_active` — boolean; toggled by admin
- `users.is_email_verified` — boolean; must be true before login
- `user_roles.user_id` + `user_roles.role_id` — join table; replaced on role update
---

## F07: Notifications
*Maps to FR-8 | Priority: P2 | Phase: 3→4 | Depends on: F00, F01*

**Description:** Keeps reviewers and administrators informed of key system events without requiring them to poll the UI manually. An in-app notification bell with unread count badge delivers event messages. Per-user preferences control which channels (in-app, email) receive which event types. Email notifications are limited to critical events only to avoid noise.

---

### Terminology

- **Notification:** A single event message for a user; stored as `Notification` entity with `isRead` flag.
- **NotificationPreference:** Per-user, per-event-type, per-channel setting (in-app or email enabled/disabled).
- **Unread count:** Badge count on notification bell; count of `Notification` records where `isRead=false`.
- **Critical events (email):** Only two event types trigger email: `PIPELINE_FAILURE`, `CLASSIFICATION_FAILURE`. All others are in-app only by default.
- **Mark read:** Set `isRead=true` on one or all notifications for the current user.

---

### Notification Event Types

| Event Type | Trigger | Default: In-App | Default: Email |
|---|---|---|---|
| `CLASSIFICATION_COMPLETED` | Pipeline sets status to `CLASSIFIED` | enabled | disabled |
| `CLASSIFICATION_FAILED` | Pipeline sets status to `FAILED` | enabled | enabled (critical) |
| `CLASSIFICATION_NEEDS_REVIEW` | Confidence below threshold | enabled | disabled |
| `PIPELINE_FAILURE` | Unrecoverable pipeline error | enabled | enabled (critical) |
| `OVERRIDE_SUBMITTED` | Reviewer submits override | enabled | disabled |

---

### Sub-features

- FR-8.1 — In-app notification bell with unread count badge; notification list view
- FR-8.1 — Notification types: completed, failed, pipeline failure, override submitted
- FR-8.1 — Mark individual or all notifications read
- FR-8.2 — Per-user notification preferences: in-app and email per event type

---

### Process

#### FR-8.1 — Notification Creation (System-Generated)
1. `ClassificationPipeline` (and other system components) call `NotificationService.create(userId, type, title, message)` after relevant events.
2. System creates `Notification` record with `isRead=false`.
3. If `NotificationPreference.emailEnabled=true` for this user + event type: queue email via `EmailService`.
4. Email is sent only for `CLASSIFICATION_FAILED` and `PIPELINE_FAILURE` by default.

#### FR-8.1 — Notification Bell / List
1. Client `GET /api/notifications?page=0&size=20` — returns paginated notification list for current user.
2. Client `GET /api/notifications/unread-count` — returns `{count: N}` for badge.
3. Frontend polls `unread-count` every 30 s (not on every render; `staleTime: 30000`).
4. Notification list ordered by `createdAt DESC`.
5. Each item shows: type icon, title, message, timestamp, read/unread indicator.

#### FR-8.1 — Mark Read
- `PATCH /api/notifications/{id}/read` — marks single notification read.
- `POST /api/notifications/read-all` — marks all notifications for current user as read.
- Both return `200 OK`.

#### FR-8.2 — Notification Preferences
1. `GET /api/notifications/preferences` — returns current user's preference list (one entry per event type × channel).
2. `PUT /api/notifications/preferences` — update preferences (array of `{eventType, channel, enabled}`).
3. System creates default `NotificationPreference` records for new users (all in-app enabled; email only for critical events).
4. Preferences for non-critical event types: email can be enabled by user but email volume is their responsibility.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `page` | integer | no | Default 0 |
| `size` | integer | no | Default 20; max 50 |
| `preferences` | array | yes (update) | Array of `{eventType, channel: "IN_APP"|"EMAIL", enabled: boolean}` |
| `eventType` | enum | yes | One of: `CLASSIFICATION_COMPLETED`, `CLASSIFICATION_FAILED`, `CLASSIFICATION_NEEDS_REVIEW`, `PIPELINE_FAILURE`, `OVERRIDE_SUBMITTED` |
| `channel` | enum | yes | `IN_APP` or `EMAIL` |

---

### Outputs

| Scenario | HTTP Status | Response |
|---|---|---|
| Notification list | `200 OK` | `{content: [{id, type, title, message, isRead, createdAt}], page, totalElements}` |
| Unread count | `200 OK` | `{count: N}` |
| Mark read | `200 OK` | `{message: "Notification marked as read"}` |
| Mark all read | `200 OK` | `{message: "All notifications marked as read", count: N}` |
| Preferences retrieved | `200 OK` | `[{eventType, channel, enabled}]` |
| Preferences updated | `200 OK` | Updated preferences array |

---

### Validation Rules

- Notifications are per-user; users can only read/mark their own notifications. `403` if attempting to access another user's notification.
- `eventType` and `channel` must be valid enum values. `400 VALIDATION_ERROR` if unknown.
- Preference update: must provide complete array for all event types (partial updates not supported in v1; full replace).
- Email sending: only attempted if `NotificationPreference.emailEnabled=true` AND `EmailService` is available; silently skip if SMTP not configured (dev mode).
- Max stored notifications per user: 500 (oldest deleted on overflow); configurable via `MAX_NOTIFICATIONS_PER_USER` env var.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Notification not found | `404 Not Found` | `NOT_FOUND` | "Notification {id} not found" |
| Access to another user's notification | `403 Forbidden` | `ACCESS_DENIED` | "Access denied" |
| Invalid event type | `400 Bad Request` | `VALIDATION_ERROR` | "Invalid event type: {type}" |
| Invalid channel | `400 Bad Request` | `VALIDATION_ERROR` | "Invalid channel: {channel}" |
| SMTP unavailable (email) | Internal — log warning | — | Email silently skipped; in-app notification still created |

---

### API Surface (this feature)
See `Y1-api.md` §Notifications for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/notifications` | JWT | any |
| `GET` | `/api/notifications/unread-count` | JWT | any |
| `PATCH` | `/api/notifications/{id}/read` | JWT | any |
| `POST` | `/api/notifications/read-all` | JWT | any |
| `GET` | `/api/notifications/preferences` | JWT | any |
| `PUT` | `/api/notifications/preferences` | JWT | any |

---

### Schema Surface (this feature)
Uses tables: `notifications`, `notification_preferences` — see `Y0-schema.md` §Notifications.

Key fields:
- `notifications.user_id` — FK to `users.id`
- `notifications.type` — enum string
- `notifications.is_read` — boolean; default false
- `notification_preferences.channel` — `IN_APP` or `EMAIL`
- `notification_preferences.enabled` — boolean
---

## F08: Help Center
*Maps to FR-9 | Priority: P2 | Phase: 4 | Depends on: F00*

**Description:** Provides in-platform documentation and FAQs so reviewers can self-serve answers without contacting support. Help Center content cannot be authored until the system is built; it ships in Phase 4 after the core workflow is stable. A documentation feedback widget closes the loop on article quality. Articles are stored as Markdown content in the `HelpArticle` entity and rendered in the frontend.

---

### Terminology

- **HelpArticle:** Entity containing: title, slug (URL-friendly identifier), category, content (Markdown), publishedAt.
- **FAQ:** Entity containing: question, answer, category, displayOrder.
- **DocumentationFeedback:** Per-article, per-user feedback: helpful (boolean) + optional comment.
- **Slug:** URL-friendly article identifier (e.g., `how-to-upload-a-plan`); unique; used for routing.
- **Article category:** Grouping label used in sidebar navigation (e.g., "Getting Started", "Classification", "Reports").

---

### Sub-features

- FR-9.1 — Browse help articles by category (sidebar navigation); article content rendered from Markdown
- FR-9.1 — FAQ accordion by category
- FR-9.1 — Searchable article index
- FR-9.2 — "Was this helpful?" feedback widget (per article, per user)

---

### Process

#### FR-9.1 — Browse Articles
1. `GET /api/help/articles` — returns list of articles with title, slug, category, publishedAt (no full content for list).
2. `GET /api/help/articles/{slug}` — returns full article including Markdown content.
3. Articles grouped by `category` in sidebar navigation.
4. Frontend renders Markdown content using a Markdown renderer (e.g., `react-markdown` with sanitization).
5. Articles ordered by `publishedAt DESC` within each category.

#### FR-9.1 — Search
1. `GET /api/help/articles/search?q={term}` — full-text search on title and content.
2. Returns matching articles with snippet/highlight.
3. Empty results: show "No articles found for '{q}'" with a contact support link.

#### FR-9.1 — FAQs
1. `GET /api/help/faqs` — returns all FAQ items ordered by category and `displayOrder`.
2. `GET /api/help/faqs?category={cat}` — filter by category.
3. Frontend renders as accordion grouped by category.

#### FR-9.1 — Admin Article Management (CRUD)
1. Admin `POST /api/help/articles` — create article with `{title, slug, category, content, publishedAt?}`.
2. Admin `PUT /api/help/articles/{id}` — update article.
3. Admin `DELETE /api/help/articles/{id}` — soft-delete (sets `deleted_at`).
4. Admin `POST /api/help/faqs` / `PUT` / `DELETE` — CRUD on FAQ items.

#### FR-9.2 — Documentation Feedback
1. `POST /api/help/feedback` with `{articleId, helpful: boolean, comment?}`.
2. System stores `DocumentationFeedback` with `userId=currentUser`, `submittedAt=now`.
3. One feedback record per user per article (upsert on duplicate).
4. Returns `201 Created` or `200 OK` (upsert).
5. Admin can retrieve feedback summary: `GET /api/help/articles/{id}/feedback` — `{helpfulCount, unhelpfulCount, comments: [...]}`.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | string | yes (article) | 1–255 chars |
| `slug` | string | yes (article) | 1–100 chars; lowercase alphanumeric + hyphens; unique |
| `category` | string | yes (article) | 1–100 chars |
| `content` | string | yes (article) | Markdown; max 100,000 chars |
| `publishedAt` | ISO-8601 datetime | no | Defaults to now |
| `helpful` | boolean | yes (feedback) | `true` or `false` |
| `comment` | string | no (feedback) | Max 1000 chars |
| `q` (search) | string | yes (search) | 1–100 chars |

---

### Outputs

| Scenario | HTTP Status | Response |
|---|---|---|
| Article list | `200 OK` | `[{id, title, slug, category, publishedAt}]` |
| Article detail | `200 OK` | `{id, title, slug, category, content, publishedAt}` |
| Search results | `200 OK` | `[{title, slug, category, snippet}]` |
| FAQ list | `200 OK` | `[{id, question, answer, category, displayOrder}]` |
| Feedback submitted | `201 Created` / `200 OK` | `{message: "Feedback recorded"}` |
| Feedback summary (admin) | `200 OK` | `{helpfulCount, unhelpfulCount, comments: []}` |
| Article not found | `404 Not Found` | Error response |

---

### Validation Rules

- `slug` must be unique across all articles; `409 DUPLICATE_SLUG` if violated.
- Markdown content must be sanitized before rendering in frontend (prevent XSS via `rehype-sanitize` or equivalent).
- Feedback: upsert per user per article (one feedback per user per article; later submission overwrites earlier).
- Search: minimum query length 2 chars; `400 QUERY_TOO_SHORT` if shorter.
- Article management (create/update/delete): requires `ADMIN` role; read/search/feedback: any authenticated user.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Article not found by slug | `404 Not Found` | `NOT_FOUND` | "Article '{slug}' not found" |
| Duplicate slug | `409 Conflict` | `DUPLICATE_SLUG` | "Article slug already exists" |
| Search query too short | `400 Bad Request` | `QUERY_TOO_SHORT` | "Search query must be at least 2 characters" |
| Feedback article not found | `404 Not Found` | `NOT_FOUND` | "Article {id} not found" |

---

### API Surface (this feature)
See `Y1-api.md` §Help for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/help/articles` | JWT | any |
| `GET` | `/api/help/articles/{slug}` | JWT | any |
| `GET` | `/api/help/articles/search` | JWT | any |
| `POST` | `/api/help/articles` | JWT | `ADMIN` |
| `PUT` | `/api/help/articles/{id}` | JWT | `ADMIN` |
| `DELETE` | `/api/help/articles/{id}` | JWT | `ADMIN` |
| `GET` | `/api/help/faqs` | JWT | any |
| `POST` | `/api/help/faqs` | JWT | `ADMIN` |
| `PUT` | `/api/help/faqs/{id}` | JWT | `ADMIN` |
| `DELETE` | `/api/help/faqs/{id}` | JWT | `ADMIN` |
| `POST` | `/api/help/feedback` | JWT | any |
| `GET` | `/api/help/articles/{id}/feedback` | JWT | `ADMIN` |

---

### Schema Surface (this feature)
Uses tables: `help_articles`, `faqs`, `documentation_feedback` — see `Y0-schema.md` §Help.

Key fields:
- `help_articles.slug` — unique; URL routing key
- `help_articles.content` — Markdown text; `TEXT` column
- `documentation_feedback.helpful` — boolean
- `faqs.display_order` — integer for accordion sort order
---

## F09: File Management (S3 Storage)
*Maps to FR-10 | Priority: P0 | Phase: 1→2 | Depends on: F00*

**Description:** All uploaded PDF research plans are tracked in an `UploadedFile` entity and persisted to S3-compatible object storage. The `StorageService` interface abstracts the storage provider so AWS S3, Azure Blob, or MinIO can be swapped via configuration. Pre-signed URLs with a 15-minute TTL are used for all downloads — permanent public URLs are never issued. This feature is a prerequisite to F01 (classification upload).

---

### Terminology

- **StorageService:** Interface with methods `store(file) → path`, `getDownloadUrl(path) → preSignedUrl`, `delete(path)`; implementations: `S3StorageService` (AWS SDK v2), `MinioStorageService` (for local dev with LocalStack).
- **Pre-signed URL:** Temporary S3 URL with 15-minute TTL (configurable); generated via AWS SDK v2 `S3Presigner`; expires after TTL and cannot be refreshed without a new API call.
- **endpointOverride:** AWS SDK v2 config property; set to LocalStack endpoint in dev (`http://localhost:4566`) or MinIO endpoint; not set in production.
- **UploadedFile:** Entity tracking file metadata; linked to a `Classification` record after upload.
- **Apache Tika:** MIME detection library used to validate actual file content type (not just extension).
- **PHI safeguard:** Extracted text never stored in full; never logged; S3 bucket has public access blocked.

---

### Sub-features

- FR-10.1 — `UploadedFile` entity tracking: filename, originalName, contentType, size, storagePath, uploadedBy, uploadedAt
- FR-10.2 — File persistence to S3-compatible object storage via `StorageService` interface
- Pre-signed download URL generation (15-min TTL)
- MIME validation via Apache Tika before storage
- S3 bucket public-access denial
- PHI safeguards on storage and logging

---

### Process

#### FR-10.1 / FR-10.2 — File Upload and Storage
1. `ClassificationService` receives multipart file from `POST /api/classifications/upload`.
2. Apache Tika inspects file bytes (not just extension) to detect MIME type.
3. If MIME ≠ `application/pdf`: return `400 INVALID_FILE_TYPE` before touching storage.
4. File size check: if > `MAX_UPLOAD_SIZE_MB` (env var, default 50): return `413 FILE_TOO_LARGE`.
5. Generate storage key: `pdfs/{year}/{month}/{uuid}-{sanitizedFilename}.pdf`.
6. Call `StorageService.store(fileBytes, key, contentType)`.
7. Create `UploadedFile` record: `{filename: key, originalName, contentType: "application/pdf", size, path: key, uploadedBy: currentUser, uploadedAt: now}`.
8. Link `UploadedFile.id` to newly created `Classification.uploadedFileId`.

#### Pre-signed URL Generation
1. Client or service calls `GET /api/files/{id}/download-url`.
2. System retrieves `UploadedFile` by `id`; validates `uploadedBy = currentUser` or `ADMIN` role.
3. Calls `StorageService.getDownloadUrl(file.path)` → pre-signed URL with 15-min TTL.
4. Returns `{url: "<pre-signed-url>", expiresAt: "<ISO-8601>"}`.
5. Never returns a permanent S3 object URL; never sets object ACL to public-read.

#### S3 Bucket Security
- Bucket policy: `s3:GetObject` denied for all principals except the application IAM role and pre-signed URL recipients.
- `BlockPublicAcls: true`, `IgnorePublicAcls: true`, `BlockPublicPolicy: true`, `RestrictPublicBuckets: true`.
- All objects stored with server-side encryption (SSE-S3 or SSE-KMS — TBD with DevOps/compliance).

#### Dev/Local Storage Config
- LocalStack endpoint: `http://localhost:4566` via `AWS_ENDPOINT_OVERRIDE` env var.
- MinIO: same pattern via `endpointOverride`.
- `StorageService` bean selected via `@ConditionalOnProperty("storage.provider")`: values `s3` or `local`.

#### PHI Safeguards
- Extracted PDF text: never written to application logs at INFO or higher. Acceptable: TRACE level only.
- `Classification.textPreview` stores ≤500 chars only.
- S3 object keys do not include patient names or plan titles — only UUID-based keys.
- Raw text not stored in database columns (only `textPreview` truncated field).
- Compliance review required before processing real PHI-containing research plan PDFs through ML provider.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `file` | multipart binary | yes | PDF only; max `MAX_UPLOAD_SIZE_MB` |
| `id` (file entity) | UUID | yes (download) | Valid `UploadedFile.id` |
| `ttl` | integer (seconds) | no | Pre-signed URL TTL; default 900 (15 min); max 3600 |

---

### Outputs

| Scenario | HTTP Status | Response |
|---|---|---|
| File stored (internal) | — | `UploadedFile` record created; S3 object stored |
| Download URL | `200 OK` | `{url: "<pre-signed-url>", expiresAt: "<ISO-8601>"}` |
| File metadata | `200 OK` | `{id, originalName, contentType, size, uploadedAt, uploadedBy}` |
| File list (admin) | `200 OK` | Paginated `UploadedFile` list |
| File deleted | `200 OK` | `{message: "File deleted"}` |

---

### Validation Rules

- MIME type check via Apache Tika (byte-level, not extension). Must equal `application/pdf`. `400 INVALID_FILE_TYPE`.
- File size ≤ `MAX_UPLOAD_SIZE_MB` env var (default 50 MB). `413 FILE_TOO_LARGE`.
- Pre-signed URL TTL: 15 minutes default (`PRE_SIGNED_URL_TTL_SECONDS` env var, default 900); max 3600.
- Download authorization: requesting user must be the file uploader or have `ADMIN` role.
- S3 object keys: UUID-based (`{uuid}-{sanitized-name}.pdf`); no path traversal characters; sanitize original filename before constructing key.
- File deletion: only via admin action; soft-delete sets `deleted_at` on `UploadedFile`; S3 object optionally deleted or retained per data retention policy.
- Pre-signed URLs must never be logged or stored in database; ephemeral by design.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Non-PDF MIME type | `400 Bad Request` | `INVALID_FILE_TYPE` | "Only PDF files are accepted" |
| File too large | `413 Payload Too Large` | `FILE_TOO_LARGE` | "File exceeds maximum size of {n}MB" |
| File not found | `404 Not Found` | `NOT_FOUND` | "File {id} not found" |
| Access denied to file | `403 Forbidden` | `ACCESS_DENIED` | "Access denied" |
| S3 storage failure | `503 Service Unavailable` | `STORAGE_UNAVAILABLE` | "Storage service is unavailable" |
| S3 download URL failure | `503 Service Unavailable` | `STORAGE_UNAVAILABLE` | "Unable to generate download URL" |

---

### API Surface (this feature)
See `Y1-api.md` §Files for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/files` | JWT | `ADMIN` |
| `GET` | `/api/files/{id}` | JWT | owner or `ADMIN` |
| `GET` | `/api/files/{id}/download-url` | JWT | owner or `ADMIN` |
| `DELETE` | `/api/files/{id}` | JWT | `ADMIN` |

*Note: File upload is handled via `POST /api/classifications/upload` (F01), not a standalone files endpoint.*

---

### Schema Surface (this feature)
Uses table: `uploaded_files` — see `Y0-schema.md` §Files.

Key fields:
- `uploaded_files.filename` — S3 object key (UUID-based path)
- `uploaded_files.original_name` — original filename from client upload
- `uploaded_files.content_type` — always `application/pdf` after Tika validation
- `uploaded_files.size` — file size in bytes
- `uploaded_files.path` — S3 object key (same as `filename` in current design)
- `uploaded_files.uploaded_by` — FK to `users.id`

### Integration Dependencies
See `Y3-integrations.md` §Storage for full `StorageService` interface contract and provider configuration.
---

## Y0: Database Schema (Full DDL)

**Database:** PostgreSQL 16 (dev: Docker Compose; prod: PostgreSQL or MySQL)
**Migrations:** Flyway versioned (`V{n}__*.sql`) + repeatable (`R__*.sql`). PostgreSQL-specific SQL from V1.
**Auditing:** All entities extend `AuditableEntity` — `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`, `created_by UUID REFERENCES users(id)`, `last_modified_by UUID REFERENCES users(id)`.
**Soft-delete:** `deleted_at TIMESTAMPTZ DEFAULT NULL`; `@SQLRestriction("deleted_at IS NULL")` on all JPA entities. **Native SQL queries must explicitly add `AND deleted_at IS NULL`.**

---

### §Auth — Users, Roles, Permissions

```sql
-- V1__initial_schema.sql (excerpt)

CREATE TABLE users (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username                    VARCHAR(50)  NOT NULL UNIQUE,
    email                       VARCHAR(255) NOT NULL UNIQUE,
    password_hash               VARCHAR(255) NOT NULL,
    first_name                  VARCHAR(100) NOT NULL,
    last_name                   VARCHAR(100) NOT NULL,
    phone_number                VARCHAR(20),
    is_active                   BOOLEAN      NOT NULL DEFAULT TRUE,
    is_email_verified           BOOLEAN      NOT NULL DEFAULT FALSE,
    email_verification_token    UUID,
    password_reset_token        UUID,
    password_reset_expires_at   TIMESTAMPTZ,
    last_login_at               TIMESTAMPTZ,
    login_attempts              INTEGER      NOT NULL DEFAULT 0,
    locked_until                TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at                  TIMESTAMPTZ
);

CREATE INDEX idx_users_email         ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username      ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_reset_token   ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
CREATE INDEX idx_users_verify_token  ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;

CREATE TABLE roles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE permissions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    resource    VARCHAR(100) NOT NULL,
    action      VARCHAR(50)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
```

---

### §Taxonomy — TaxonomyCategory

```sql
CREATE TABLE taxonomy_categories (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(50)  NOT NULL,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    parent_id     UUID         REFERENCES taxonomy_categories(id) ON DELETE RESTRICT,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    level         INTEGER      NOT NULL DEFAULT 0,
    display_order INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by    UUID         REFERENCES users(id),
    last_modified_by UUID      REFERENCES users(id),
    deleted_at    TIMESTAMPTZ,
    UNIQUE (code, parent_id)  -- code unique within sibling group
);

CREATE INDEX idx_taxonomy_code      ON taxonomy_categories(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_taxonomy_parent    ON taxonomy_categories(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_taxonomy_active    ON taxonomy_categories(is_active) WHERE deleted_at IS NULL;
-- Full-text search column
ALTER TABLE taxonomy_categories ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(code,'') || ' ' || coalesce(name,'') || ' ' || coalesce(description,''))
    ) STORED;
CREATE INDEX idx_taxonomy_fts ON taxonomy_categories USING GIN(search_vector);
```

*Seed data: loaded via `R__seed_taxonomy.sql` (Flyway repeatable; upsert on `code`).*

---

### §Classification — Classifications, UploadedFiles

```sql
CREATE TYPE classification_status AS ENUM (
    'PENDING', 'PROCESSING', 'CLASSIFIED', 'FAILED', 'NEEDS_REVIEW'
);

CREATE TABLE uploaded_files (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    filename      VARCHAR(500) NOT NULL,  -- S3 object key
    original_name VARCHAR(255) NOT NULL,
    content_type  VARCHAR(100) NOT NULL,
    size          BIGINT       NOT NULL,
    path          VARCHAR(500) NOT NULL,  -- S3 object key (same as filename)
    uploaded_by   UUID         NOT NULL REFERENCES users(id),
    uploaded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_files_uploaded_by ON uploaded_files(uploaded_by) WHERE deleted_at IS NULL;

CREATE TABLE classifications (
    id                   UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id              VARCHAR(20)            NOT NULL UNIQUE,  -- RP-YYYY-###
    title                VARCHAR(255),
    status               classification_status  NOT NULL DEFAULT 'PENDING',
    -- Taxonomy fields
    pcc                  VARCHAR(255),
    taxonomy_category    VARCHAR(255),
    taxonomy_code        VARCHAR(100),
    taxonomy_subcode     VARCHAR(100),
    primary_condition    VARCHAR(255),
    secondary_conditions TEXT,
    icd_codes            TEXT,
    -- Extracted content
    project_summary      TEXT,
    population_setting   TEXT,
    intervention         TEXT,
    comparator           TEXT,
    primary_outcome      TEXT,
    secondary_outcomes   TEXT,
    text_preview         VARCHAR(500),          -- truncated extracted text; max 500 chars
    extraction_warning   VARCHAR(255),
    -- Classification metadata
    confidence_score     DECIMAL(5,4),          -- 0.0000 to 1.0000
    model_version        VARCHAR(100),
    processing_time_ms   INTEGER,
    -- File reference
    file_id              UUID                   REFERENCES uploaded_files(id),
    file_name            VARCHAR(255),
    file_size            BIGINT,
    file_path            VARCHAR(500),
    notes                TEXT,
    -- Audit / review
    uploaded_by          UUID                   NOT NULL REFERENCES users(id),
    uploaded_at          TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    classified_at        TIMESTAMPTZ,
    reviewed_by          UUID                   REFERENCES users(id),
    reviewed_at          TIMESTAMPTZ,
    override_reason      TEXT,
    error_message        TEXT,
    -- AuditableEntity base
    created_at           TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    created_by           UUID                   REFERENCES users(id),
    last_modified_by     UUID                   REFERENCES users(id),
    deleted_at           TIMESTAMPTZ
);

CREATE INDEX idx_class_status       ON classifications(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_class_plan_id      ON classifications(plan_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_class_uploaded_by  ON classifications(uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_class_uploaded_at  ON classifications(uploaded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_class_pcc          ON classifications(pcc) WHERE deleted_at IS NULL;
CREATE INDEX idx_class_processing   ON classifications(status, updated_at) WHERE status = 'PROCESSING' AND deleted_at IS NULL;
-- Full-text search on plan_id + title
ALTER TABLE classifications ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(plan_id,'') || ' ' || coalesce(title,''))
    ) STORED;
CREATE INDEX idx_class_fts ON classifications USING GIN(search_vector);
```

---

### §Dashboard — DashboardConfiguration, DashboardMetric

```sql
CREATE TABLE dashboard_configurations (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    layout      JSONB       NOT NULL DEFAULT '{}',
    widgets     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_dash_config_user ON dashboard_configurations(user_id) WHERE deleted_at IS NULL;

CREATE TABLE dashboard_metrics (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(100) NOT NULL,
    value        DECIMAL(15,4) NOT NULL,
    category     VARCHAR(100),
    recorded_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dash_metrics_name_date ON dashboard_metrics(name, recorded_at DESC);
CREATE INDEX idx_dash_metrics_category  ON dashboard_metrics(category, recorded_at DESC);
```

---

### §Reports — ReportConfiguration, ExcelReport, FilterConfiguration

```sql
CREATE TYPE report_status AS ENUM ('GENERATING', 'READY', 'FAILED');

CREATE TABLE report_configurations (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    owner_id    UUID        NOT NULL REFERENCES users(id),
    columns     JSONB       NOT NULL DEFAULT '[]',
    filters     JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ,
    UNIQUE (owner_id, name)  -- template name unique per user
);

CREATE TABLE excel_reports (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_id UUID          REFERENCES report_configurations(id),
    status           report_status NOT NULL DEFAULT 'GENERATING',
    generated_at     TIMESTAMPTZ,
    file_path        VARCHAR(500),  -- S3 key; null until READY
    error_message    TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_excel_reports_config ON excel_reports(configuration_id) WHERE deleted_at IS NULL;

CREATE TABLE filter_configurations (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id),
    name        VARCHAR(100) NOT NULL,
    criteria    JSONB        NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ,
    UNIQUE (user_id, name)
);
```

---

### §Notifications — Notification, NotificationPreference

```sql
CREATE TYPE notification_type AS ENUM (
    'CLASSIFICATION_COMPLETED', 'CLASSIFICATION_FAILED',
    'CLASSIFICATION_NEEDS_REVIEW', 'PIPELINE_FAILURE', 'OVERRIDE_SUBMITTED'
);

CREATE TYPE notification_channel AS ENUM ('IN_APP', 'EMAIL');

CREATE TABLE notifications (
    id          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        notification_type  NOT NULL,
    title       VARCHAR(255)       NOT NULL,
    message     TEXT               NOT NULL,
    is_read     BOOLEAN            NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_user_date   ON notifications(user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE notification_preferences (
    id          UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID                 NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type  notification_type    NOT NULL,
    channel     notification_channel NOT NULL,
    enabled     BOOLEAN              NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, event_type, channel)
);
```

---

### §Help — HelpArticle, FAQ, DocumentationFeedback

```sql
CREATE TABLE help_articles (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title        VARCHAR(255) NOT NULL,
    slug         VARCHAR(100) NOT NULL UNIQUE,
    category     VARCHAR(100) NOT NULL,
    content      TEXT         NOT NULL,  -- Markdown
    published_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by   UUID         REFERENCES users(id),
    last_modified_by UUID     REFERENCES users(id),
    deleted_at   TIMESTAMPTZ
);

ALTER TABLE help_articles ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))
    ) STORED;
CREATE INDEX idx_help_fts  ON help_articles USING GIN(search_vector);
CREATE INDEX idx_help_slug ON help_articles(slug) WHERE deleted_at IS NULL;

CREATE TABLE faqs (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    question      TEXT         NOT NULL,
    answer        TEXT         NOT NULL,
    category      VARCHAR(100) NOT NULL,
    display_order INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by    UUID         REFERENCES users(id),
    deleted_at    TIMESTAMPTZ
);

CREATE TABLE documentation_feedback (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id   UUID        NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    helpful      BOOLEAN     NOT NULL,
    comment      TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (article_id, user_id)  -- one feedback per user per article (upsert)
);
```

---

### §Pipeline — Pipeline Event Log (Optional)

```sql
-- Optional persistence for pipeline run history; managed in-memory otherwise
CREATE TABLE pipeline_runs (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    status           VARCHAR(20) NOT NULL,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ,
    records_processed INTEGER     DEFAULT 0,
    failed_count      INTEGER     DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pipeline_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id      UUID        REFERENCES pipeline_runs(id) ON DELETE CASCADE,
    level       VARCHAR(10) NOT NULL,  -- INFO, WARN, ERROR
    message     VARCHAR(1000) NOT NULL,
    logged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pipeline_logs_run ON pipeline_logs(run_id, logged_at DESC);
```

---

### Entity Summary

| Entity | Table | Soft-Delete | FRD Section |
|---|---|---|---|
| User | `users` | yes | F00, F06 |
| Role | `roles` | yes | F00 |
| Permission | `permissions` | no | F00 |
| UserRole (join) | `user_roles` | no | F00 |
| RolePermission (join) | `role_permissions` | no | F00 |
| TaxonomyCategory | `taxonomy_categories` | yes | F02 |
| UploadedFile | `uploaded_files` | yes | F09 |
| Classification | `classifications` | yes | F01 |
| DashboardConfiguration | `dashboard_configurations` | yes | F03 |
| DashboardMetric | `dashboard_metrics` | no | F03 |
| ReportConfiguration | `report_configurations` | yes | F05 |
| ExcelReport | `excel_reports` | yes | F05 |
| FilterConfiguration | `filter_configurations` | yes | F05 |
| Notification | `notifications` | yes | F07 |
| NotificationPreference | `notification_preferences` | no | F07 |
| HelpArticle | `help_articles` | yes | F08 |
| FAQ | `faqs` | yes | F08 |
| DocumentationFeedback | `documentation_feedback` | no | F08 |
| PipelineRun (optional) | `pipeline_runs` | no | F04 |
| PipelineLog (optional) | `pipeline_logs` | no | F04 |
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
---

## Y2: Cross-Feature Error Catalog

All error responses follow RFC 7807 Problem Details format:
```json
{
  "type": "https://pcori.example.com/errors/{error-code}",
  "title": "Human-readable title",
  "status": 400,
  "detail": "Specific error message",
  "timestamp": "2026-05-20T10:00:00Z",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```
The `errors` array is present for validation errors only (400 with field-level details).

---

### Authentication & Authorization Errors (F00)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `VALIDATION_ERROR` | Validation Failed | See `errors[]` for field-level messages | Fix input |
| `400` | `INVALID_TOKEN` | Invalid Token | Reset/verify token is invalid or expired | No — request new token |
| `400` | `QUERY_TOO_SHORT` | Query Too Short | Search query must be at least 2 characters | Fix input |
| `401` | `TOKEN_MISSING` | Authorization Required | Authorization header is required | Add token |
| `401` | `TOKEN_INVALID` | Invalid Token | Access token signature is invalid | Re-authenticate |
| `401` | `TOKEN_EXPIRED` | Token Expired | Access token has expired | Use refresh token |
| `401` | `INVALID_CREDENTIALS` | Invalid Credentials | Invalid username or password | Check credentials |
| `403` | `ACCOUNT_LOCKED` | Account Locked | Account is temporarily locked | Wait or contact admin |
| `403` | `ACCOUNT_INACTIVE` | Account Inactive | Account has been deactivated | Contact admin |
| `403` | `EMAIL_NOT_VERIFIED` | Email Not Verified | Verify email before logging in | Check email |
| `403` | `ACCESS_DENIED` | Access Denied | Insufficient role or permission | Contact admin |
| `403` | `SELF_DEACTIVATION` | Self-Deactivation Blocked | Cannot deactivate your own account | N/A |
| `409` | `USERNAME_TAKEN` | Username Unavailable | Username is already in use | Choose another |
| `409` | `EMAIL_TAKEN` | Email Registered | Email is already registered | Use existing account |

---

### Classification Errors (F01)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_FILE_TYPE` | Invalid File Type | Only PDF files are accepted | Upload PDF |
| `400` | `INVALID_TAXONOMY_CODE` | Invalid Taxonomy Code | Taxonomy code is not active | Use active code |
| `400` | `INVALID_STATUS` | Invalid Status | Operation not allowed for current status | Check status |
| `413` | `FILE_TOO_LARGE` | File Too Large | File exceeds maximum allowed size | Reduce file size |
| `404` | `NOT_FOUND` | Not Found | Classification {id} not found | Check ID |
| `503` | `STORAGE_UNAVAILABLE` | Storage Unavailable | File storage service is unavailable | Retry |
| — (internal) | — | Pipeline FAILED | Error stored on `Classification.errorMessage`; status set to `FAILED` | Yes — use retry endpoint |

**Classification Status Transitions (informational):**
```
PENDING → PROCESSING → CLASSIFIED  (success, confidence ≥ threshold)
PENDING → PROCESSING → NEEDS_REVIEW (confidence < threshold OR extraction warning)
PENDING → PROCESSING → FAILED       (unrecoverable pipeline error)
FAILED → PENDING                    (via retry endpoint)
*anything* → CLASSIFIED             (via override endpoint)
```

---

### Taxonomy Errors (F02)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_LEVEL` | Invalid Level | Level must be parent level + 1 | Fix input |
| `400` | `INVALID_PARENT` | Invalid Parent | Parent category not found or inactive | Use active parent |
| `400` | `CIRCULAR_REFERENCE` | Circular Reference | Cannot set parent: would create a cycle | Fix hierarchy |
| `400` | `INACTIVE_PARENT` | Inactive Parent | Cannot activate: parent is inactive | Activate parent first |
| `404` | `NOT_FOUND` | Not Found | Taxonomy category {id} not found | Check ID |
| `409` | `CODE_DUPLICATE` | Duplicate Code | Code already exists under this parent | Choose unique code |

---

### Dashboard / Analytics Errors (F03)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_DATE_RANGE` | Invalid Date Range | startDate must be ≤ endDate | Fix dates |
| `400` | `VALIDATION_ERROR` | Validation Failed | Invalid widget layout format | Fix payload |
| `404` | `NOT_FOUND` | Not Found | Dashboard configuration not found | Check ID |

---

### Pipeline Errors (F04)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_STATE` | Invalid State | Action not valid for current pipeline state | Check state first |
| `400` | `INVALID_STAGE_STATE` | Invalid Stage State | Stage is not in FAILED state | Check stage state |
| `404` | `NOT_FOUND` | Not Found | Pipeline run {id} not found | Check ID |
| `409` | `ALREADY_RUNNING` | Already Running | A pipeline run is already active | Wait or stop first |

---

### Reports Errors (F05)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_COLUMN` | Invalid Column | Column '{name}' is not a valid report column | Use valid column |
| `400` | `INVALID_DATE_RANGE` | Invalid Date Range | startDate must be ≤ endDate | Fix dates |
| `404` | `NOT_FOUND` | Not Found | Report/template {id} not found | Check ID |
| `409` | `REPORT_NOT_READY` | Report Not Ready | Report is still generating | Poll until READY |
| `409` | `DUPLICATE_NAME` | Duplicate Name | Template name already exists for this user | Choose another name |
| `500` | `GENERATION_FAILED` | Generation Failed | Report generation failed | Retry |

---

### User Management Errors (F06)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_ROLE` | Invalid Role | Role {id} not found | Use valid role ID |
| `400` | `SELF_DEACTIVATION` | Self-Deactivation | Cannot deactivate your own account | N/A |
| `404` | `NOT_FOUND` | Not Found | User {id} not found | Check ID |
| `409` | `USERNAME_TAKEN` | Username Taken | Username already in use | Choose another |
| `409` | `EMAIL_TAKEN` | Email Taken | Email already registered | Use different email |

---

### Notifications Errors (F07)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `VALIDATION_ERROR` | Validation Failed | Invalid event type or channel | Fix input |
| `403` | `ACCESS_DENIED` | Access Denied | Cannot access another user's notification | N/A |
| `404` | `NOT_FOUND` | Not Found | Notification {id} not found | Check ID |

---

### Help Center Errors (F08)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `QUERY_TOO_SHORT` | Query Too Short | Search query must be ≥ 2 characters | Fix input |
| `404` | `NOT_FOUND` | Not Found | Article '{slug}' not found | Check slug |
| `409` | `DUPLICATE_SLUG` | Duplicate Slug | Article slug already exists | Choose unique slug |

---

### File Management Errors (F09)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_FILE_TYPE` | Invalid File Type | Only PDF files are accepted | Upload PDF |
| `403` | `ACCESS_DENIED` | Access Denied | You do not own this file | N/A |
| `404` | `NOT_FOUND` | Not Found | File {id} not found | Check ID |
| `413` | `FILE_TOO_LARGE` | File Too Large | File exceeds {n}MB limit | Reduce file size |
| `503` | `STORAGE_UNAVAILABLE` | Storage Unavailable | Storage service unavailable | Retry |

---

### Generic / Infrastructure Errors

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `404` | `NOT_FOUND` | Not Found | The requested resource was not found | Check path/ID |
| `405` | `METHOD_NOT_ALLOWED` | Method Not Allowed | HTTP method not supported for this endpoint | Fix method |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Unsupported Media Type | Request content-type not supported | Fix Content-Type |
| `429` | `RATE_LIMITED` | Rate Limited | Too many requests | Back off and retry |
| `500` | `INTERNAL_ERROR` | Internal Server Error | An unexpected error occurred | Retry; contact support |
| `503` | `SERVICE_UNAVAILABLE` | Service Unavailable | Downstream dependency unavailable | Retry with backoff |

---

### Frontend Error Handling Patterns

| Scenario | UI Behavior |
|---|---|
| `401 TOKEN_EXPIRED` | Auto-redirect to `/login` with sonner toast "Session expired" |
| `401 TOKEN_MISSING` or `TOKEN_INVALID` | Redirect to `/login` |
| `403 ACCESS_DENIED` | Show inline error; do not redirect |
| `400 VALIDATION_ERROR` | Inline field-level errors on form; do not toast |
| `404 NOT_FOUND` | Show empty state with CTA |
| `409` conflicts | Toast with specific message |
| `500 / 503` | sonner toast (red) with optional retry action |
| Network error / timeout | sonner toast "Connection error" with retry action |
---

## Y3: External Integration Points

This section specifies the contracts and configuration requirements for all external system dependencies. Each integration is behind an interface; the implementing class is swappable via `@ConditionalOnProperty` or `@Profile` without code changes.

---

### §Storage — StorageService (S3-Compatible Object Storage)

**Interface:** `com.pcori.integration.storage.StorageService`

```java
public interface StorageService {
    String store(byte[] content, String key, String contentType) throws StorageException;
    String getDownloadUrl(String key, int ttlSeconds) throws StorageException;
    void delete(String key) throws StorageException;
    boolean exists(String key);
}
```

**Implementation:** `S3StorageService` (AWS SDK v2)
- Bean activated via `@ConditionalOnProperty(name="storage.provider", havingValue="s3")`.
- `endpointOverride` set from `AWS_ENDPOINT_OVERRIDE` env var (LocalStack/MinIO in dev; absent in prod).

**Configuration (env vars):**

| Env Var | Required | Description |
|---|---|---|
| `AWS_REGION` | Yes | S3 bucket region (e.g., `us-east-1`) |
| `AWS_S3_BUCKET_NAME` | Yes | Target bucket name |
| `AWS_ACCESS_KEY_ID` | Yes (non-EC2) | AWS credentials; use IAM role in prod |
| `AWS_SECRET_ACCESS_KEY` | Yes (non-EC2) | AWS credentials |
| `AWS_ENDPOINT_OVERRIDE` | Dev only | `http://localhost:4566` for LocalStack |
| `PRE_SIGNED_URL_TTL_SECONDS` | No | Default 900 (15 min); max 3600 |
| `MAX_UPLOAD_SIZE_MB` | No | Default 50 MB |

**Object Key Convention:** `pdfs/{yyyy}/{MM}/{uuid}-{sanitizedFilename}.pdf`

**Security Requirements:**
- Bucket must have `BlockPublicAcls`, `BlockPublicPolicy`, `RestrictPublicBuckets` all set to `true`.
- Objects stored with SSE (SSE-S3 minimum; SSE-KMS preferred for PHI-adjacent data).
- Application IAM role needs only: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, `s3:HeadObject` on the target bucket.
- Pre-signed URLs: generated by `S3Presigner`; include `X-Amz-Expires` param equal to TTL.
- Permanent public URLs: **never issued**. Direct object URLs return `403 AccessDenied`.

**Dev / Local:**
- LocalStack (`http://localhost:4566`): started in Docker Compose; bucket auto-created on startup.
- MinIO alternative: same `endpointOverride` pattern; path-style addressing may require `pathStyleAccess=true`.

**Error Mapping:**

| AWS SDK Exception | StorageException type | HTTP Response |
|---|---|---|
| `NoSuchBucketException` | `StorageConfigException` | `503 STORAGE_UNAVAILABLE` |
| `SdkClientException` (network) | `StorageUnavailableException` | `503 STORAGE_UNAVAILABLE` |
| `S3Exception` (4xx on put) | `StorageException` | `503 STORAGE_UNAVAILABLE` |

---

### §Classification — ClassificationStrategy (ML / Keyword)

**Interface:** `com.pcori.integration.classification.ClassificationStrategy`

```java
public interface ClassificationStrategy {
    ClassificationResult classify(String extractedText, List<TaxonomyCategoryDto> taxonomy);
    String getStrategyName();  // e.g., "keyword-v1", "openai-gpt4o"
}
```

**ClassificationResult:**
```java
public record ClassificationResult(
    String pcc,
    String taxonomyCategory,
    String taxonomyCode,
    String taxonomySubcode,
    String projectSummary,
    String populationSetting,
    String intervention,
    String comparator,
    String primaryOutcome,
    String secondaryOutcomes,
    double confidenceScore,   // 0.0 – 1.0
    String modelVersion,
    boolean truncatedInput    // true if text was truncated for context window
) {}
```

**Keyword Strategy (`KeywordClassificationStrategy`):**
- Bean activated via `@ConditionalOnProperty(name="classification.strategy", havingValue="keyword", matchIfMissing=true)`.
- Matches extracted text tokens against taxonomy keyword dictionary.
- `confidenceScore`: deterministic (1.0 for direct match, decreasing with partial/fuzzy match).
- `modelVersion`: `"keyword-v{version}"`.
- No external API call; no HIPAA BAA required.

**ML Strategy (`SpringAiClassificationStrategy`) — Phase 5:**
- Bean activated via `@ConditionalOnProperty(name="classification.strategy", havingValue="ml")`.
- Uses Spring AI `ChatClient` unified API.
- Provider selected via `spring.ai.provider` (values: `openai`, `anthropic`, `bedrock`).
- Structured output: `chatClient.call().entity(ClassificationResult.class)` with native structured output mode (`ENABLE_NATIVE_STRUCTURED_OUTPUT`).
- Pre-processing: strip markdown fences, truncate to `ML_MAX_INPUT_TOKENS` (env var; default 3000 tokens), set `truncatedInput=true` if applied.
- Parse failure fallback: if `ClassificationResult` deserialization fails → fall back to `KeywordClassificationStrategy` (never hard `FAILED`).
- Rate limit retry: `@Retryable(value = RateLimitException.class, maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2))`.

**Configuration (ML Strategy):**

| Env Var | Required | Description |
|---|---|---|
| `CLASSIFICATION_STRATEGY` | No | `keyword` (default) or `ml` |
| `SPRING_AI_PROVIDER` | ML only | `openai`, `anthropic`, `bedrock` |
| `OPENAI_API_KEY` | OpenAI | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic | Anthropic API key |
| `AWS_BEDROCK_REGION` | Bedrock | AWS region for Bedrock |
| `ML_MAX_INPUT_TOKENS` | No | Max tokens to send to model (default 3000) |
| `NEEDS_REVIEW_THRESHOLD` | No | Default 0.75; admin-configurable via settings |

**HIPAA Note:** ML provider must have a signed BAA before processing real research plan PDFs. Bedrock is HIPAA-eligible with BAA. OpenAI and Anthropic BAA status must be verified. Do not use ML strategy with real PHI until BAA is confirmed.

---

### §Email — EmailService (SMTP)

**Interface:** `com.pcori.integration.email.EmailService`

```java
public interface EmailService {
    void sendEmailVerification(String toEmail, String token);
    void sendPasswordReset(String toEmail, String token, String expiryDescription);
    void sendNotification(String toEmail, String subject, String body);
}
```

**Implementation:** `JavaMailSenderEmailService` using Spring's `JavaMailSender`.
- Dev: MailHog at `http://localhost:8025` (SMTP: `localhost:1025`); all emails captured, none delivered.
- Prod: SES / SendGrid / Mailgun (provider TBD — see Open Question #4 in PRD).

**Configuration (env vars):**

| Env Var | Required | Description |
|---|---|---|
| `MAIL_HOST` | Yes | SMTP host (e.g., `smtp.sendgrid.net`) |
| `MAIL_PORT` | No | Default 587 (STARTTLS) |
| `MAIL_USERNAME` | Yes | SMTP username |
| `MAIL_PASSWORD` | Yes | SMTP password / API key |
| `MAIL_FROM_ADDRESS` | Yes | Sender address (e.g., `noreply@pcori.example.com`) |
| `MAIL_FROM_NAME` | No | Display name (e.g., `PCORI Platform`) |

**Email Templates:**
- Email Verification: `verify-email.html` — contains `{verificationLink}`.
- Password Reset: `reset-password.html` — contains `{resetLink}`, `{expiresIn}`.
- Critical Notification: plain text body from `NotificationService`.

**Error Handling:** SMTP failures are logged at WARN level and do not block the primary operation (registration succeeds even if verification email fails to send; notification is created in-app regardless of email delivery).

---

### §Database — Flyway & JPA

**Migration Strategy:**
- Versioned migrations: `V{n}__description.sql` (e.g., `V1__initial_schema.sql`)
- Repeatable migrations: `R__description.sql` (e.g., `R__seed_taxonomy.sql`, `R__seed_roles.sql`)
- All SQL uses PostgreSQL-specific syntax from V1 (no H2 compatibility layer)
- Production: `spring.jpa.hibernate.ddl-auto=validate` (never `create` or `create-drop`)
- Dev: `spring.jpa.hibernate.ddl-auto=validate` (Flyway manages schema; JPA only validates)

**Required Seed Migrations:**
- `R__seed_roles.sql`: seeds `roles` and `permissions`; assigns default role-permission mappings.
- `R__seed_taxonomy.sql`: seeds PCORI/ICD-10 taxonomy categories. **Canonical taxonomy data must be obtained from PCORI before Phase 2.** Architecture supports upsert on `code` for repeatable updates.

**Connection Pool (HikariCP):**

| Property | Value | Notes |
|---|---|---|
| `maximumPoolSize` | 10 (default) | Tune per DB server capacity |
| `minimumIdle` | 5 | Keep connections warm |
| `connectionTimeout` | 30000 ms | Fail fast; don't queue indefinitely |
| `idleTimeout` | 600000 ms | 10 min idle before eviction |
| `maxLifetime` | 1800000 ms | 30 min max connection age |

**PostgreSQL-Specific Features Used:**
- `gen_random_uuid()` — UUID PK generation (no `uuid-ossp` extension needed in PG 14+)
- `TIMESTAMPTZ` — all timestamp columns; timezone-aware
- `JSONB` — widget config, report columns/filters, criteria columns
- `TSVECTOR GENERATED ALWAYS AS STORED` — full-text search columns
- `GIN` indexes on `TSVECTOR` columns
- Partial indexes with `WHERE deleted_at IS NULL`

---

### §Async Execution — classificationExecutor

**Thread Pool Configuration (`AsyncConfig`):**

```java
@Bean("classificationExecutor")
public Executor classificationExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(4);
    executor.setMaxPoolSize(8);
    executor.setQueueCapacity(100);
    executor.setRejectedExecutionHandler(new CallerRunsPolicy());
    executor.setTaskDecorator(new SecurityContextPropagatingDecorator());
    executor.setThreadNamePrefix("classify-");
    executor.initialize();
    return executor;
}
```

**Critical Requirements:**
- `CallerRunsPolicy`: prevents silent task drops under load; calling thread processes the task when queue is full.
- `SecurityContextPropagatingDecorator` (TaskDecorator): propagates `SecurityContextHolder` from HTTP request thread to async executor thread. **Without this, `createdBy`/`lastModifiedBy` audit fields are null on all pipeline-persisted records.**
- Thread count: tune based on PDF extraction throughput and available CPU/memory.

**Configuration (env vars):**

| Env Var | Default | Description |
|---|---|---|
| `CLASSIFICATION_EXECUTOR_CORE_SIZE` | 4 | Core thread pool size |
| `CLASSIFICATION_EXECUTOR_MAX_SIZE` | 8 | Max thread pool size |
| `CLASSIFICATION_EXECUTOR_QUEUE_CAPACITY` | 100 | Task queue depth |
| `STUCK_TIMEOUT_MINUTES` | 15 | Minutes before PROCESSING record is considered stuck |

---

### §PDF Extraction — Apache PDFBox 3.x

**Library:** `org.apache.pdfbox:pdfbox:3.0.7`

**Critical API note:** PDFBox 3.x removed `PDDocument.load()`. Use `Loader.loadPDF()`:
```java
// CORRECT (3.x):
try (PDDocument doc = Loader.loadPDF(pdfBytes)) { ... }

// WRONG (removed in 3.x — will not compile):
PDDocument.load(pdfBytes);
```

**Text Extraction:**
```java
PDFTextStripper stripper = new PDFTextStripper();
String text = stripper.getText(doc);
```

**Text Quality Gate (configurable):**

| Check | Threshold | Env Var |
|---|---|---|
| Minimum character count | 100 | `PDF_MIN_CHAR_COUNT` |
| Printable character ratio | 0.85 | `PDF_MIN_PRINTABLE_RATIO` |
| Non-empty extraction | n/a | — |

Failure: sets `extractionWarning`, routes classification to `NEEDS_REVIEW` status.

**PHI Protection:**
- Full extracted text: never logged (not even DEBUG; TRACE only if absolutely needed).
- Text never stored in database except `textPreview` field (≤500 chars).
- Text passed to `ClassificationStrategy` in memory only; not persisted to any log or external storage.
