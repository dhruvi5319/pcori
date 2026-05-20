# Requirements Traceability Matrix (RTM)
## PCORI Research Analytics Platform

| Field | Value |
|---|---|
| **Product Name** | PCORI Research Analytics Platform |
| **Project Acronym** | PCORI |
| **Document Version** | 1.0 |
| **Document Type** | Requirements Traceability Matrix |
| **Date** | 2026-05-20 |
| **Source PRD** | `project_specs/PRD-PCORI.md` v1.0 |
| **Source FRD** | `project_specs/FRD-PCORI.md` v1.0 |
| **Source TechArch** | `project_specs/TechArch-PCORI.md` v1.0 |
| **Source UserStories** | `project_specs/UserStories-PCORI.md` v1.0 |
| **Status** | Draft |

---

## 1. Overview

This Requirements Traceability Matrix (RTM) provides bidirectional traceability between all PCORI Research Analytics Platform specification documents. It ensures that every business requirement stated in the Product Requirements Document (PRD) is decomposed into a functional specification in the Functional Requirements Document (FRD), addressed by a concrete technical architecture decision in the Technical Architecture document (TechArch), and validated by at least one User Story with defined acceptance criteria.

Traceability flows in both directions. Forward traceability confirms that every PRD feature (F0–F9) is implemented: each feature maps to one or more FRD functional requirements (FR-1.1–FR-10.x), which in turn map to specific TechArch components and database entities, and are exercised by one or more User Stories (US-0.1–US-9.4). Backward traceability confirms that no specification or user story exists without a parent requirement: every TechArch component, FRD requirement, and user story can be traced back to a PRD feature.

This matrix covers all ten features across four delivery phases. Phase 1 (P0 foundation: auth, user management, file storage) must be complete before Phase 2 (core classification pipeline and taxonomy) can operate. Phase 3 adds operational visibility (dashboards, pipeline monitoring) and Phase 4 closes the platform with reports, notifications, and the help center. The RTM is a living document — the Change Management section at the end records all revisions.

---

## 2. Requirements Summary

### 2.1 PRD Feature Summary (F0–F9)

- **F0 — Authentication & Authorization (P0, Phase 1):** JWT stateless auth, BCrypt password hashing, account lockout, password reset, email verification, RBAC via `User → Role → Permission` many-to-many model. Foundation that all other features depend on.
- **F1 — Research Plan Upload & Classification (P0, Phase 2):** Core value proposition. PDF upload → 202 Accepted → three-stage async pipeline (extract/classify/persist) → status polling. Keyword fallback classifier ships first; ML strategy swapped in Phase 5. Manual override with required reason. Retry on failure.
- **F2 — Taxonomy Management (P0, Phase 2):** PCORI/ICD-10 taxonomy CRUD as self-referential JPA tree. Activate/deactivate (no hard delete). Seeded via Flyway repeatable migration. Must exist before classification is meaningful.
- **F3 — Dashboards & Analytics (P1, Phase 3):** KPI cards, recent feed, six analytics charts, date-range filter cascading to all components, per-user widget layout persisted in `DashboardConfiguration`.
- **F4 — Pipeline Monitoring (P1, Phase 3):** Stage-level health cards, control actions (start/stop/pause/resume), event logs, run history, stuck record detection, manual sync.
- **F5 — Reports (P1/P2, Phase 4):** One-click Excel export via Apache POI (`SXSSFWorkbook` streaming for >1,000 rows), async large reports via S3, ad-hoc builder, saved templates, saved filter configurations.
- **F6 — User Management / Admin (P0, Phase 1+4):** Admin CRUD on user accounts, role multi-select assignment, activate/deactivate (no hard delete). Required at launch for reviewer provisioning.
- **F7 — Notifications (P2, Phase 3→4):** In-app notification bell with unread badge, five notification event types, per-user channel preferences (in-app/email), critical-event email alerts.
- **F8 — Help Center (P2, Phase 4):** Markdown article browsing by category, FAQ accordion, keyword article search, "Was this helpful?" feedback widget.
- **F9 — File Management / S3 Storage (P0, Phase 1→2):** `UploadedFile` entity, `StorageService` interface with `S3StorageService` implementation, MIME validation via Apache Tika, pre-signed URLs (15-min TTL), PHI safeguards. Prerequisite to F1.

### 2.2 FRD Requirements Summary

- **FR-1 (F00):** 8 sub-requirements — registration, login/JWT, account lockout, password reset, email verification, logout, JWT filter, RBAC
- **FR-2 (F01):** 8 sub-requirements — PDF upload, text extraction, planId generation, classification fields, status lifecycle, manual override, retry, search/filter/paginate
- **FR-3 (F02):** 5 sub-requirements — taxonomy CRUD, hierarchy/tree, activate/deactivate, search, active list
- **FR-4 (F03):** 6 sub-requirements — status KPI cards, confidence KPI, recent feed, analytics charts, widget config, date-range filter
- **FR-5 (F04):** 5 sub-requirements — status/health view, control actions, stage retry, logs/history, manual sync
- **FR-6 (F05):** 4+ sub-requirements — one-click Excel export, download, saved templates, ad-hoc builder, saved filter configs
- **FR-7 (F06):** 3 sub-requirements — user CRUD/role assignment, status toggle, search/filter
- **FR-8 (F07):** 2 sub-requirements — notification bell/list/mark-read, per-user preferences
- **FR-9 (F08):** 2 sub-requirements — article/FAQ/search browsing, documentation feedback
- **FR-10 (F09):** S3 storage, `UploadedFile` entity, pre-signed URLs, PHI safeguards, provider-agnostic config

### 2.3 TechArch Specification Summary

- **SPEC-AUTH:** `SecurityFilterChain` + `JwtAuthFilter` + `JwtService` + `JwtAuthEntryPoint` + RBAC via `@PreAuthorize` at service layer
- **SPEC-PIPELINE:** `ClassificationPipeline` (@Async) with `classificationExecutor` (`ThreadPoolTaskExecutor`, `CallerRunsPolicy`), `SecurityContextPropagatingDecorator`, three pipeline stages, `PipelineRecovery`
- **SPEC-CLASSIFY:** `ClassificationStrategy` interface, `KeywordStrategy` (default), `SpringAiStrategy` (Phase 5, `@ConditionalOnProperty`)
- **SPEC-STORAGE:** `StorageService` interface, `S3StorageService` (AWS SDK v2), `endpointOverride` for LocalStack/MinIO, pre-signed URLs
- **SPEC-TAXONOMY:** `TaxonomyCategory` self-referential JPA entity, GIN full-text index, Flyway `R__seed_taxonomy.sql`
- **SPEC-ANALYTICS:** `AnalyticsService`, `DashboardService`, `DashboardMetric` pre-aggregation table, `DashboardConfiguration` per-user JSONB
- **SPEC-REPORTS:** `ExcelReportService` (XSSF / `SXSSFWorkbook`), `ReportConfiguration`, `ExcelReport`, `FilterConfiguration`
- **SPEC-PIPELINE-MON:** `PipelineStatusService`, `PipelineController`, `PipelineRun`, `PipelineLog`
- **SPEC-NOTIFY:** `NotificationService`, `Notification`, `NotificationPreference` entities
- **SPEC-HELP:** `HelpService`, `HelpArticle`, `Faq`, `DocumentationFeedback` entities
- **SPEC-DATA:** PostgreSQL 16, Flyway V1 DDL (`AuditableEntity` base, soft-delete on all entities, GIN FTS indexes)
- **SPEC-FRONTEND:** Next.js 16 App Router, RSC shells + TanStack Query islands, Radix UI, Recharts (`isAnimationActive={false}`), react-hook-form + zod

