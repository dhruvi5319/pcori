# Product Requirements Document
## PCORI Research Analytics Platform

| Field | Value |
|---|---|
| **Product Name** | PCORI Research Analytics Platform |
| **Project Acronym** | PCORI |
| **Document Version** | 1.0 |
| **Document Type** | Greenfield PRD |
| **Date** | 2026-05-20 |
| **Source** | Derived from `ref_docs/PRD.md` v1.0 + Research SUMMARY.md |

---

## 1. Executive Summary

The PCORI Research Analytics Platform is a secure, full-stack web application that automates the classification of patient-centered medical research plans against the PCORI taxonomy (Primary Clinical Condition, category, code, subcode). It replaces a slow, error-prone manual review process with an AI-assisted workflow — PDF upload, automated classification in minutes, manual override with required reasoning, analytics dashboards, and self-service Excel reporting — all backed by a complete audit trail of every decision.

The platform targets five personas: Research Reviewers, Program Managers, Taxonomy Administrators, System Administrators, and Executive Stakeholders. The v1 system is single-tenant, English-only, and web-only (responsive at ≥768 px), with ML model selection and SSO deferred to v2.

---

## 2. Problem Statement

PCORI reviewers process thousands of research plans annually. Each plan must be classified across multiple taxonomy dimensions before it can be tracked, reported on, or audited. The current process is entirely manual and creates compounding problems:

- **Speed:** Reviewers spend hours per plan reading PDFs and manually assigning taxonomy categories — a bottleneck that delays downstream reporting cycles.
- **Consistency:** Different reviewers produce different labels for similar plans, degrading the reliability of aggregate analytics and longitudinal comparisons.
- **Visibility:** Leadership has no real-time view of classification volume, accuracy trends, or override rates — program health is invisible between reporting cycles.
- **Reporting:** Excel exports are produced by hand each cycle, requiring significant analyst time for what should be a one-click operation.
- **Auditability:** There is no central record of who classified what, when a classification was overridden, or why a human decision differed from an automated one.

---

## 3. Product Vision

**Vision statement:** Become the authoritative system of record for PCORI research plan classification — an AI-assisted platform that compresses reviewer effort from hours to minutes while producing an immutable audit trail and actionable analytics that leadership can trust.

**Strategic goals:**

- Reduce average plan classification turnaround from ~1 hour to ≤ 5 minutes via automated PDF-driven classification
- Maintain an auditable trail of every classification, override, and reviewer action — indefinitely
- Provide leadership dashboards that surface accuracy, confidence distribution, throughput, and override rates in real time
- Centralize the PCORI/ICD-10 taxonomy as a single, versioned source of truth
- Enable self-service report generation (one-click Excel + ad-hoc builder) without analyst intervention
- Deliver a keyword-based classification fallback that ships before ML provider selection, allowing early workflow validation with real users
- Design all ML and storage integrations behind swappable interfaces so provider decisions can be deferred without architectural rework

---

## 4. Target Users & Personas

