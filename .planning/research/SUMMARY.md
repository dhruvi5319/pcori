# Project Research Summary

**Project:** PCORI Research Analytics Platform
**Domain:** Healthcare Research Analytics — AI-assisted PDF classification, audit trail, dashboards, PCORI taxonomy management
**Researched:** 2026-05-20
**Confidence:** HIGH

---

## Executive Summary

The PCORI Research Analytics Platform is a purpose-built intelligent document processing (IDP) system for a specific, greenfield domain: classifying PCORI-funded research plans against a proprietary four-dimensional taxonomy (Primary Clinical Condition + Category + Code + Subcode) using LLM-powered extraction. No existing commercial tool combines AI classification, healthcare taxonomy management, audit trail, analytics, and Excel reporting in this domain — this system is greenfield by necessity. The right architecture pattern is a layered Spring Boot 3.4 monolith with a pluggable classification strategy (keyword fallback now, ML later), async classification pipeline, JPA-backed audit trail, and a Next.js 16 App Router frontend that uses client-side TanStack Query for all interactive data and Radix UI for accessible component primitives. The pre-selected stack is well-validated with no reason to deviate; the most important early decisions are infrastructure positioning choices (ML provider, storage provider, dev database strategy) that lock in other configuration decisions.

The key insight from feature research is that **the classification pipeline is the irreducible dependency chain**: taxonomy must exist before classification can target it, classification records must exist before dashboards or analytics have anything to display, and override data must accumulate before accuracy analytics are meaningful. This creates a natural phase order — auth → taxonomy + pipeline → insights → admin polish → ML upgrade — that mirrors dependencies rather than arbitrary prioritization. The keyword fallback strategy is critical: it decouples Phase 2 delivery from ML provider selection and allows the core workflow to be validated with real users before committing to an AI provider (OpenAI vs. Bedrock vs. Anthropic).

The most consequential risks are not technical framework choices but operational and security practices: hardcoded JWT secrets, PHI exposure via verbose logging, async pipeline records that get permanently stuck on deployment, and AI confidence scores that are displayed as accuracy metrics without calibration. These pitfalls each have clear prevention patterns that must be built in from day one, not retrofitted. The platform handles research plan PDFs that may contain PHI — HIPAA-aligned controls (encrypted S3, structured logging, no raw text storage) and compliance review of the ML provider data processing agreement are non-negotiable before real data is processed.

---

## Key Findings

### Recommended Stack

The pre-selected Spring Boot 3.4 + Java 21 + Next.js 16 stack is validated and sound. Java 21 virtual threads (Project Loom) provide concurrency for the async classification pipeline without reactive complexity. Spring AI 1.1.6 is the correct abstraction for ML integration — its `ChatClient` interface enables OpenAI, Anthropic, and AWS Bedrock to be swapped via configuration with no code change, which is critical given that ML provider selection may follow v1 launch. Apache PDFBox 3.0.7 handles PDF extraction (note: PDFBox 3.x has a breaking API change from 2.x — use `Loader.loadPDF()` not `PDDocument.load()`). Apache POI XSSF generates Excel reports, and for exports exceeding 1,000 rows, `SXSSFWorkbook` (streaming variant) must be used to prevent OOM. On the frontend, TanStack Query v5 is the right addition to manage server state with appropriate `staleTime` per resource — the default `staleTime: 0` will cause excessive API polling that degrades performance and perceived quality.