### 2.4 User Story Summary

- **51 total user stories** across 10 epics (US-0.1–US-9.4)
- **29 P0 stories** — MVP blockers (Epics 0, 1, 2, 6, 9)
- **14 P1 stories** — Core differentiators (Epics 3, 4, 5)
- **8 P2 stories** — Valuable additions (Epics 7, 8)

---

## 3. Master Traceability Matrix

This table provides the primary bidirectional link between PRD features, FRD requirements, TechArch specifications, and User Stories.

| PRD Feature | Priority | Phase | FRD Requirement | TechArch Spec | User Story IDs |
|---|---|---|---|---|---|
| **F0: Auth & Authorization** | P0 | 1 | FR-1.1 — User registration | SPEC-AUTH: `AuthController`, `AuthService`, `User` entity, BCrypt | US-0.1 |
| **F0: Auth & Authorization** | P0 | 1 | FR-1.2 — Login / JWT issuance | SPEC-AUTH: `JwtService.generateToken()`, `LoginResponse` | US-0.3 |
| **F0: Auth & Authorization** | P0 | 1 | FR-1.3 — Account lockout | SPEC-AUTH: `loginAttempts`, `lockedUntil` on `users` table | US-0.3 |
| **F0: Auth & Authorization** | P0 | 1 | FR-1.4 — Password reset via email | SPEC-AUTH: `AuthService.forgotPassword()`, `SmtpEmailService` | US-0.5 |
| **F0: Auth & Authorization** | P0 | 1 | FR-1.5 — Email verification | SPEC-AUTH: `emailVerificationToken` on `users`; `GET /api/auth/verify-email` | US-0.2 |
| **F0: Auth & Authorization** | P0 | 1 | FR-1.6 — Logout | SPEC-AUTH: `refresh_tokens` server-side invalidation | US-0.6 |
| **F0: Auth & Authorization** | P0 | 1 | FR-1.7 — JWT validation filter | SPEC-AUTH: `JwtAuthFilter` (`OncePerRequestFilter`), `SecurityContextHolder` | US-0.3, US-0.4 |
| **F0: Auth & Authorization** | P0 | 1 | FR-1.8 — RBAC roles/permissions | SPEC-AUTH: `@PreAuthorize` at service layer, `user_roles`, `role_permissions` tables | US-0.7 |
| **F1: Upload & Classification** | P0 | 2 | FR-2.1 — PDF multipart upload | SPEC-PIPELINE: `ClassificationController.upload()`, `FileValidator` (Apache Tika) | US-1.1 |
| **F1: Upload & Classification** | P0 | 2 | FR-2.2 — PDF text extraction | SPEC-PIPELINE: `PdfExtractionStage` (PDFBox 3.x `Loader.loadPDF()`), text quality gate | US-1.2, US-1.3 |
| **F1: Upload & Classification** | P0 | 2 | FR-2.3 — planId generation | SPEC-PIPELINE: `PlanIdGenerator` (`RP-YYYY-###` atomic counter per year) | US-1.1 |
| **F1: Upload & Classification** | P0 | 2 | FR-2.4 — Classification fields | SPEC-PIPELINE: `Classification` entity (PCC, category, code, subcode, confidence, model version) | US-1.3 |
| **F1: Upload & Classification** | P0 | 2 | FR-2.5 — Status lifecycle | SPEC-PIPELINE: `ClassificationStatus` enum (`PENDING→PROCESSING→CLASSIFIED/FAILED/NEEDS_REVIEW`) | US-1.2 |
| **F1: Upload & Classification** | P0 | 2 | FR-2.6 — Manual override | SPEC-CLASSIFY: `PUT /api/classifications/{id}/override`; `overrideReason` required; `reviewedBy/At` | US-1.4 |
| **F1: Upload & Classification** | P0 | 2 | FR-2.7 — Retry failed | SPEC-PIPELINE: `POST /api/classifications/{id}/retry`; status reset to `PENDING` | US-1.5 |
| **F1: Upload & Classification** | P0 | 2 | FR-2.8 — Search/filter/paginate | SPEC-PIPELINE: `JpaSpecificationExecutor`, `ClassificationSpecification`, URL filter params | US-1.6 |
| **F2: Taxonomy Management** | P0 | 2 | FR-3.1 — Taxonomy CRUD | SPEC-TAXONOMY: `TaxonomyController`, `TaxonomyService`, `TaxonomyCategory` entity | US-2.1, US-2.3 |
| **F2: Taxonomy Management** | P0 | 2 | FR-3.2 — Hierarchy tree | SPEC-TAXONOMY: `GET /api/taxonomy/tree` (nested JSON), `GET /api/taxonomy/{id}/children` | US-2.2 |
| **F2: Taxonomy Management** | P0 | 2 | FR-3.3 — Activate/deactivate | SPEC-TAXONOMY: `PATCH /api/taxonomy/{id}/status`; cascading deactivation; `is_active` boolean | US-2.4 |
| **F2: Taxonomy Management** | P0 | 2 | FR-3.4 — Taxonomy search | SPEC-TAXONOMY: `GET /api/taxonomy/search?q=`; GIN FTS index on `code+name+description` | US-2.5 |
| **F2: Taxonomy Management** | P0 | 2 | FR-3.5 — Active codes list | SPEC-TAXONOMY: `GET /api/taxonomy/active`; used by override dropdowns and keyword classifier | US-2.1, US-2.4 |
| **F3: Dashboards & Analytics** | P1 | 3 | FR-4.1 — Status KPI cards | SPEC-ANALYTICS: `GET /api/dashboard/metrics`; `DashboardService`; `staleTime: 30000` | US-3.1, US-3.6 |
| **F3: Dashboards & Analytics** | P1 | 3 | FR-4.2 — Avg AI Confidence KPI | SPEC-ANALYTICS: `avgConfidence` field in metrics response; labeled "AI Confidence" (not "Accuracy") | US-3.1 |
| **F3: Dashboards & Analytics** | P1 | 3 | FR-4.3 — Recent classifications feed | SPEC-ANALYTICS: `GET /api/classifications/recent?limit=10`; ordered `uploadedAt DESC` | US-3.4 |
| **F3: Dashboards & Analytics** | P1 | 3 | FR-4.4 — Analytics charts | SPEC-ANALYTICS: `AnalyticsService`; 6 chart endpoints; `DashboardMetric` pre-aggregation | US-3.3 |
| **F3: Dashboards & Analytics** | P1 | 3 | FR-4.5 — Widget configuration | SPEC-ANALYTICS: `DashboardConfiguration` entity; `GET/POST/PUT/DELETE /api/dashboard/configuration` | US-3.5 |
| **F3: Dashboards & Analytics** | P1 | 3 | FR-4.6 — Date-range filter | SPEC-ANALYTICS: `startDate`/`endDate` params on all dashboard/analytics endpoints; cascades simultaneously | US-3.2 |
| **F4: Pipeline Monitoring** | P1 | 3 | FR-5.1 — Status/health view | SPEC-PIPELINE-MON: `GET /api/pipeline/status`, `/health`; stuck record detection | US-4.1 |
| **F4: Pipeline Monitoring** | P1 | 3 | FR-5.2 — Control actions | SPEC-PIPELINE-MON: `POST /api/pipeline/{id}/start|stop|pause|resume`; `ADMIN` role required | US-4.2 |
| **F4: Pipeline Monitoring** | P1 | 3 | FR-5.3 — Stage-level retry | SPEC-PIPELINE-MON: `POST /api/pipeline/{id}/stages/{stageId}/retry`; stage must be `FAILED` | US-4.3 |
| **F4: Pipeline Monitoring** | P1 | 3 | FR-5.4 — Logs and run history | SPEC-PIPELINE-MON: `GET /api/pipeline/{id}/logs`, `/history`, `/stats`; `PipelineLog` entity | US-4.4 |
| **F4: Pipeline Monitoring** | P1 | 3 | FR-5.5 — Manual sync | SPEC-PIPELINE-MON: `POST /api/pipeline/sync`; returns `{queued: N}` | US-4.5 |
| **F5: Reports** | P1/P2 | 4 | FR-6.1 — One-click Excel export | SPEC-REPORTS: `ExcelReportService`; XSSF ≤1,000 rows; `SXSSFWorkbook` >1,000 rows | US-5.1 |
| **F5: Reports** | P1/P2 | 4 | FR-6.2 — Report download | SPEC-REPORTS: `Content-Disposition: attachment`; async path via `ExcelReport` entity + S3 pre-signed URL | US-5.2, US-5.6 |
| **F5: Reports** | P1/P2 | 4 | FR-6.3 — Saved report templates | SPEC-REPORTS: `ReportConfiguration` entity; `POST/GET/PUT/DELETE /api/reports/templates` | US-5.4 |
| **F5: Reports** | P1/P2 | 4 | FR-6.4 — Ad-hoc report builder | SPEC-REPORTS: `GET /api/reports/preview` + column/filter params; `GenerateReportRequest` | US-5.3 |
| **F5: Reports** | P1/P2 | 4 | FR-6.5 — Saved filter configurations | SPEC-REPORTS: `FilterConfiguration` entity; `GET/POST/PUT/DELETE /api/filters` | US-5.5 |
| **F6: User Management** | P0 | 1+4 | FR-7.1 — User CRUD / role assignment | SPEC-AUTH: `UserController`, `UserService`; `user_roles` join table; verification email on create | US-6.1, US-6.2, US-6.3 |
| **F6: User Management** | P0 | 1+4 | FR-7.2 — Status toggle (activate/deactivate) | SPEC-AUTH: `PATCH /api/users/{id}/status`; refresh token invalidation on deactivate | US-6.4 |
| **F6: User Management** | P0 | 1+4 | FR-7.3 — Search and filter users | SPEC-AUTH: `GET /api/users/search?q=&role=&status=`; `JpaSpecificationExecutor` | US-6.2 |
| **F7: Notifications** | P2 | 3→4 | FR-8.1 — Notification bell/list/mark-read | SPEC-NOTIFY: `NotificationService`, `Notification` entity; `GET /api/notifications`, `/unread-count`, `PATCH /{id}/read` | US-7.1, US-7.2, US-7.4 |
| **F7: Notifications** | P2 | 3→4 | FR-8.2 — Per-user notification preferences | SPEC-NOTIFY: `NotificationPreference` entity; `GET/PUT /api/notifications/preferences` | US-7.3 |
| **F8: Help Center** | P2 | 4 | FR-9.1 — Articles/FAQ/search | SPEC-HELP: `HelpService`, `HelpArticle`, `Faq` entities; GIN FTS; `GET /api/help/articles/search` | US-8.1, US-8.2, US-8.3 |
| **F8: Help Center** | P2 | 4 | FR-9.2 — Documentation feedback | SPEC-HELP: `DocumentationFeedback` entity; `POST /api/help/feedback`; upsert per user/article | US-8.4 |
| **F9: File Management** | P0 | 1→2 | FR-10.1 — S3 storage / UploadedFile entity | SPEC-STORAGE: `StorageService` interface, `S3StorageService`, `uploaded_files` table | US-9.1, US-9.4 |
| **F9: File Management** | P0 | 1→2 | FR-10.2 — Pre-signed URLs / PHI safeguards | SPEC-STORAGE: `GET /api/files/{id}/download-url`; 15-min TTL; bucket blocks public access; `textPreview` ≤500 chars | US-9.2, US-9.3 |