| Persona | Role | Primary Needs |
|---|---|---|
| **Research Reviewer** | Reads plans, confirms or overrides AI classifications | Fast upload, clear confidence indicators, easy override with required reason |
| **Program Manager** | Oversees a portfolio of research plans | Dashboards, throughput metrics, accuracy trends, one-click Excel reports |
| **Taxonomy Administrator** | Maintains the PCORI/ICD-10 hierarchy | CRUD on categories, hierarchical tree view, activate/deactivate codes |
| **System Administrator** | Manages users and access control | User CRUD, role assignment, account activate/deactivate |
| **Executive / Stakeholder** | Consumes reports and high-level KPIs | Polished Excel exports, high-level status dashboards |

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Backend runtime** | Spring Boot 3.4, Java 21 | Virtual threads (Project Loom) for async pipeline; LTS baseline |
| **Security** | Spring Security 6.4, JWT (jjwt 0.12.x) | Stateless; `OncePerRequestFilter`; `@PreAuthorize` RBAC at service layer |
| **Persistence** | Spring Data JPA, Flyway 10, HikariCP | `JpaSpecificationExecutor` for dynamic filtering; versioned migrations |
| **PDF extraction** | Apache PDFBox 3.0.7 | `Loader.loadPDF()` (3.x API); Java-native, no system deps |
| **Excel generation** | Apache POI XSSF / SXSSFWorkbook | XSSF for normal; SXSSFWorkbook streaming for >1,000-row exports |
| **ML abstraction** | Spring AI 1.1.6 | `ChatClient` unified API (OpenAI / Anthropic / Bedrock); keyword fallback via `@ConditionalOnProperty` |
| **Object storage** | AWS SDK v2 + LocalStack (dev) | `StorageService` interface; `endpointOverride` for MinIO/LocalStack |
| **Email** | JavaMailSender + SMTP relay | MailHog in dev; SES / SendGrid / Mailgun in prod (TBD) |
| **Database (dev)** | PostgreSQL 16 via Docker Compose | H2 eliminated; Flyway dialect gap is a known pitfall |
| **Database (prod)** | PostgreSQL or MySQL | `spring.jpa.hibernate.ddl-auto=validate` in production |
| **Frontend** | Next.js 16 App Router, React 19, TypeScript | RSC shells + `'use client'` TanStack Query islands |
| **Styling** | Tailwind CSS 4 (CSS-first config) | `@import "tailwindcss"` in global CSS; no `tailwind.config.js` |
| **Component primitives** | Radix UI | Dialog, Dropdown, Tabs, Toast, Tooltip — WCAG 2.1 AA for free |
| **Charts** | Recharts | `isAnimationActive={false}` in production to prevent paint jank |
| **Server-state cache** | TanStack Query v5 | Explicit `staleTime` per resource; `staleTime: 0` default avoided |
| **Forms** | react-hook-form + zod | Field-level inline errors; submit disabled until valid |
| **Theming** | next-themes | Light/dark with auto-swapping favicons |
| **Icons / Toasts** | lucide-react / sonner | sonner top-right, rich colors |
| **Containerization** | Docker (backend), Docker Compose (dev stack) | PostgreSQL, MailHog, LocalStack in compose |

### 5.2 Key Architectural Components

- **`SecurityFilterChain` + `JwtAuthFilter`:** JWT extraction/validation on every request; `@PreAuthorize` RBAC enforced at service layer (not controller-only).
- **`ClassificationPipeline` (@Async, 3 stages):** Returns `202 Accepted` immediately; PDF extract → ML/keyword classify → persist; status polled by frontend; startup recovery for stuck `PROCESSING` records mandatory.
- **`integration/` adapters:** `StorageService`, `ClassificationStrategy`, `EmailService` — all behind interfaces, swappable via `@ConditionalOnProperty`.
- **`AuditableEntity` @MappedSuperclass:** JPA auditing base class for all 16+ entities; ensures consistent `createdAt`, `updatedAt`, `createdBy`, `lastModifiedBy` fields.
- **`SecurityContextPropagatingDecorator`:** TaskDecorator applied to `classificationExecutor` thread pool — required to propagate `SecurityContext` to async threads so audit fields are populated correctly.
- **Flyway versioned migrations:** PostgreSQL-specific SQL from V1 (`gen_random_uuid()`, `TIMESTAMPTZ`, partial indexes, GIN indexes, `GENERATED ALWAYS AS STORED`).
- **Next.js `(protected)/layout.tsx`:** Single auth guard for all protected routes; RSC shells with TanStack Query `useQuery`/`useMutation` per resource.

### 5.3 API Surface Overview

~16 controllers, ~80+ endpoints. All under `/api/*`. Stateless JWT via `Authorization: Bearer <token>`.