**Core technologies:**
- **Spring Boot 3.4 + Java 21:** Application runtime — virtual threads, records, pattern matching; LTS baseline
- **Spring Security 6.4:** JWT `OncePerRequestFilter` + `@PreAuthorize` RBAC — stateless auth at every layer
- **Spring Data JPA + Flyway 10:** Schema versioning + typed repositories with `JpaSpecificationExecutor` for dynamic filtering
- **Spring AI 1.1.6:** ML abstraction — `ChatClient` unified API across OpenAI, Anthropic, Bedrock; pluggable via `@ConditionalOnProperty`
- **Apache PDFBox 3.0.7:** PDF text extraction — Java-native, no system deps; quality validation gate required before ML invocation
- **Apache POI XSSF / SXSSFWorkbook:** Excel generation — XSSF for normal, SXSSFWorkbook for large streaming exports
- **AWS SDK v2 S3 + LocalStack dev:** Object storage — provider-agnostic via `StorageService` interface; `endpointOverride` for MinIO/LocalStack
- **Next.js 16 App Router + React 19:** RSC for layout/routing; `'use client'` islands for interactive data
- **TanStack Query v5:** Client-side server-state — cache, polling, mutation invalidation; set `staleTime` per resource
- **Radix UI + Tailwind CSS 4:** Accessible primitives (WCAG 2.1 AA) + CSS-first utility styling (no `tailwind.config.js` in v4)
- **PostgreSQL 16 (prod) + Docker Compose (dev):** Eliminate H2 entirely in dev — Flyway dialect gap between H2 and PostgreSQL makes H2 a liability for a schema with partial indexes, `TIMESTAMPTZ`, and `GENERATED ALWAYS AS STORED` columns

### Expected Features

The feature dependency chain is clear: authentication gates everything, taxonomy must precede classification, classification records unlock all downstream features (dashboards, analytics, reports, overrides, notifications), and override data must accumulate before accuracy analytics are meaningful.

**Must have (table stakes — P1 for launch):**
- **Authentication + RBAC (FR-1):** JWT, BCrypt, account lockout, password reset — non-negotiable for healthcare-adjacent system
- **PDF Upload + Text Extraction (FR-2.1–2.2):** Core input; drag-and-drop, MIME validation (Apache Tika), progress indication
- **Automated Classification with keyword fallback (FR-2.3–2.5):** Primary value proposition; keyword fallback allows shipping before ML selection
- **Manual Override + Audit Trail (FR-2.6):** All four taxonomy dimensions editable; override reason required (not optional); `uploadedBy`, `reviewedBy`, `modelVersion` persisted
- **Classification List: search/filter/paginate (FR-2.8):** Day-to-day UI for reviewers; filter by status, date, PCC; `RP-YYYY-###` plan IDs
- **Taxonomy CRUD + Hierarchical Tree View (FR-3):** Must exist before classification; self-referential JPA entity; activate/deactivate (not hard delete)
- **Dashboard KPIs + Recent Activity Feed (FR-4.1–4.3):** Status count cards; recent N classifications; meaningful from day one
- **Basic Excel Export (FR-6.1–6.2):** Single-click `.xlsx` download; immediate reporting win for program managers
- **User Management Admin UI (FR-7):** Provision reviewers without IT intervention; role assignment
- **File Management + S3 (FR-10):** S3 storage via `StorageService` interface; pre-signed URLs with 15-min TTL; never permanent public URLs

**Should have (differentiators — P2, add after core validated):**
- **Full Analytics Suite (FR-4.4):** Accuracy trend, confidence histogram, override rate charts, category-level breakdown — meaningful after ~100 classified plans accumulate
- **Pipeline Monitoring UI (FR-5):** Stage-level visibility, start/stop/pause/resume, stuck-record detection — requires pipeline to exist first (Phase 2)
- **In-App Notifications (FR-8):** Notification bell + per-user preferences; email only for critical events
- **Ad-hoc Report Builder + Saved Templates (FR-6.3–6.4):** Power-user reporting after basic export validates the core need
- **Per-User Dashboard Widget Configuration:** Persisted layout per user per persona
- **Help Center (FR-9):** Searchable articles — cannot be written until the system is built; defer to Phase 4

**Defer to v2+:**
- SSO / SAML / OIDC — JWT sufficient for controlled v1 user base
- WebSocket real-time pipeline updates — polling every 5–10 seconds delivers 95% of UX benefit
- SFTP batch upload — web batch upload covers v1 volume
- Multi-tenancy — architectural decision that must be designed in, not retrofitted
- Drift detection / model A/B testing — requires months of production ML data first

**Key domain-specific feature notes:**
- The confidence threshold for `NEEDS_REVIEW` routing must be admin-configurable, not hardcoded — LLMs are miscalibrated; empirical tuning is required after real data accumulates
- Override rate (<15% per PRD target) is only meaningful if override reason is required (not optional) and surfaced prominently in analytics
- Accuracy trend charts require ground truth (human-validated) vs. AI output — they are meaningless before overrides accumulate; can ship with placeholder UI