---

## 4. Requirements Detail

This section expands each PRD feature into its full FRD requirement set, with key technical constraints and acceptance signals.

### F0: Authentication & Authorization

**PRD Reference:** F0 | **FRD Reference:** FR-1 (F00) | **Priority:** P0 | **Phase:** 1 | **Depends on:** none

- **FR-1.1 — Registration:** `POST /api/auth/register`; username unique (3–50 chars, alphanumeric+underscore); email unique (RFC 5322, max 255); password BCrypt strength 12 (8–128 chars, uppercase+lowercase+digit); returns `201 Created`; account starts `isActive=false`, `isEmailVerified=false`; verification email sent immediately
- **FR-1.2 — Login:** `POST /api/auth/login`; validates `isActive`, `lockedUntil`, `isEmailVerified` before BCrypt check; on success: returns HS512 JWT + refresh token + `expiresIn`; resets `loginAttempts`, sets `lastLoginAt`
- **FR-1.3 — Account Lockout:** `loginAttempts >= MAX_LOGIN_ATTEMPTS` (env var, default 5) → sets `lockedUntil = now + LOCKOUT_DURATION_MINUTES` (env var, default 30); `403 ACCOUNT_LOCKED` response with remaining time; admin can unlock via `PATCH /api/users/{id}/status`
- **FR-1.4 — Password Reset:** `POST /api/auth/forgot-password` always returns `200 OK` (prevents email enumeration); single-use `passwordResetToken` (UUID) stored with `passwordResetExpiresAt`; consumed on `POST /api/auth/reset-password`
- **FR-1.5 — Email Verification:** `GET /api/auth/verify-email?token={uuid}`; sets `isEmailVerified=true`, clears token; `400 INVALID_TOKEN` if already used or expired
- **FR-1.6 — Logout:** `POST /api/auth/logout`; marks `RefreshToken.revoked=true` server-side; client clears tokens; subsequent requests use natural JWT expiry
- **FR-1.7 — JWT Filter:** `JwtAuthFilter` (`OncePerRequestFilter`) on every request; validates HS512 signature, expiry, subject maps to active user; populates `SecurityContextHolder`; public routes: `/api/auth/**`, `/actuator/health`
- **FR-1.8 — RBAC:** `@PreAuthorize` enforced at service layer (not controller-only); roles: `REVIEWER`, `MANAGER`, `TAXONOMY_ADMIN`, `ADMIN`, `VIEWER`; `403 ACCESS_DENIED` on insufficient permissions; JWT secret ≥512-bit from env var `JWT_SECRET` — startup `IllegalStateException` if missing

**Key TechArch components:** `SecurityConfig.java`, `JwtAuthFilter.java`, `JwtService.java`, `AuthService.java`, `UserDetailsServiceImpl.java`, `SecurityContextPropagatingDecorator.java`, tables: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `refresh_tokens`

---

### F1: Research Plan Upload & Classification

**PRD Reference:** F1 | **FRD Reference:** FR-2 (F01) | **Priority:** P0 | **Phase:** 2 | **Depends on:** F0, F2, F9