| Controller | Key Routes |
|---|---|
| `/api/auth` | POST /login, /register, /logout, /refresh; GET /verify-email; POST /forgot-password |
| `/api/users` | CRUD + PATCH /{id}/status, GET /search, /active |
| `/api/dashboard` | GET /metrics, /metrics/range, /configuration; POST/PUT/DELETE /configuration |
| `/api/taxonomy` | GET /, /tree, /{id}, /code/{code}, /{id}/children, /search, /active; POST/PUT/DELETE; PATCH /{id}/status |
| `/api/classifications` | GET /, /{id}, /search, /status/{status}, /statistics, /recent; POST /upload; PUT /{id}/override; POST /{id}/retry; DELETE /{id} |
| `/api/pipeline` | GET /status, /health, /stats, /{id}/stages, /{id}/logs, /{id}/history; POST /{id}/start, /stop, /pause, /resume, /sync; stage-level retry |
| `/api/analytics` | GET /overview, /accuracy-trend, /category-accuracy, /confidence-distribution, /processing-volume, /overrides, /model-performance |
| `/api/excel`, `/api/reports`, `/api/files`, `/api/filters`, `/api/help`, `/api/notifications` | Standard CRUD + domain actions |

---

## 6. Feature Requirements

### F0: Authentication & Authorization
*Maps to FR-1*

**Description:** Secure, stateless JWT authentication with full account lifecycle management. All non-public endpoints require a valid `Authorization: Bearer <jwt>` header. Role-based access control (RBAC) using a User → Role → Permission many-to-many model gates every admin feature. This feature is the foundation that every other feature depends on and has no upstream dependencies.

**Capabilities:**
- User registration with username, email, password (BCrypt), first/last name
- Login returning a signed JWT (1-hour default validity, configurable via env)
- JWT validation on every protected request via `OncePerRequestFilter`
- Logout that clears client-side tokens and invalidates the session
- Account lockout after configurable failed-login threshold; unlock via admin or TTL
- Password reset via email link (reset token with configurable TTL)
- Email verification flow for new accounts (enforced before real user onboarding)
- RBAC: roles ↔ permissions many-to-many; `@PreAuthorize` at service layer (not controller-only)
- JWT secret sourced exclusively from environment variables (startup `IllegalStateException` if missing)

**Priority:** P0 — Critical, blocks all other features

---

### F1: Research Plan Upload & Classification
*Maps to FR-2*

**Description:** The core value proposition of the platform. Reviewers upload a PDF research plan and receive an automated taxonomy classification within minutes. Upload returns `202 Accepted` immediately; a three-stage async pipeline (extract → classify → persist) processes the plan in the background. Status is polled by the frontend. A keyword-based fallback classifier ships for early iterations so the full workflow can be validated before an ML provider is selected.

**Capabilities:**
- PDF-only multipart upload with MIME validation (Apache Tika); drag-and-drop UI with progress bar
- Auto-generated plan ID in `RP-YYYY-###` format
- Three-stage async pipeline: PDF text extraction (PDFBox 3.x `Loader.loadPDF()`) → classification → persist
- Classification record stores: PCC, taxonomy category/code/subcode, project summary, population, intervention, comparator, primary/secondary outcomes, confidence score, model version, processing time (ms), override reason, `uploadedBy`, `reviewedBy`
- Status lifecycle: `PENDING → PROCESSING → CLASSIFIED / FAILED / NEEDS_REVIEW`
- Text quality validation gate: character count, printable ratio, empty extraction → `NEEDS_REVIEW` with `extractionWarning`
- `NEEDS_REVIEW` confidence threshold is admin-configurable (not hardcoded; default 0.75)
- Manual override: all four taxonomy dimensions editable; override reason is required (not optional); `reviewedBy` + `reviewedAt` recorded
- Failed classifications are retryable
- Classifications are paginated, filterable (status, date range, PCC), sortable, and keyword-searchable (plan ID, title)
- Pre-signed S3 download URLs (15-min TTL); no permanent public URLs
- Startup recovery job for `PROCESSING` records stuck beyond configurable timeout
- `SecurityContextPropagatingDecorator` on `classificationExecutor` ensures audit fields are populated in async threads