### Architecture Approach

The architecture follows a strict layered monolith: Spring Boot backend with Controller → Service → Repository layers, `integration/` packages behind interfaces for all external concerns (S3, ML, SMTP), and a Next.js 16 frontend that renders RSC shells with `'use client'` TanStack Query islands for interactive data. The most architecturally significant component is the async classification pipeline: upload returns `202 Accepted` immediately, and a `ThreadPoolTaskExecutor` runs three stages (PDF extract → ML classify → persist). SecurityContext must be propagated to async threads via `TaskDecorator`, or audit fields will be null on all pipeline-persisted records. All entities extend a `@MappedSuperclass` `AuditableEntity` — without this, 16+ entities will have inconsistent audit fields. The `StorageService` and `ClassificationStrategy` interfaces are the two most important abstraction boundaries — they allow the ML provider and storage provider to be swapped via configuration.

**Major architectural components:**
1. **`SecurityFilterChain` + `JwtAuthFilter`:** JWT extraction/validation on every request; `@PreAuthorize` RBAC at both controller and service layer (not controller-only)
2. **`ClassificationPipeline` (@Async, 3 stages):** Returns `202` immediately; PDF extract → ML/keyword classify → persist; status polled by frontend; startup recovery for stuck `PROCESSING` records is mandatory
3. **`integration/` adapters:** `StorageService` (S3/MinIO), `ClassificationStrategy` (SpringAI/Keyword), `EmailService` (JavaMailSender) — all behind interfaces, all swappable via `@ConditionalOnProperty` or `@Profile`
4. **JPA Auditing + Soft Delete:** `AuditableEntity` `@MappedSuperclass` + `@SQLRestriction("deleted_at IS NULL")` — note: `@SQLRestriction` does NOT apply to `nativeQuery = true` queries; all native SQL analytics queries must add `AND deleted_at IS NULL` explicitly
5. **Next.js `(protected)/layout.tsx` route group:** Single auth guard for all protected routes; RSC shells + TanStack Query `useQuery`/`useMutation` hooks per resource with explicit `staleTime`; single Axios instance with JWT interceptor in `lib/api.ts`
6. **Flyway versioned migrations:** `V1__initial_schema.sql` with partial indexes (`WHERE deleted_at IS NULL`), full-text search via `tsvector` generated column, `TIMESTAMPTZ` throughout — these are PostgreSQL-specific and incompatible with H2

### Critical Pitfalls

1. **JWT secret hardcoded in source** — `JWT_SECRET` must come from environment variable only; 512-bit minimum length; startup `IllegalStateException` if missing. This is a security prerequisite that blocks everything else. *(PITFALLS.md §5)*

2. **PHI exposure via verbose logging** — Extracted PDF text must never be logged at INFO/DEBUG level; truncated preview (≤500 chars) only in DB; Swagger UI disabled in production; S3 bucket must deny public access and require pre-signed URLs. Research plan PDFs may contain PHI; compliance review required before real data is processed. *(PITFALLS.md §9)*

3. **Async pipeline stuck records** — `@Async` is ephemeral; server restarts during classification leave `PROCESSING` records permanently stuck. Mandatory: startup recovery job via `@EventListener(ApplicationReadyEvent.class)` that re-queues records stuck in `PROCESSING` beyond a configurable timeout. `ThreadPoolTaskExecutor` must also have a `CallerRunsPolicy` rejection handler to prevent silent task drops under load. *(PITFALLS.md §4)*

4. **SecurityContext null in async threads = corrupt audit trail** — `SecurityContextHolder` is thread-local; the `classificationExecutor` async thread does not inherit it. A `SecurityContextPropagatingDecorator` (TaskDecorator) must be applied to the thread pool at `AsyncConfig` creation time. Without this, `lastModifiedBy` and `createdBy` are null on every pipeline-persisted record. *(PITFALLS.md §8)*