- **FR-2.1 — PDF Upload:** `POST /api/classifications/upload` multipart; Apache Tika byte-level MIME validation (not extension); max `MAX_UPLOAD_SIZE_MB` (env var, default 50 MB); drag-and-drop UI with progress bar; returns `202 Accepted` within 2 s
- **FR-2.2 — Text Extraction:** `PdfExtractionStage` uses PDFBox 3.x `Loader.loadPDF()`; text quality gate: char count ≥100 (configurable), printable ratio ≥0.85, non-empty; gate failure → `NEEDS_REVIEW` + `extractionWarning`; `textPreview` ≤500 chars stored (never full text)
- **FR-2.3 — planId Generation:** `PlanIdGenerator`; format `RP-{4-digit year}-{3-digit zero-padded sequence per year}`; `AtomicInteger` per year prevents duplicates under concurrent load
- **FR-2.4 — Classification Fields:** PCC, taxonomyCategory, taxonomyCode, taxonomySubcode, projectSummary, populationSetting, intervention, comparator, primaryOutcome, secondaryOutcomes, confidenceScore (`DECIMAL(5,4)`), modelVersion, processingTimeMs; displayed as "AI Confidence" (never "Accuracy")
- **FR-2.5 — Status Lifecycle:** `ClassificationStatus` enum: `PENDING → PROCESSING → CLASSIFIED | FAILED | NEEDS_REVIEW`; `NEEDS_REVIEW` triggered by confidence below `NEEDS_REVIEW_THRESHOLD` (admin-configurable, default 0.75, stored in settings — never hardcoded)
- **FR-2.6 — Manual Override:** `PUT /api/classifications/{id}/override`; all four taxonomy dimensions independently editable; `overrideReason` **required** (400 if blank, 1–2000 chars); sets `reviewedBy=currentUser`, `reviewedAt=now`, `status=CLASSIFIED`; taxonomy fields validated against active codes only
- **FR-2.7 — Retry:** `POST /api/classifications/{id}/retry`; only on `status=FAILED` (`400 INVALID_STATUS` otherwise); resets to `PENDING`, clears error fields, returns `202 Accepted`
- **FR-2.8 — Search/Filter/Paginate:** `GET /api/classifications?page=&size=&sort=&status=&startDate=&endDate=&pcc=&q=`; `JpaSpecificationExecutor` dynamic filtering; default page size 25, max 100; default sort `uploadedAt DESC`; filter state preserved in frontend URL params
- **Startup Recovery:** `PipelineRecovery` (`@EventListener(ApplicationReadyEvent.class)`) re-queues `PROCESSING` records stuck beyond `STUCK_TIMEOUT_MINUTES`
- **Async Safety:** `SecurityContextPropagatingDecorator` (`TaskDecorator`) on `classificationExecutor` propagates `SecurityContext` to async threads

**Key TechArch components:** `ClassificationPipeline.java`, `PdfExtractionStage.java`, `ClassificationStage.java`, `PersistResultStage.java`, `PipelineRecovery.java`, `ClassificationStrategy.java`, `KeywordStrategy.java`, `PlanIdGenerator.java`, tables: `classifications`, `uploaded_files`

---

### F2: Taxonomy Management

**PRD Reference:** F2 | **FRD Reference:** FR-3 (F02) | **Priority:** P0 | **Phase:** 2 | **Depends on:** F0

- **FR-3.1 — CRUD:** `POST/GET/PUT/DELETE /api/taxonomy`; `TAXONOMY_ADMIN` role for writes; code unique within sibling group (`409 CODE_DUPLICATE`); `DELETE` behaves as deactivation (never hard-delete); level must equal `parent.level + 1`
- **FR-3.2 — Hierarchy Tree:** `GET /api/taxonomy/tree` returns full nested JSON (root nodes with recursive `children` arrays); ordered by `display_order` within sibling groups; `GET /api/taxonomy/{id}/children` returns flat list of direct children
- **FR-3.3 — Activate/Deactivate:** `PATCH /api/taxonomy/{id}/status`; deactivating parent cascades to all descendants in same transaction; activating requires parent to also be active (`400 INACTIVE_PARENT` otherwise)
- **FR-3.4 — Search:** `GET /api/taxonomy/search?q=&activeOnly=true`; GIN full-text search on `code`, `name`, `description`; returns flat list across all hierarchy levels
- **FR-3.5 — Active Codes:** `GET /api/taxonomy/active`; used by `ClassificationStrategy` initialization and override dropdowns; only `is_active=true` codes targeted for classification
- **Seed Data:** Flyway repeatable migration `R__seed_taxonomy.sql`; upsert on `(code, parent_id)`; re-runs on any content change; must be present before Phase 2 classification is meaningful

**Key TechArch components:** `TaxonomyController.java`, `TaxonomyService.java`, `TaxonomyCategory.java` (self-referential `parent_id`), `TaxonomyRepository.java`, GIN index `idx_taxonomy_fts`, table: `taxonomy_categories`

---

### F3: Dashboards & Analytics

**PRD Reference:** F3 | **FRD Reference:** FR-4 (F03) | **Priority:** P1 | **Phase:** 3 | **Depends on:** F0, F1

- **FR-4.1 — Status KPI Cards:** `GET /api/dashboard/metrics`; returns `{total, classified, processing, pending, failed, needsReview, avgConfidence}`; `staleTime: 30000` on frontend; each card renders with loading skeleton; `AND deleted_at IS NULL` explicit in native SQL
- **FR-4.2 — Avg AI Confidence:** `avgConfidence` field labeled "Avg. AI Confidence" — **never** "Accuracy"; LLM confidence scores are not calibrated probabilities
- **FR-4.3 — Recent Feed:** `GET /api/classifications/recent?limit=10` (max 25); `uploadedAt DESC`; status badges include text label (color never sole indicator — WCAG 2.1 AA)
- **FR-4.4 — Analytics Charts:** Six charts via `/api/analytics/*` endpoints — accuracy trend (line), category accuracy (horizontal bar), confidence distribution histogram (10 buckets, labeled "AI Confidence Distribution"), processing volume (area), recent overrides (paginated table), model performance KPIs (precision/recall/F1; requires `totalEvaluated ≥ 10`); `isAnimationActive={false}` in Recharts production build
- **FR-4.5 — Widget Configuration:** `DashboardConfiguration` entity (`JSONB` layout); one per user; `GET/POST/PUT/DELETE /api/dashboard/configuration`; position/size within 12-column grid
- **FR-4.6 — Date-Range Filter:** Cascades simultaneously to all KPI and chart queries via `startDate`/`endDate` params; TanStack Query `useQuery` hooks invalidated on filter change; default range last 30 days; `400 INVALID_DATE_RANGE` if `startDate > endDate`

**Key TechArch components:** `DashboardController.java`, `DashboardService.java`, `AnalyticsController.java`, `AnalyticsService.java`, `DashboardConfiguration.java`, `DashboardMetric.java`, tables: `dashboard_configurations`, `dashboard_metrics`

---

### F4: Pipeline Monitoring

**PRD Reference:** F4 | **FRD Reference:** FR-5 (F04) | **Priority:** P1 | **Phase:** 3 | **Depends on:** F0, F1