**Priority:** P0 — Critical, primary value proposition

---

### F2: Taxonomy Management
*Maps to FR-3*

**Description:** Administrators maintain the PCORI/ICD-10 taxonomy as the single source of truth that classification targets. The taxonomy is a self-referential JPA entity tree loaded from a Flyway repeatable migration (`R__seed_taxonomy.sql`). Taxonomy must be seeded before classification can produce meaningful results. Codes are never hard-deleted — activate/deactivate allows deprecation without data loss.

**Capabilities:**
- Full CRUD on PCORI/ICD-10 taxonomy categories (code, name, description, level, display order)
- Parent-child hierarchy modeled as self-referential JPA entity; tree and children endpoints
- Activate/deactivate categories without deletion; soft lifecycle preserves historical classification references
- Search by code, name, or category text
- Full hierarchical tree view endpoint (`GET /api/taxonomy/tree`) consumed by two-pane UI
- Flyway repeatable seed migration (`R__seed_taxonomy.sql`) — updates on change without manual reset

**Priority:** P0 — Must exist before classification pipeline can classify into any code

---

### F3: Dashboards & Analytics
*Maps to FR-4*

**Description:** Provides Program Managers and leadership with real-time visibility into classification volume, accuracy, and reviewer behavior. The dashboard delivers KPI cards and a recent-activity feed that are meaningful from day one. Full analytics charts (accuracy trend, confidence histogram) require override data to accumulate and are initially sparse but grow in utility with usage. All visualizations share a single date-range filter. Per-user widget layout configuration is persisted.

**Capabilities:**
- KPI cards: Total Plans, Classified, Processing, Pending, Failed, Needs Review, Average Confidence
- Recent Classifications feed (last N items, sorted by `uploadedAt`)
- Analytics charts:
  - Accuracy trend line chart (human-validated vs. AI output; requires override history)
  - Category accuracy horizontal bar chart (per PCC/category breakdown)
  - Confidence distribution histogram (display as "AI Confidence" — not "Accuracy")
  - Processing volume area chart (by day)
  - Recent Overrides table (last N overrides with reason, reviewer, classification)
  - Model Performance KPI cards (precision, recall, F1 — meaningful after override data accumulates)
- Date-range filter cascades to all KPI cards and all chart components simultaneously
- `DashboardMetric` time-series pre-aggregation table (avoids N×GROUP BY degradation at scale)
- Per-user dashboard widget configuration persisted as `DashboardConfiguration` entity
- TanStack Query: independent `useQuery` per chart component; explicit `staleTime` per resource type; conditional polling only when `PROCESSING` records exist

**Priority:** P1 — High value; KPI cards ship with MVP; full analytics charts after data accumulates

---

### F4: Pipeline Monitoring
*Maps to FR-5*

**Description:** Provides System Administrators and Program Managers with operational visibility into the classification pipeline. Surfaces stage-level health, stuck records, and run history. Control actions (start/stop/pause/resume) and stage-level retry allow operators to manage the pipeline without direct database access.

**Capabilities:**
- Pipeline status header with colored running/paused/stopped indicator
- Stage cards showing state, last run timestamp, duration, and per-stage retry button
- Health panel: DB connections, queue depth
- Control actions: Start, Stop, Pause, Resume, Sync Now
- Stage-level retry for individual failed stages
- Pipeline event logs (collapsible, monospaced panel)
- Run history view
- Stuck record surfacing: records in `PROCESSING` beyond configurable timeout are highlighted
- `ThreadPoolTaskExecutor` with `CallerRunsPolicy` rejection handler to prevent silent task drops

**Priority:** P1 — Required after pipeline ships (Phase 2); gives operators operational control