5. **AI confidence miscalibration** — LLM self-reported confidence scores are not calibrated probabilities. Display as "AI Confidence" (not "Accuracy"), set a conservative `NEEDS_REVIEW` threshold (≥0.75 default), make the threshold admin-configurable in settings. Never infer accuracy from confidence — accuracy requires human ground truth. *(PITFALLS.md §1)*

6. **LLM structured output deserialization failures** — Spring AI's `entity()` structured output is best-effort; real PDFs cause malformed JSON (markdown fences, trailing commas, truncated responses at token limits). Must implement: pre-processing to strip markdown fences, native structured output mode (`ENABLE_NATIVE_STRUCTURED_OUTPUT`), token budget management (truncate extracted text before sending), and fallback to keyword strategy on parse failure rather than hard FAILED status. *(PITFALLS.md §2)*

7. **Flyway H2/PostgreSQL dialect gap** — PostgreSQL-specific SQL (`gen_random_uuid()`, `TIMESTAMPTZ`, partial indexes, `GIN` indexes, `GENERATED ALWAYS AS STORED`) fails in H2. **Recommended resolution: eliminate H2 entirely.** Use Docker Compose with `postgres:16-alpine` for dev. Use Testcontainers for CI integration tests. This eliminates an entire class of environment-parity bugs. *(PITFALLS.md §11)*

8. **`@SQLRestriction` not applied to native SQL** — Hibernate's `@SQLRestriction("deleted_at IS NULL")` is only respected by JPQL; native SQL queries (`nativeQuery = true`) ignore it and count soft-deleted records. All analytics aggregation queries must explicitly include `AND deleted_at IS NULL`. *(PITFALLS.md §7)*

---

## Implications for Roadmap

Based on the combined research, the natural phase structure follows the feature dependency chain and surfaces security/infrastructure decisions at the earliest possible phase. Six phases are suggested.

---

### Phase 1: Foundation — Auth, Security, Dev Infrastructure

**Rationale:** Authentication gates every other feature. JWT secret management, RBAC model, and dev environment setup are decisions that cannot be changed without cascading effects. The dev database strategy (Docker Compose PostgreSQL, not H2) must be settled before the first migration is written. This phase has no upstream dependencies and blocks everything else.

**Delivers:**
- JWT authentication with BCrypt, account lockout, password reset via email
- Full RBAC model: User, Role, Permission entities; `@PreAuthorize` at service layer; security integration tests for all 5 roles
- `JwtAuthFilter` with `FilterRegistrationBean` (prevent double-registration)
- Docker Compose dev environment: PostgreSQL 16, MailHog (SMTP trap), LocalStack (S3)
- Flyway `V1__initial_schema.sql` — User, Role, Permission tables (PostgreSQL-specific SQL from day one)
- `AuditableEntity` `@MappedSuperclass` configured with JPA auditing
- Global exception handler returning RFC 7807 problem responses
- Actuator health endpoint (`/actuator/health`) + basic observability wiring
- OpenAPI / Swagger UI (dev only — disabled in production profile)

**Addresses:** FR-1 (auth), FR-7 foundation (user entity)
**Must avoid:** JWT secret in source code (env var from day one), RBAC at controller-only (service layer too), H2 in dev (PostgreSQL Docker Compose instead)
**Research flag:** STANDARD PATTERNS — Spring Security JWT filter chain and RBAC patterns are well-documented and verified. No additional research needed.

---

### Phase 2: Classification Pipeline — Taxonomy, Upload, Async Pipeline, Storage

**Rationale:** The classification pipeline is the platform's irreducible value proposition. Taxonomy must be seeded before classification can target it. S3 storage must exist before files can be uploaded. The keyword fallback strategy means this phase ships a working end-to-end classification flow WITHOUT requiring an ML provider decision. This is the most complex phase — it must be done before Phase 3 has any meaningful data to display.