- **FR-5.1 — Status/Health View:** `GET /api/pipeline/status` → `{state, activeRuns, queueDepth, stuckRecordCount}`; `GET /api/pipeline/health` → DB connection pool stats; stuck records = `status=PROCESSING AND updated_at < now - STUCK_TIMEOUT_MINUTES`; frontend polls every 10 s while active
- **FR-5.2 — Control Actions:** `POST /api/pipeline/{id}/start|stop|pause|resume`; `ADMIN` role required (`403` otherwise); `start` returns `202 Accepted` or `409 ALREADY_RUNNING`; `resume` requires `PAUSED` state (`400 INVALID_STATE` otherwise)
- **FR-5.3 — Stage Retry:** `POST /api/pipeline/{id}/stages/{stageId}/retry`; stage must be `FAILED` (`400 INVALID_STAGE_STATE`); resets to `IDLE`, re-queues; returns `202 Accepted`
- **FR-5.4 — Logs / Run History:** `GET /api/pipeline/{id}/logs` (paginated, monospaced); `GET /api/pipeline/{id}/history`; `GET /api/pipeline/stats`; log messages never contain raw extracted text; max message 1000 chars (truncated at 500 if oversized)
- **FR-5.5 — Manual Sync:** `POST /api/pipeline/sync`; picks up `PENDING` records not yet in active run; returns `202 Accepted` with `{queued: N}`

**Key TechArch components:** `PipelineController.java`, `PipelineStatusService.java`, `PipelineRun.java`, `PipelineLog.java`, tables: `pipeline_runs`, `pipeline_logs`

---

### F5: Reports

**PRD Reference:** F5 | **FRD Reference:** FR-6 (F05) | **Priority:** P1 (basic) / P2 (ad-hoc) | **Phase:** 4 | **Depends on:** F0, F1

- **FR-6.1 — One-Click Export:** `POST /api/excel/generate`; auto-selects `XSSFWorkbook` (≤1,000 rows) or `SXSSFWorkbook` (>1,000 rows); queries in chunks of 500 rows; `Content-Disposition: attachment; filename="pcori-report-{timestamp}.xlsx"`; `Content-Disposition` in CORS `exposedHeaders`; `workbook.close()` in `finally` block
- **FR-6.2 — Async Large Reports:** `POST /api/reports` → `202 Accepted`; background job uploads to S3; `ExcelReport.status` transitions `GENERATING → READY | FAILED`; `GET /api/reports/{id}/download` returns pre-signed URL (15-min TTL); `409 REPORT_NOT_READY` if still generating
- **FR-6.3 — Saved Templates:** `ReportConfiguration` entity; `POST /api/reports/templates`; name unique per user (`409 DUPLICATE_NAME`); `POST /api/reports/templates/{id}/run` executes template
- **FR-6.4 — Ad-Hoc Builder:** Column checkboxes (16 available fields), filter builder; `GET /api/reports/preview` returns `{rowCount, sampleRows: [...3 rows]}`; row count >50,000 shows warning (no hard block v1); `400 INVALID_COLUMN` for invalid column names
- **FR-6.5 — Saved Filters:** `FilterConfiguration` entity; `GET/POST/PUT/DELETE /api/filters`; reusable across report builder and classification list filter bar

**Key TechArch components:** `ExcelController.java`, `ExcelReportService.java`, `ReportController.java`, `ReportService.java`, `FilterController.java`, tables: `report_configurations`, `excel_reports`, `filter_configurations`

---

### F6: User Management (Admin)

**PRD Reference:** F6 | **FRD Reference:** FR-7 (F06) | **Priority:** P0 | **Phase:** 1+4 | **Depends on:** F0

- **FR-7.1 — User CRUD / Role Assignment:** `POST /api/users`; username/email unique (`409` on conflict); `roles` array required (at least one valid `Role.id`; `400 INVALID_ROLE` otherwise); verification email sent on create; `DELETE /api/users/{id}` deactivates (never hard-deletes); `PUT /api/users/{id}` updates name/phone/roles (cannot change username/email)
- **FR-7.2 — Status Toggle:** `PATCH /api/users/{id}/status`; deactivation invalidates active refresh tokens; `400 SELF_DEACTIVATION` if admin targets own account; reactivation restores login access immediately
- **FR-7.3 — Search/Filter:** `GET /api/users/search?q=&role=&status=&page=&size=`; `q` matches username, email, full name; default sort `createdAt DESC`; page size 25

**Key TechArch components:** `UserController.java`, `UserService.java`, `User.java`, `Role.java`, tables: `users`, `roles`, `user_roles`

---

### F7: Notifications

**PRD Reference:** F7 | **FRD Reference:** FR-8 (F07) | **Priority:** P2 | **Phase:** 3→4 | **Depends on:** F0, F1

- **FR-8.1 — Notification Bell / List / Mark Read:** `GET /api/notifications` (paginated); `GET /api/notifications/unread-count` → `{count: N}`; frontend polls unread count every 30 s (`staleTime: 30000`); `PATCH /api/notifications/{id}/read`; `POST /api/notifications/read-all`; max 500 notifications per user (oldest deleted on overflow); event types: `CLASSIFICATION_COMPLETED`, `CLASSIFICATION_FAILED`, `CLASSIFICATION_NEEDS_REVIEW`, `PIPELINE_FAILURE`, `OVERRIDE_SUBMITTED`
- **FR-8.2 — Notification Preferences:** `GET/PUT /api/notifications/preferences`; full array replace (not partial); defaults: all event types in-app enabled; email enabled only for `CLASSIFICATION_FAILED` and `PIPELINE_FAILURE`; SMTP silently skipped if not configured

**Key TechArch components:** `NotificationController.java`, `NotificationService.java`, `Notification.java`, `NotificationPreference.java`, tables: `notifications`, `notification_preferences`

---

### F8: Help Center

**PRD Reference:** F8 | **FRD Reference:** FR-9 (F08) | **Priority:** P2 | **Phase:** 4 | **Depends on:** F0

- **FR-9.1 — Articles / FAQs / Search:** `GET /api/help/articles` (list); `GET /api/help/articles/{slug}` (full Markdown content); `GET /api/help/articles/search?q=` (min 2 chars; `400 QUERY_TOO_SHORT` otherwise); GIN FTS on title+content; `GET /api/help/faqs?category=`; Radix UI Accordion for keyboard-accessible FAQ; Markdown sanitized with `rehype-sanitize` before rendering
- **FR-9.2 — Documentation Feedback:** `POST /api/help/feedback`; optional comment (max 1,000 chars); upsert per user/article (`UNIQUE (article_id, user_id)`); admin view: `GET /api/help/articles/{id}/feedback` with `helpfulCount`, `unhelpfulCount`, comments

**Key TechArch components:** `HelpController.java`, `HelpService.java`, `HelpArticle.java`, `Faq.java`, `DocumentationFeedback.java`, GIN index `idx_help_fts`, tables: `help_articles`, `faqs`, `documentation_feedback`

---

### F9: File Management

**PRD Reference:** F9 | **FRD Reference:** FR-10 (F09) | **Priority:** P0 | **Phase:** 1→2 | **Depends on:** F0