---

### F5: Reports
*Maps to FR-6*

**Description:** Enables Program Managers and Executive Stakeholders to generate and download Excel reports from classification data without analyst intervention. A basic one-click export ships first; an ad-hoc builder and saved templates provide power-user reporting after the core export is validated. Large exports (>1,000 rows) use Apache POI SXSSFWorkbook streaming to prevent OOM.

**Capabilities:**
- One-click Excel export (`.xlsx`) of classification data via `Content-Disposition: attachment` header
- `SXSSFWorkbook` streaming export for large datasets (>1,000 rows; tested to 5,000+)
- Saved report templates: named templates with column selection and filter presets
- Ad-hoc report builder: column selector, filter builder (status, date range, PCC), preview, Generate Excel
- `FilterConfiguration` entity for saving reusable filter sets
- `ExcelReport` artifact entity tracking generation status and file path

**Priority:** P1 — Basic Excel export is high-value P0 deliverable; ad-hoc builder is P2

---

### F6: User Management (Admin)
*Maps to FR-7*

**Description:** System Administrators provision, manage, and deactivate user accounts without IT intervention. Role assignment is done through the admin UI, tied to the backend `Role` entity. Accounts are deactivated, not hard-deleted, to preserve audit trail integrity.

**Capabilities:**
- CRUD on user accounts: create, view, edit, deactivate (not hard-delete)
- Role multi-select assignment tied to backend `Role` entity
- Toggle active/inactive status
- Search and filter users (username, email, role, status)
- Admin dialogs: Add User, Edit User, View User, Deactivate User (with confirmation)
- Email verification enforcement before any real user onboarding

**Priority:** P0 — Required at launch for reviewer provisioning

---

### F7: Notifications
*Maps to FR-8*

**Description:** Keeps reviewers and administrators informed of key system events without requiring them to poll the UI manually. An in-app notification bell delivers event messages; per-user preferences control which channels receive which event types. Email notifications are limited to critical events (pipeline failure, classification failure) to avoid noise.

**Capabilities:**
- In-app notification bell with unread count badge
- Notification types: classification completed, classification failed, pipeline failure, override submitted
- Per-user notification preferences: in-app and email channels, configurable per event type
- Notifications marked read individually or all-at-once
- Email notifications for critical events only (pipeline failure, classification failure)
- `Notification` and `NotificationPreference` entities

**Priority:** P2 — Valuable but not blocking; ship after core workflow is validated

---

### F8: Help Center
*Maps to FR-9*

**Description:** Provides in-platform documentation and FAQs so reviewers can self-serve answers without contacting support. Help Center content cannot be authored until the system is built; it ships in Phase 4 after the core workflow is stable. A documentation feedback widget closes the loop on article quality.

**Capabilities:**
- Sidebar navigation by article category
- Article content rendered from Markdown (`HelpArticle` entity with slug-based routing)
- FAQ accordion by category
- "Was this helpful?" feedback widget (`DocumentationFeedback` entity)
- Searchable article index

**Priority:** P2 — Deferred to Phase 4; content authoring depends on stable system

---

### F9: File Management
*Maps to FR-10*

**Description:** All uploaded PDF research plans are tracked in an `UploadedFile` entity and persisted to S3-compatible object storage. The `StorageService` interface abstracts the storage provider so AWS S3, Azure Blob, or MinIO can be swapped via configuration. Pre-signed URLs with a 15-minute TTL are used for all downloads — permanent public URLs are never issued.

**Capabilities:**
- `UploadedFile` entity tracking: filename, original name, content type, size, storage path, `uploadedBy`, `uploadedAt`
- `StorageService` interface with `S3StorageService` implementation (AWS SDK v2)
- `endpointOverride` configuration for LocalStack (dev) and MinIO (self-hosted)
- Pre-signed download URLs with 15-minute TTL
- S3 bucket configured to deny direct public access (403 on direct object URL)
- MIME validation via Apache Tika before storage (PDF-only gate)
- PHI safeguard: extracted PDF text never logged at INFO/DEBUG level; raw text not stored in DB; truncated preview (≤500 chars) only