**Delivers:**
- `TaxonomyCategory` entity: self-referential JPA tree, CRUD endpoints, tree view endpoint, activate/deactivate (soft), search
- Flyway seed migration `R__seed_taxonomy.sql` (repeatable — updates on change)
- `StorageService` interface + `S3StorageService` (AWS SDK v2) + LocalStack dev config
- Apache Tika MIME validation (PDF-only gate)
- PDF upload endpoint (`POST /api/classifications/upload`) — `202 Accepted`, `RP-YYYY-###` plan ID generation
- `ClassificationPipeline` (`@Async`): PDF extract (PDFBox 3.x `Loader.loadPDF()`) → keyword classify → persist
- `SecurityContextPropagatingDecorator` on `classificationExecutor` — audit trail integrity
- `ThreadPoolTaskExecutor` with `CallerRunsPolicy` rejection handler
- Startup recovery job for stuck `PROCESSING` records
- Classification status lifecycle: `PENDING → PROCESSING(EXTRACTING → CLASSIFYING) → CLASSIFIED / FAILED / NEEDS_REVIEW`
- Manual override endpoint with required reason capture; all four taxonomy dimensions editable
- Classification list: paginated, filterable (status, date range, PCC), sortable, searchable (plan ID, title)
- Pre-signed S3 download URLs (15-min TTL)
- Text quality validation gate: character count, printable ratio, empty extraction → `NEEDS_REVIEW` with `extractionWarning`

**Addresses:** FR-2 (complete), FR-3 (taxonomy), FR-10 (file management)
**Must avoid:** Synchronous ML call on request thread, `PDDocument.load()` (removed in PDFBox 3.x), raw extracted text in logs, permanent S3 public URLs, missing startup recovery job
**Research flag:** NEEDS PHASE RESEARCH — PDFBox 3.x extraction patterns for PCORI-style multi-section PDFs, Spring AI structured output native mode configuration, and token budget management strategies merit deeper research before this phase is planned in detail.

---

### Phase 3: Insights — Dashboard, Analytics, Pipeline Monitoring, Notifications

**Rationale:** Phase 3 is the first phase that requires classified data to be meaningful. Building it before Phase 2 delivers working classifications means building against empty or stub data — acceptable for UI scaffolding but analytics charts should only ship when real data exists. Pipeline monitoring UI (FR-5) requires the pipeline from Phase 2 as its subject. In-app notifications require user and classification event entities from Phase 2.

**Delivers:**
- Dashboard KPI cards (total, classified, processing, failed, needs-review counts) with date-range filter cascading to all components simultaneously
- Recent classifications feed (last N, sorted by `uploadedAt`)
- Analytics charts: accuracy trend (requires override ground truth), confidence histogram, processing volume area chart, override rate table, category-level accuracy breakdown
- `NEEDS_REVIEW` threshold: admin-configurable, not hardcoded; surface in Settings
- Pipeline monitoring: stage health, start/stop/pause/resume, stuck-record surfacing, pipeline event log
- In-app notification bell + per-user email preferences; email only for critical events (pipeline failure, classification failure)
- `DashboardMetric` time-series pre-aggregation table (avoids N×GROUP BY degradation at scale)
- Per-user dashboard widget configuration (`DashboardConfiguration` entity)
- TanStack Query performance architecture: independent `useQuery` per chart component, `isAnimationActive={false}` on Recharts, conditional polling only when `PROCESSING` records exist, `staleTime` set per resource type

**Addresses:** FR-4 (analytics + dashboard), FR-5 (pipeline monitoring), FR-8 (notifications)
**Must avoid:** Single monolithic client component mixing charts + table (separate into independent query components), `staleTime: 0` default (set explicitly per resource), Recharts animations enabled (disable in production), date range filter applying to charts only (must cascade to KPI cards)
**Research flag:** STANDARD PATTERNS — Recharts performance patterns and TanStack Query caching strategies are well-documented. Analytics aggregation queries for accuracy trend are domain-specific but straightforward once classification data model is established.

---

### Phase 4: Reporting and Admin Polish — Excel Reports, Help Center, User Management, Settings

**Rationale:** Excel reporting and the ad-hoc report builder are high-value additions once the core workflow is validated. Help Center content cannot be authored until the system is actually built. User management polish (edit, deactivate, search) belongs here. This phase adds completeness and power-user features that don't block the core workflow.