- **FR-10.1 — S3 Storage / UploadedFile Entity:** `StorageService` interface with `S3StorageService` implementation (AWS SDK v2); storage key format `pdfs/{year}/{month}/{uuid}-{sanitizedFilename}.pdf`; `UploadedFile` entity tracks: filename (S3 key), originalName, contentType, size, path, uploadedBy, uploadedAt; linked to `Classification.file_id`; `@ConditionalOnProperty("storage.provider")` for LocalStack/MinIO/S3 swap
- **FR-10.2 — Pre-Signed URLs / PHI Safeguards:** `GET /api/files/{id}/download-url`; TTL 15 min (`PRE_SIGNED_URL_TTL_SECONDS=900`, configurable up to 3600); only file owner or `ADMIN` role can request (`403 ACCESS_DENIED` otherwise); S3 bucket: `BlockPublicAcls=true`, `RestrictPublicBuckets=true`, SSE-S3/SSE-KMS encryption; `Classification.textPreview` ≤500 chars (never full extracted text); extracted text never logged at INFO/DEBUG (TRACE only); compliance review required before real PHI processed through ML provider (BAA required)

**Key TechArch components:** `FileController.java`, `FileService.java`, `StorageService.java`, `S3StorageService.java`, `UploadedFile.java`, `FileValidator.java`, table: `uploaded_files`

---

## 5. Test Case Coverage Matrix

This matrix maps each PRD feature and its FRD sub-requirements to the User Stories that serve as the primary acceptance test vehicles. Each User Story's acceptance criteria constitute the test cases.

| PRD Feature | FRD Sub-Req | User Story | Story Title | Key Test Cases (Acceptance Criteria Highlights) | Coverage |
|---|---|---|---|---|---|
| **F0** | FR-1.1 | US-0.1 | User Registration | Duplicate username `409`; duplicate email `409`; password complexity `400`; `201` with sanitized user; verification email sent; account `isActive=false` | ✅ Full |
| **F0** | FR-1.5 | US-0.2 | Email Verification | Valid token → `isEmailVerified=true`; expired/used token `400 INVALID_TOKEN`; single-use enforcement | ✅ Full |
| **F0** | FR-1.2, FR-1.3 | US-0.3 | User Login | `200 OK` + JWT on success; `401` on bad creds; counter increment; `403 ACCOUNT_LOCKED` at threshold; `403 EMAIL_NOT_VERIFIED`; `403 ACCOUNT_INACTIVE` | ✅ Full |
| **F0** | FR-1.7 | US-0.4 | JWT Token Refresh | `POST /api/auth/refresh` → new access token; expired refresh token `401 TOKEN_INVALID` | ✅ Full |
| **F0** | FR-1.4 | US-0.5 | Password Reset | Forgot-password always `200 OK`; token single-use; expiry; complexity validation; reuse `400 INVALID_TOKEN` | ✅ Full |
| **F0** | FR-1.6 | US-0.6 | Logout | Refresh token invalidated server-side; `200 OK`; old JWT expires naturally | ✅ Full |
| **F0** | FR-1.8 | US-0.7 | Role-Based Access Control | `@PreAuthorize` at service layer; `403 ACCESS_DENIED` on insufficient role; role claims in JWT; per-role permission boundaries verified | ✅ Full |
| **F1** | FR-2.1, FR-2.3 | US-1.1 | Upload Research Plan PDF | Non-PDF `400 INVALID_FILE_TYPE`; oversized `413 FILE_TOO_LARGE`; progress bar; `202 Accepted` + planId within 2 s; planId format `RP-YYYY-###` | ✅ Full |
| **F1** | FR-2.2, FR-2.5 | US-1.2 | Monitor Classification Status | Status badges with text labels; polling while `PROCESSING`; polling stops at terminal state; stuck record warning; startup recovery on restart | ✅ Full |
| **F1** | FR-2.4 | US-1.3 | Review AI Classification Results | All classification fields shown; confidence labeled "AI Confidence"; `NEEDS_REVIEW` at threshold; `extractionWarning` shown; PDF download via pre-signed URL | ✅ Full |
| **F1** | FR-2.6 | US-1.4 | Override AI Classification | All four dimensions editable; reason required → `400` if blank; active codes only; `reviewedBy/At` set; confirmation toast | ✅ Full |
| **F1** | FR-2.7 | US-1.5 | Retry Failed Classification | Button only on `FAILED`; `202 Accepted`; non-`FAILED` → `400 INVALID_STATUS`; error cleared on retry | ✅ Full |
| **F1** | FR-2.8 | US-1.6 | Search and Filter Queue | Status/date/PCC filters; keyword search on planId+title; default sort `uploadedAt DESC`; page 25/max 100; filter state preserved on back-navigation | ✅ Full |
| **F2** | FR-3.1 | US-2.1 | Add Taxonomy Category | Duplicate code `409 CODE_DUPLICATE`; level mismatch `400 INVALID_LEVEL`; inactive parent `400 INVALID_PARENT`; `201 Created`; `isActive=true` default | ✅ Full |
| **F2** | FR-3.2 | US-2.2 | Browse Taxonomy Hierarchy | Full tree from `/api/taxonomy/tree`; `displayOrder` sort; right-pane detail; auto-refresh after CRUD; inactive nodes visible but distinguished | ✅ Full |
| **F2** | FR-3.1 | US-2.3 | Edit Taxonomy Category | Pre-populated form; `409` on code conflict; `400 CIRCULAR_REFERENCE` on self-descendant assignment; audit trail updated | ✅ Full |
| **F2** | FR-3.3, FR-3.5 | US-2.4 | Deactivate Taxonomy Code | Cascading deactivation; inactive codes not in override dropdowns; `DELETE` behaves as deactivate; reactivation requires active parent | ✅ Full |
| **F2** | FR-3.4 | US-2.5 | Search the Taxonomy | `GET /api/taxonomy/search?q=`; min 1 char; `activeOnly=true` default; multi-field match; result navigates to tree node | ✅ Full |
| **F3** | FR-4.1, FR-4.2 | US-3.1 | View Dashboard KPI Cards | All 7 KPIs shown; loading skeleton; `staleTime: 30000`; load < 1.5 s; "AI Confidence" label; empty state | ✅ Full |
| **F3** | FR-4.6 | US-3.2 | Filter Dashboard by Date Range | Filter cascades to all KPIs and charts; `startDate > endDate` → error; default last 30 days | ✅ Full |
| **F3** | FR-4.4 | US-3.3 | View Analytics Charts | All 6 charts covered: accuracy trend, category accuracy, confidence distribution, processing volume, overrides table, model performance KPIs; `isAnimationActive={false}`; independent loading | ✅ Full |
| **F3** | FR-4.3 | US-3.4 | View Recent Classifications Feed | Last 10 (max 25); `uploadedAt DESC`; status badge with text; click navigates to detail; updates on date filter change | ✅ Full |
| **F3** | FR-4.5 | US-3.5 | Customize Dashboard Widget Layout | `DashboardConfiguration` per user; 12-column grid; get/create/update/delete; duplicate returns existing | ✅ Full |
| **F3** | FR-4.1, FR-4.2 | US-3.6 | Executive KPI Dashboard View | `VIEWER` role read-only access; load < 1.5 s; no edit/upload controls visible; responsive ≥768 px | ✅ Full |
| **F4** | FR-5.1 | US-4.1 | View Pipeline Status and Health | Status indicator + label; queue depth; DB pool stats; stuck records highlighted; 10-s polling while active | ✅ Full |
| **F4** | FR-5.2 | US-4.2 | Control Pipeline Execution | Start `202`/`409 ALREADY_RUNNING`; stop graceful; pause persisted; resume requires `PAUSED`; `ADMIN` role enforced | ✅ Full |
| **F4** | FR-5.3 | US-4.3 | Retry Failed Pipeline Stage | Button only on `FAILED` stage; `400 INVALID_STAGE_STATE` otherwise; stage resets to `IDLE`; `202 Accepted` | ✅ Full |
| **F4** | FR-5.4 | US-4.4 | View Pipeline Logs and Run History | Paginated log entries; monospaced; no PHI in logs; run history with stats; `GET /api/pipeline/stats`; collapsible panel | ✅ Full |
| **F4** | FR-5.5 | US-4.5 | Trigger Manual Sync | `POST /api/pipeline/sync`; `ADMIN` role; `202 Accepted` + `{queued: N}`; `{queued: 0}` when nothing pending | ✅ Full |
| **F5** | FR-6.1, FR-6.2 | US-5.1 | One-Click Excel Export | `.xlsx` download; `Content-Disposition`; SXSSFWorkbook for >1,000 rows; <10 s for 1,000-row export; `finally` close | ✅ Full |
| **F5** | FR-6.2 | US-5.2 | Download Large Report Async | `202 Accepted` + reportId; poll until `READY`; pre-signed URL 15-min TTL; `409 REPORT_NOT_READY`; `FAILED` state on error | ✅ Full |
| **F5** | FR-6.4 | US-5.3 | Build Ad-Hoc Report | Column checkboxes; filter builder; preview row count + 3 samples; >50,000 row warning; `400 INVALID_COLUMN` | ✅ Full |
| **F5** | FR-6.3 | US-5.4 | Save Report Templates | `ReportConfiguration`; unique name per user `409 DUPLICATE_NAME`; Run/Edit/Delete actions; soft-delete | ✅ Full |
| **F5** | FR-6.5 | US-5.5 | Save Filter Configurations | `FilterConfiguration`; reusable in report builder and classification list; update/soft-delete | ✅ Full |
| **F5** | FR-6.1, FR-6.2 | US-5.6 | Executive Report Download | `VIEWER` role can list and download completed reports; headers and timestamp in filename; traceable to individual records | ✅ Full |
| **F6** | FR-7.1 | US-6.1 | Provision New User Account | Duplicate `409`; invalid role `400 INVALID_ROLE`; `201 Created`; verification email; `isEmailVerified=false` | ✅ Full |
| **F6** | FR-7.1, FR-7.3 | US-6.2 | View and Search Users | Paginated list; `q` search; role filter; status filter; `GET /api/users/active` | ✅ Full |
| **F6** | FR-7.1 | US-6.3 | Edit User Details and Roles | Pre-populated form; role set replacement; username/email immutable; `200 OK`; audit trail | ✅ Full |
| **F6** | FR-7.2 | US-6.4 | Deactivate User Account | Confirmation dialog; refresh tokens invalidated; `403 ACCOUNT_INACTIVE`; historical records intact; `400 SELF_DEACTIVATION`; reactivation restores access | ✅ Full |
| **F7** | FR-8.1 | US-7.1 | Receive In-App Notifications | Bell with badge; 30-s polling; notification list with type/title/message/timestamp; 5 event types; 500-notification cap | ✅ Full |
| **F7** | FR-8.1 | US-7.2 | Mark Notifications as Read | `PATCH /{id}/read`; `POST /read-all`; `403` on other user's notifications; badge disappears when all read | ✅ Full |
| **F7** | FR-8.2 | US-7.3 | Configure Notification Preferences | Toggle grid per event×channel; full replace on PUT; SMTP silently skipped in dev; `400` on invalid enum | ✅ Full |
| **F7** | FR-8.1 | US-7.4 | Receive Critical Event Email Alerts | `CLASSIFICATION_FAILED` → uploader email; `PIPELINE_FAILURE` → all enabled users; email skipped if SMTP not configured | ✅ Full |
| **F8** | FR-9.1 | US-8.1 | Browse Help Articles by Category | Sidebar categories; articles `publishedAt DESC`; Markdown rendered; `rehype-sanitize` XSS prevention | ✅ Full |
| **F8** | FR-9.1 | US-8.2 | Search Help Articles | `GET /api/help/articles/search?q=`; min 2 chars `400 QUERY_TOO_SHORT`; snippet highlighting; "no results" state | ✅ Full |
| **F8** | FR-9.1 | US-8.3 | View FAQ Accordion | `GET /api/help/faqs`; `displayOrder` sort; `category` filter; Radix UI Accordion keyboard accessible | ✅ Full |
| **F8** | FR-9.2 | US-8.4 | Submit Article Feedback | Yes/No widget; optional comment 1,000 chars; upsert per user/article; `201/200`; admin feedback summary | ✅ Full |
| **F9** | FR-10.1 | US-9.1 | Securely Store Uploaded PDF | Tika MIME validation; size check; `pdfs/{year}/{month}/{uuid}` key; `UploadedFile` entity; S3 public access blocked | ✅ Full |
| **F9** | FR-10.2 | US-9.2 | Download PDF via Pre-Signed URL | `GET /api/files/{id}/download-url`; 15-min TTL; owner or `ADMIN` only; `503 STORAGE_UNAVAILABLE` on S3 failure | ✅ Full |
| **F9** | FR-10.2 | US-9.3 | PHI-Safe Storage and Logging | No extracted text in logs above TRACE; `textPreview` ≤500 chars; UUID-based S3 keys; SSE encryption; pre-signed URLs not stored; compliance review before real PHI | ✅ Full |
| **F9** | FR-10.1 | US-9.4 | Local and Cloud Storage Configuration | `@ConditionalOnProperty("storage.provider")`; `AWS_ENDPOINT_OVERRIDE` for LocalStack/MinIO; provider swap without code change; consistent `503` on failure | ✅ Full |