**Priority:** P0 — Storage must exist before upload works; prerequisite to F1

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | JWT secret via env var only (512-bit minimum; startup failure if missing). BCrypt password hashing. CORS restricted to known production origins (no wildcard). HTTPS in production. Account lockout after configurable failed-login threshold. XSS-resistant token storage. Swagger UI disabled in production profile. |
| **Performance** | Classification `202` response < 2 s for a 10-page PDF (excluding model latency). Dashboard initial load < 1.5 s. P95 API response < 500 ms (excluding model inference). Paginated list default page size 25. Excel report generation < 10 s for 1,000-row export. |
| **Scalability** | Stateless backend horizontally scalable behind a load balancer. HikariCP connection pooling. `SXSSFWorkbook` streaming for large Excel exports (>1,000 rows). `DashboardMetric` pre-aggregation table to avoid N×GROUP BY degradation. |
| **Reliability** | Async pipeline startup recovery: records stuck in `PROCESSING` beyond configurable timeout are re-queued on `ApplicationReadyEvent`. `CallerRunsPolicy` rejection handler on `classificationExecutor` to prevent silent task drops. Failed classifications retryable. |
| **Auditability** | All entities extend `AuditableEntity` @MappedSuperclass (createdAt, updatedAt, createdBy, lastModifiedBy). Every classification stores `uploadedBy`, `reviewedBy`, timestamps, override reason, model version. Soft-delete (`deleted_at`) preferred over hard-delete; classifications retained indefinitely. `@SQLRestriction("deleted_at IS NULL")` on all entities; native SQL analytics queries must add `AND deleted_at IS NULL` explicitly. |
| **Data Integrity** | `SecurityContextPropagatingDecorator` (TaskDecorator) on `classificationExecutor` to propagate `SecurityContext` to async threads — prevents null audit fields on pipeline-persisted records. |
| **PHI / Compliance** | HIPAA-aligned controls required; compliance review before processing real research plan PDFs. ML provider must have a signed BAA before real PHI-adjacent data is processed. Extracted PDF text never stored in full; never logged above TRACE. S3 bucket denies public access; pre-signed URLs only. |
| **Compatibility** | Supported browsers: latest Chrome, Firefox, Edge, Safari. Responsive: ≥1280 px primary, graceful degradation to ≥768 px. Mobile drawer navigation below 768 px. |
| **Accessibility** | WCAG 2.1 AA target. Radix UI primitives for keyboard navigation and ARIA. Status badges include text labels (color is never the sole indicator). All dialogs trap focus and close on Escape. Form labels are explicit (`htmlFor` / `aria-label`). |
| **Observability** | `/actuator/health` endpoint (expose only `health` and `prometheus` externally; restrict others to internal IP or admin role). Structured logs with metric counters for classification throughput. Swagger UI in dev only. |
| **Internationalization** | English-only for v1; copy externalized for future i18n. |
| **Database** | Dev: PostgreSQL 16 via Docker Compose (H2 eliminated — Flyway dialect gap). Prod: PostgreSQL or MySQL. `spring.jpa.hibernate.ddl-auto=validate` in production (never `create-drop`). Flyway versioned migrations with PostgreSQL-specific SQL from V1. |

---

## 8. Success Metrics