**Delivers:**
- Basic Excel export (FR-6.1–6.2): one-click `.xlsx` download via Apache POI XSSF; `Content-Disposition: attachment` header
- `SXSSFWorkbook` streaming export for large datasets (>1,000 rows, tested to 5,000+)
- Saved report templates (FR-6.3): named templates with column selection and filter presets
- Ad-hoc report builder (FR-6.4): column selector, filter builder, preview, generate; bounded to available classification fields
- Help Center (FR-9): Markdown articles, FAQ accordion, search, feedback widget
- User management polish: edit profile, deactivate (not delete), search/filter, role reassignment
- Application settings UI: `NEEDS_REVIEW` confidence threshold, email notification preferences, pipeline configuration
- Email verification flow (must be enforced before any real user onboarding)
- Light/dark theme (next-themes; already in stack)

**Addresses:** FR-6 (reports), FR-7 (user management complete), FR-9 (help)
**Must avoid:** Loading all rows into heap for Excel (use `SXSSFWorkbook`), testing Excel export with <100 rows only (test with 5,000+), hardcoded `NEEDS_REVIEW` threshold in settings phase

---

### Phase 5: ML Integration — Replace Keyword Fallback with Real AI Model

**Rationale:** Phase 5 is deliberately late. Swapping the `ClassificationStrategy` from keyword to Spring AI requires only changing the injected bean — no UI, no API, no schema changes. This means Phase 5 can happen after the system is in production with real users, real taxonomy data, and validated override patterns. The ML provider decision (OpenAI, Anthropic, Bedrock) should be made with compliance review in hand (HIPAA BAA availability is a constraint). Confidence score calibration testing and fallback behavior must be production-ready before any real PHI-adjacent data is processed.

**Delivers:**
- Spring AI `ChatClient` integration: structured output to `ClassificationResult` POJO with all four taxonomy dimensions
- Native structured output mode (`ENABLE_NATIVE_STRUCTURED_OUTPUT`) — eliminates most JSON parse failures
- Pre-processing: markdown fence stripping, token budget management (truncate extracted text to model context window minus prompt tokens), `truncatedAt` flag on classification record
- Parse failure fallback: malformed JSON → keyword strategy (not FAILED status)
- LLM rate limit retry: Spring Retry `@Retryable` with exponential backoff (1s/2s/4s) on 429 responses
- Secondary confidence validation: two-call verification for borderline classifications
- `modelVersion` stored on every classification record (already in schema)
- `rawModelResponse` preview (first 500 chars) for debugging without re-fetching from S3
- Model performance KPI cards: precision, recall, F1 (requires ground truth from override data)
- PHI log audit: scan all log output for strings >200 chars; deploy log masking before any real data processed
- WireMock integration tests for malformed model responses

**Addresses:** FR-2.3 ML upgrade (from keyword fallback), FR-4.4 model performance metrics
**Must avoid:** Treating LLM confidence as accuracy, hardcoded `NEEDS_REVIEW` threshold (already configurable from Phase 3), logging extracted text at any level above TRACE, Swagger UI accessible in production
**Research flag:** NEEDS PHASE RESEARCH — ML provider selection (OpenAI vs. Bedrock vs. Anthropic), HIPAA BAA availability per provider, Spring AI native structured output configuration, and optimal prompt engineering for four-dimensional PCORI taxonomy classification are all research-worthy topics before this phase is planned.

---

### Phase 6: Testing, Hardening, and Production Readiness

**Rationale:** Security hardening, performance testing, and production infrastructure setup are final-phase concerns but must be planned for from Phase 1 (secrets management, partial indexes, structured logging). This phase validates everything works at scale and that compliance controls are in place.

**Delivers:**
- Testcontainers integration test suite: PostgreSQL for all JPA tests; WireMock for ML API stubbing; S3 integration against LocalStack
- Security integration tests: every endpoint called with every role; assert 403/200 matrix; no endpoint missing `@PreAuthorize`
- Performance testing: Playwright script measuring dashboard load time, long tasks during 5-second polling, classification table with 200+ rows
- Excel OOM test: generate 5,000-row report, assert no `OutOfMemoryError`
- N+1 query detection: Hibernate statistics in `@DataJpaTest`, assert `SELECT` count ≤ 2 for classification list page load
- S3 security test: assert direct object URL returns 403; pre-signed URL expires after TTL
- CI/CD pipeline: GitHub Actions — test → build Docker image → push to registry on merge to main; security scan for hardcoded secrets
- Production Flyway validation: `spring.jpa.hibernate.ddl-auto=validate` (never `create-drop` in production)
- Actuator security: expose only `health` and `prometheus`; restrict all others to internal IP or admin role
- CORS hardening: exact production frontend URL in `allowedOrigins`; no wildcard
- CSP headers: `Content-Security-Policy: script-src 'self'`