**Coverage Summary:**

| Feature | FRD Sub-Reqs | User Stories | Test Cases (ACs) | Status |
|---|---|---|---|---|
| F0: Auth & Authorization | FR-1.1 – FR-1.8 (8) | US-0.1 – US-0.7 (7) | 38+ acceptance criteria | ✅ 100% |
| F1: Upload & Classification | FR-2.1 – FR-2.8 (8) | US-1.1 – US-1.6 (6) | 32+ acceptance criteria | ✅ 100% |
| F2: Taxonomy Management | FR-3.1 – FR-3.5 (5) | US-2.1 – US-2.5 (5) | 25+ acceptance criteria | ✅ 100% |
| F3: Dashboards & Analytics | FR-4.1 – FR-4.6 (6) | US-3.1 – US-3.6 (6) | 28+ acceptance criteria | ✅ 100% |
| F4: Pipeline Monitoring | FR-5.1 – FR-5.5 (5) | US-4.1 – US-4.5 (5) | 22+ acceptance criteria | ✅ 100% |
| F5: Reports | FR-6.1 – FR-6.5 (5) | US-5.1 – US-5.6 (6) | 26+ acceptance criteria | ✅ 100% |
| F6: User Management | FR-7.1 – FR-7.3 (3) | US-6.1 – US-6.4 (4) | 20+ acceptance criteria | ✅ 100% |
| F7: Notifications | FR-8.1 – FR-8.2 (2) | US-7.1 – US-7.4 (4) | 18+ acceptance criteria | ✅ 100% |
| F8: Help Center | FR-9.1 – FR-9.2 (2) | US-8.1 – US-8.4 (4) | 16+ acceptance criteria | ✅ 100% |
| F9: File Management | FR-10.1 – FR-10.2 (2) | US-9.1 – US-9.4 (4) | 18+ acceptance criteria | ✅ 100% |
| **TOTAL** | **46 sub-requirements** | **51 user stories** | **243+ acceptance criteria** | **✅ 100%** |