| KPI | Target | Notes |
|---|---|---|
| **Avg. classification turnaround** | ≤ 5 min per plan | vs. ~1 hour manual baseline |
| **Auto-classification accuracy** | ≥ 85% agreement with human reviewer | No override needed; requires ground truth from override data |
| **Override rate** | < 15% of classified plans | Override reason is required (not optional) — enables meaningful rate calculation |
| **Average confidence score** | ≥ 0.80 | Displayed as "AI Confidence" — not accuracy; LLM scores are not calibrated probabilities |
| **NEEDS_REVIEW threshold** | Admin-configurable (default 0.75) | Must be empirically tuned after real data accumulates; not hardcoded |
| **System uptime** | ≥ 99.5% during business hours | |
| **P95 API response time** | < 500 ms (excluding model inference) | |
| **Dashboard initial load** | < 1.5 s | |
| **Excel export (1,000 rows)** | < 10 s | `SXSSFWorkbook` streaming required for >1,000 rows |
| **Active reviewers / week** | ≥ 80% of provisioned reviewer accounts | Measures adoption, not just availability |

---

## 9. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| **JWT secret hardcoded in source** | Critical security breach | High (common pitfall) | `JWT_SECRET` from env var only; startup `IllegalStateException` if missing; CI secret scan |
| **PHI exposure via verbose logging** | HIPAA violation | High (common pitfall) | Extracted PDF text never logged above TRACE; structured logging; Swagger UI disabled in prod; S3 denies public access |
| **Async pipeline stuck records** | Classifications permanently stuck on restart | High | Startup recovery job on `ApplicationReadyEvent`; `CallerRunsPolicy` rejection handler |
| **SecurityContext null in async threads** | Corrupt audit trail (null `createdBy` on all pipeline records) | High | `SecurityContextPropagatingDecorator` TaskDecorator on `classificationExecutor` at `AsyncConfig` creation time |
| **AI confidence miscalibration** | Misleading accuracy dashboard; poor `NEEDS_REVIEW` routing | High | Display as "AI Confidence" not "Accuracy"; admin-configurable threshold; never infer accuracy from confidence |
| **LLM structured output deserialization failures** | `FAILED` status on valid plans; poor user experience | Medium-High | Pre-processing (strip markdown fences); native structured output mode; token budget management; fallback to keyword on parse failure |
| **Flyway H2/PostgreSQL dialect gap** | Migration failures; env-parity bugs | High (if H2 used) | Eliminate H2 entirely; Docker Compose PostgreSQL 16 for dev; Testcontainers for CI |
| **`@SQLRestriction` not applied to native SQL** | Soft-deleted records counted in analytics | Medium | All native SQL analytics queries must explicitly add `AND deleted_at IS NULL` |
| **ML provider HIPAA BAA unavailability** | Cannot process real PHI-adjacent PDFs | Medium | Bedrock (HIPAA-eligible with BAA); OpenAI/Anthropic BAA requires verification; decision before Phase 5 |
| **PCORI taxonomy seed data unavailable** | Classification produces meaningless results | Medium | Obtain canonical seed data from PCORI before Phase 2; architecture supports `R__seed_taxonomy.sql` |
| **Confidence threshold wrong at launch** | High override rate or missed NEEDS_REVIEW | Medium | Start conservative (0.75); plan feedback loop: override rate by confidence band → adjust threshold |
| **Excel OOM for large reports** | Server crash on large export | Medium | `SXSSFWorkbook` streaming; OOM test with 5,000-row dataset before launch |

---

## 10. Feature Index

| ID | Feature Name | FR Mapping | Priority | Phase | Depends On |
|---|---|---|---|---|---|
| **F0** | Authentication & Authorization | FR-1 | P0 | Phase 1 | — |
| **F9** | File Management (S3 Storage) | FR-10 | P0 | Phase 1→2 | F0 |
| **F2** | Taxonomy Management | FR-3 | P0 | Phase 2 | F0 |
| **F1** | Research Plan Upload & Classification | FR-2 | P0 | Phase 2 | F0, F2, F9 |
| **F6** | User Management (Admin) | FR-7 | P0 | Phase 1+4 | F0 |
| **F3** | Dashboards & Analytics | FR-4 | P1 | Phase 3 | F0, F1 |
| **F4** | Pipeline Monitoring | FR-5 | P1 | Phase 3 | F0, F1 |
| **F5** | Reports | FR-6 | P1 (basic) / P2 (ad-hoc) | Phase 4 | F0, F1 |
| **F7** | Notifications | FR-8 | P2 | Phase 3→4 | F0, F1 |
| **F8** | Help Center | FR-9 | P2 | Phase 4 | F0 |