**Addresses:** All FR — testing and production readiness
**Must avoid:** Skipping security integration tests ("we'll do them later"), testing Excel only with small datasets, deploying without `staleTime` tuning verified
**Research flag:** STANDARD PATTERNS — Spring Boot test slices, Testcontainers, Playwright, GitHub Actions CI patterns are all well-documented.

---

### Phase Ordering Rationale

- **Auth before everything:** RBAC model, JWT secret management, and `AuditableEntity` base class are decisions that cascade through all other phases. Getting them right in Phase 1 prevents refactoring at Phase 5.
- **Taxonomy before classification:** The classifier requires a target label set. `R__seed_taxonomy.sql` must be in place before the pipeline can classify into any code.
- **Keyword fallback before ML:** This is the most important sequencing decision. Shipping Phase 2 without an ML provider allows the entire workflow to be validated with real users. ML integration (Phase 5) is then a backend-only change with no user-facing impact.
- **Analytics after data:** Dashboard KPI cards ship in Phase 2, but full analytics charts (accuracy trend, confidence histogram) require classified data with override history. Phase 3 delivers analytics that are initially sparse but meaningful after weeks of real usage.
- **ML after insights:** The override rate and accuracy trend data from Phase 3 provide empirical input for ML provider selection and confidence threshold tuning. Starting Phase 5 after real usage patterns are known is intentional.
- **Testing phase explicit:** Security integration tests, performance tests, and N+1 query detection are named explicitly to prevent them from being deprioritized as "nice to have."

### Research Flags

**Needs deeper research before phase planning:**
- **Phase 2 (Classification Pipeline):** PDFBox 3.x text extraction behavior for PCORI-style research plans (multi-section, tables, LaTeX exports); Spring AI native structured output configuration for guaranteed JSON schema conformance; token budget calculation for GPT-4o vs. Claude 3.5 context windows
- **Phase 5 (ML Integration):** ML provider comparison (OpenAI GPT-4o vs. Anthropic Claude 3.5 Sonnet vs. AWS Bedrock) on PCORI taxonomy classification accuracy; HIPAA BAA availability and data processing agreement terms per provider; optimal few-shot prompt engineering for four-dimensional simultaneous classification; secondary validation call design (two-call verification architecture)

**Standard patterns — skip research-phase:**
- **Phase 1 (Auth/Security):** Spring Security JWT filter chain is verified against official docs; patterns are deterministic
- **Phase 3 (Dashboard/Analytics):** Recharts + TanStack Query component architecture is well-documented; analytics SQL aggregations are standard GROUP BY patterns
- **Phase 4 (Reports/Admin):** Apache POI SXSSFWorkbook streaming is documented; admin UI patterns are standard CRUD
- **Phase 6 (Testing/Hardening):** Testcontainers, Playwright, GitHub Actions CI patterns are all stable and well-documented

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core framework choices verified against official docs (Spring Boot 3.4, Spring AI 1.1.6, PDFBox 3.0.7, Next.js 16, TanStack Query 5). Minor gaps: jjwt 0.12.x patch version (verify on Maven Central), Tailwind 4 CSS-first config specifics (verify `@import` syntax at setup) |
| Features | HIGH | PRD is the authoritative source; domain expertise on IDP and healthcare analytics supplements; feature dependencies verified against PRD entity model |
| Architecture | HIGH | Spring Security, Spring Data JPA, Next.js App Router patterns verified against official documentation; code examples are illustrative but verified for structural correctness |
| Pitfalls | HIGH (technical) / MEDIUM (compliance) | Technical pitfalls verified against official docs (Spring AI structured output caveat, PDFBox migration guide, Spring Security concurrency docs). HIPAA compliance controls: MEDIUM confidence — compliance review required before processing real research plan PDFs |