---

## 6. Non-Functional Requirements Traceability

Non-functional requirements (NFRs) from the PRD are cross-cutting and traced to architecture decisions rather than individual features.

| NFR Category | PRD Requirement | TechArch Implementation | Verified By |
|---|---|---|---|
| **Security** | JWT secret from env var only (512-bit min); startup failure if missing | `JwtService` reads `JWT_SECRET` env var; `IllegalStateException` on startup if absent | US-0.3, US-0.7 (auth flow) |
| **Security** | BCrypt password hashing | `BCryptPasswordEncoder(strength=12)` in `SecurityConfig` | US-0.1, US-0.3 |
| **Security** | CORS restricted to known origins (no wildcard) | `corsConfigurationSource()` in `SecurityConfig`; Nginx HTTPS termination | US-0.7 |
| **Security** | Swagger UI disabled in production | `springdoc.swagger-ui.enabled=false` in prod profile; `@access("@environment.acceptsProfiles('dev')")` | Deployment config |
| **Performance** | Upload `202` response < 2 s (excl. model latency) | `ClassificationPipeline` @Async returns immediately after S3 upload + DB record creation | US-1.1 |
| **Performance** | Dashboard initial load < 1.5 s | RSC shell + independent `useQuery` per card; `DashboardMetric` pre-aggregation | US-3.1, US-3.6 |
| **Performance** | P95 API < 500 ms (excl. inference) | HikariCP connection pool; `JpaSpecificationExecutor`; GIN FTS indexes | All API stories |
| **Performance** | Excel export < 10 s for 1,000-row export | `SXSSFWorkbook` streaming; chunked 500-row queries | US-5.1 |
| **Scalability** | Stateless backend behind load balancer | JWT stateless (no server-side session); HikariCP pooling | Architecture decision |
| **Scalability** | `SXSSFWorkbook` for >1,000 row exports | `ExcelReportService` auto-selects based on row count | US-5.1, US-5.2 |
| **Reliability** | Startup recovery for stuck `PROCESSING` records | `PipelineRecovery` `@EventListener(ApplicationReadyEvent.class)` | US-1.2 |
| **Reliability** | `CallerRunsPolicy` prevents silent task drops | `classificationExecutor` configured in `AsyncConfig` | US-1.2 |
| **Auditability** | All entities extend `AuditableEntity` | `@MappedSuperclass` with `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, `@LastModifiedBy` | All CRUD stories |
| **Auditability** | Soft-delete everywhere | `deleted_at TIMESTAMPTZ` + `@SQLRestriction("deleted_at IS NULL")` on all entities | US-2.4, US-6.4 |
| **Data Integrity** | `SecurityContextPropagatingDecorator` on async threads | `TaskDecorator` applied to `classificationExecutor` in `AsyncConfig` | US-1.1 |
| **PHI / Compliance** | Extracted text never stored in full; never logged above TRACE | `textPreview` varchar(500); `TRACE` log level gate; never stored in DB beyond preview | US-9.3 |
| **PHI / Compliance** | S3 denies public access; pre-signed URLs only | `BlockPublicAcls=true`, `RestrictPublicBuckets=true`; `generatePresignedUrl()` with TTL | US-9.1, US-9.2 |
| **Accessibility** | WCAG 2.1 AA; status badges include text label | Radix UI primitives; `StatusBadge.tsx` always includes text label alongside color | US-1.2, US-3.4 |
| **Accessibility** | Focus trap on dialogs; keyboard nav | Radix UI `Dialog` + `Accordion` primitives | US-1.4, US-8.3 |
| **Database** | Dev: PostgreSQL 16 via Docker Compose (H2 eliminated) | `docker-compose.yml` includes `postgres:16`; no H2 dependency | Dev environment |
| **Database** | `ddl-auto=validate` in production | `spring.jpa.hibernate.ddl-auto=validate` in prod profile | Prod deployment |
| **Database** | Flyway versioned migrations | `V1__initial_schema.sql`, `V2__seed_roles_permissions.sql`, `R__seed_taxonomy.sql` | All features |
| **Internationalization** | English-only v1; copy externalized | All UI copy in component files; no hardcoded i18n strings | All UI stories |
| **Observability** | `/actuator/health` and `/prometheus` exposed externally; others restricted | `management.endpoints.web.exposure.include=health,prometheus` in prod profile | Deployment config |

---

## 7. Dependency Map

| Feature | Depends On | Reason |
|---|---|---|
| F0: Auth | — | Foundation; no dependencies |
| F9: File Management | F0 | JWT auth required before S3 upload; `uploadedBy` FK to `users` |
| F2: Taxonomy Management | F0 | `TAXONOMY_ADMIN` role enforcement; `createdBy` FK to `users` |
| F1: Upload & Classification | F0, F2, F9 | Auth for upload; taxonomy required for classification targets; S3 for file storage |
| F6: User Management | F0 | `ADMIN` role enforcement; manages `users` table created in Phase 1 |
| F3: Dashboards & Analytics | F0, F1 | Analytics data comes from `classifications` table; auth required |
| F4: Pipeline Monitoring | F0, F1 | Monitors `ClassificationPipeline` (F1); `ADMIN/MANAGER` roles (F0) |
| F5: Reports | F0, F1 | Exports `classifications` data (F1); `MANAGER/VIEWER` roles (F0) |
| F7: Notifications | F0, F1 | Events triggered by pipeline (F1); per-user preferences require auth (F0) |
| F8: Help Center | F0 | Auth required for feedback submission; admin CRUD uses auth |

---

## 8. ID Convention Reference

| ID Prefix | Spec Document | Format | Example |
|---|---|---|---|
| **F** | PRD — Feature | `F{n}` | F0, F1, F9 |
| **FR** | FRD — Functional Requirement | `FR-{n}.{m}` | FR-1.1, FR-2.6, FR-10.2 |
| **SPEC** | TechArch — Component Specification | `SPEC-{SLUG}` | SPEC-AUTH, SPEC-PIPELINE, SPEC-STORAGE |
| **US** | UserStories — User Story | `US-{epic}.{n}` | US-0.1, US-1.4, US-9.3 |
| **TEST** | RTM — Acceptance Criteria (Test Case) | Derived from US-{x}.{y} ACs | US-1.1-AC1, US-1.1-AC2 |

---

## 9. Change Management

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-05-20 | Generated | Initial RTM. All 10 features (F0–F9), 46 FRD sub-requirements, 12 TechArch specs, 51 user stories, 243+ acceptance criteria traced. 100% forward and backward coverage confirmed. |

---

## 10. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | ___________________ | ________ |
| Engineering Lead | | ___________________ | ________ |
| QA Lead | | ___________________ | ________ |
| Taxonomy Administrator | | ___________________ | ________ |
| Security / Compliance | | ___________________ | ________ |

---

*RTM v1.0 — PCORI Research Analytics Platform*
*Generated: 2026-05-20 | Source: PRD-PCORI.md v1.0 · FRD-PCORI.md v1.0 · TechArch-PCORI.md v1.0 · UserStories-PCORI.md v1.0*