### Priority Definitions

| Priority | Definition |
|---|---|
| **P0** | Critical — MVP blocker; system cannot function without it |
| **P1** | High — Core differentiator; ships in first release after MVP core is validated |
| **P2** | Medium — Valuable addition; ships after P1 features are stable |
| **P3** | Low — Nice to have; deferred to v2 or backlog |

---

## 11. Out of Scope (v1)

- Cross-organization data sharing / federated analytics — single-tenant v1 only
- Mobile-native apps — responsive web only (≥768 px graceful degradation)
- Real-time collaborative editing of plans
- Direct integration with external grant management systems
- Custom ML model training UI — model plugged in by engineering
- WebSocket real-time pipeline updates — polling every 5–10 s delivers 95% of UX benefit for v1
- SSO (SAML/OIDC) — email/password JWT sufficient for controlled v1 user base
- Advanced analytics (drift detection, model A/B testing) — requires months of production ML data first
- Bulk batch upload via SFTP
- Multi-tenancy — architectural decision that must be designed in from the start; v2+

---

## 12. Open Questions

| # | Question | Owner | Impact |
|---|---|---|---|
| 1 | Which ML model backs classification? (OpenAI GPT-4o / Anthropic Claude 3.5 / AWS Bedrock) | Engineering + PCORI | Affects HIPAA BAA availability; must be decided before Phase 5 |
| 2 | What is the canonical source for the PCORI taxonomy seed data? | Taxonomy Admin | Must be obtained before Phase 2 classification is meaningful |
| 3 | Will file storage be AWS S3, Azure Blob, or MinIO? | DevOps | Architecture abstracts via `StorageService`; provider affects compliance posture |
| 4 | What is the email service of record? (SES / SendGrid / Mailgun) | DevOps | Needed for password reset and email verification |
| 5 | Is HIPAA compliance required at launch, or can we ship with a non-PHI dataset first? | Compliance | Determines whether ML provider BAA is a launch blocker |
| 6 | Do we need SSO (SAML/OIDC) for v1? | Product | Deferred; email/password JWT is the current assumption |
| 7 | What is the `NEEDS_REVIEW` confidence threshold at launch? | Product + Reviewers | Default 0.75 suggested; must be empirically tuned with real data |

---

## 13. Glossary

| Term | Meaning |
|---|---|
| **PCORI** | Patient-Centered Outcomes Research Institute |
| **PCC** | Primary Clinical Condition (e.g., Type 2 Diabetes, Heart Failure) |
| **Taxonomy Category** | High-level grouping (e.g., Shared Decision Making, Telehealth) |
| **Taxonomy Code / Subcode** | Short codes describing intervention type (e.g., SDM → DigitalTool) |
| **Classification** | A processed research plan with assigned taxonomy fields |
| **Override** | Manual correction of an automated classification by a reviewer |
| **Pipeline** | The end-to-end automated processing flow from upload → classified |
| **ICD-10** | International Classification of Diseases, 10th Revision — used for clinical condition coding |
| **planId** | Auto-generated plan identifier in `RP-YYYY-###` format |
| **NEEDS_REVIEW** | Classification status indicating AI confidence fell below the admin-configurable threshold |
| **BAA** | Business Associate Agreement — required for processing PHI with a third-party ML provider |
| **IDP** | Intelligent Document Processing — the architectural pattern this platform implements |

---

*PRD v1.0 — PCORI Research Analytics Platform*
*Generated: 2026-05-20 | Source: ref_docs/PRD.md v1.0 + Research SUMMARY.md*