**Overall confidence:** HIGH

### Gaps to Address

- **ML provider HIPAA BAA:** The choice of OpenAI vs. Anthropic vs. AWS Bedrock for the ML classification model has compliance implications. Bedrock is HIPAA-eligible with BAA; OpenAI has a BAA available but requires verification; Anthropic BAA status requires verification. **This decision must be made before Phase 5 and should inform Phase 1 infrastructure choices (AWS ecosystem vs. provider-agnostic).** Do not process real research plan PDFs through an ML provider without a signed BAA.
- **PCORI taxonomy seed data:** The actual PCORI taxonomy codes, categories, and subcodes must be obtained from PCORI directly. The architecture supports loading via `R__seed_taxonomy.sql` (Flyway repeatable migration), but the actual data must be sourced before Phase 2 classification can produce meaningful results.
- **Confidence threshold calibration:** The `NEEDS_REVIEW` confidence threshold (default 0.75 suggested) must be empirically tuned after the first weeks of production data. Plan for a feedback loop: override rate by confidence band → adjust threshold → re-evaluate. This is a product decision requiring stakeholder input.
- **Tailwind CSS 4 CSS-first config:** The CSS-first config (`@import "tailwindcss"` in global CSS, no `tailwind.config.js`) is a breaking change from Tailwind 3. Verify exact plugin import syntax and PostCSS configuration for Next.js 16 at project setup — training data confidence is LOW for specific edge cases here.
- **Storage provider decision:** The architecture abstracts storage behind `StorageService` (AWS SDK v2 with `endpointOverride` for MinIO/LocalStack), but the production provider (AWS S3, Azure Blob, MinIO) affects infrastructure costs, compliance posture, and operational tooling. If deploying on AWS, use Bedrock + SES + S3 for a HIPAA-eligible all-AWS stack.

---

## Sources

### Primary (HIGH confidence)
- Spring AI 1.1.6 official docs — https://docs.spring.io/spring-ai/reference/index.html — structured output, ChatClient API, provider starters
- Spring AI structured output caveat — https://docs.spring.io/spring-ai/reference/api/structured-output-converter.html — "best effort" warning
- Spring Security 7.0.5 JWT docs — https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html — NimbusJwtDecoder, algorithm configuration
- Spring Security concurrency docs — https://docs.spring.io/spring-security/reference/features/integrations/concurrency.html — SecurityContext propagation in async contexts
- Spring Framework 7.0.7 scheduling docs — https://docs.spring.io/spring-framework/reference/integration/scheduling.html — ThreadPoolTaskExecutor, TaskDecorator
- Apache PDFBox 3.0 Migration Guide — https://pdfbox.apache.org/3.0/migration.html — `Loader.loadPDF()` requirement, `PDDocument.load()` removal
- Next.js 16 App Router docs — https://nextjs.org/docs/app — RSC, `'use client'`, Suspense, data fetching
- TanStack Query v5 docs — https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults — staleTime defaults, QueryClient instantiation
- Apache PDFBox 3.0.7 release — https://pdfbox.apache.org/ — latest stable confirmed 2026-03-09
- Spring Boot Actuator observability — https://docs.spring.io/spring-boot/reference/actuator/observability.html

### Secondary (MEDIUM confidence)
- HIPAA Technical Safeguards (45 CFR §164.312) — regulatory text; compliance review required for PHI handling specifics
- Hibernate 6 `@SQLRestriction` behavior with native queries — Hibernate 6 ORM documentation + community consensus; JPQL respects filter, native SQL does not
- IDP platform patterns (AWS Textract, Azure Form Recognizer, Rossum, ABBYY) — domain expertise, no direct source; consistent with industry knowledge
- Healthcare research tool patterns (REDCap, Covidence) — domain expertise, no direct source

### Tertiary (LOW confidence — verify at setup)
- Tailwind CSS 4 CSS-first config specifics — verify `@import "tailwindcss"` syntax and plugin imports at project setup
- jjwt 0.12.x latest patch version — verify on Maven Central; API stable since 0.12.0

---

*Research completed: 2026-05-20*
*Ready for roadmap: yes*
