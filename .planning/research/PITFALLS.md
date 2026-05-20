# Pitfalls Research

**Domain:** Healthcare Research Analytics — AI-assisted PDF classification, audit trail, dashboards, PCORI taxonomy management
**Researched:** 2026-05-20
**Confidence:** HIGH (Spring Security 7 / Spring AI 1.1.6 / PDFBox 3.x / Next.js 16 verified against official docs; healthcare compliance patterns from MEDIUM-confidence community consensus and HIPAA technical safeguard guidance)

---

## Critical Pitfalls

These mistakes cause rewrites, compliance failures, or security incidents.

---

### Pitfall 1: AI Classification Confidence Miscalibration — Treating Softmax Scores as Probabilities

**What goes wrong:**
The LLM returns a `confidence_score` field (e.g., `0.87`) in its structured JSON output. This number is displayed to users as "87% confident." In reality, LLM confidence scores are not calibrated probabilities — a GPT-4o response claiming 0.87 confidence for a wrong classification is indistinguishable from one correctly classified at 0.87. The model hallucinated or pattern-matched incorrectly but still returned a high self-reported confidence. Reviewers begin to trust the score as ground truth and stop verifying high-confidence results. Incorrect classifications slip through without human review, creating an incorrect audit trail that is difficult to remediate after the fact.

**Why it happens:**
Spring AI `BeanOutputConverter` / `entity()` structured output works by asking the LLM to self-report its confidence as a field in the JSON schema. The model has no mechanism to know it is wrong — it fills in the field based on training patterns, not epistemic certainty. Developers see it working in tests and assume it is a trustworthy signal.

**How to avoid:**
1. Never expose the raw LLM-reported confidence as the displayed confidence score without a secondary signal.
2. Implement a secondary validation layer: ask the LLM a second time to verify its own classification ("Given this taxonomy code, does this research plan text match? Answer YES/NO with a brief justification"). Use agreement between the two calls as a reliability signal.
3. Set a conservative mandatory-review threshold (e.g., flag all results with reported confidence < 0.75 as `NEEDS_REVIEW`, not just those below 0.50). Review the threshold empirically after onboarding real data.
4. Store `modelVersion` and `rawModelResponse` (truncated to first 500 chars) alongside the classification so that retrospective calibration is possible.
5. Document for users in the UI that the confidence indicator means "model self-reported certainty" and not statistical accuracy — use "AI Confidence" not "Accuracy."

**Warning signs:**
- Users report classified plans that are obviously wrong but have high confidence scores.
- Override rate is correlated with specific taxonomy categories (some are harder for the model; model doesn't know that).
- Classification accuracy never measurably improves even after many overrides (the model isn't receiving feedback).

**Phase to address:**
Phase covering ML/AI integration (classification pipeline). The secondary validation call and `NEEDS_REVIEW` threshold must be designed before any ML model is integrated, not retrofitted.

---

### Pitfall 2: LLM Structured Output Deserialization Failure Crashing the Async Pipeline with No Recovery

**What goes wrong:**
`chatClient.prompt().user(prompt).call().entity(ClassificationResult.class)` works perfectly during development. In production, the LLM occasionally returns malformed JSON (an extra trailing comma, a truncated response due to token limit, markdown fences wrapping the JSON like ` ```json {...} ``` `). Spring AI's `BeanOutputConverter` cannot deserialize the malformed output, throws a `RuntimeException`, and the pipeline's `@Async` method transitions the record to `FAILED`. The record sits in `FAILED` state with no extractable root cause in the UI — just "Classification failed." Retrying submits the same prompt that will likely fail again if the cause is systematic (e.g., a long PDF that exceeds the model's context window).

**Why it happens:**
Spring AI explicitly warns: "The `StructuredOutputConverter` is a best effort to convert the model output into a structured format. The AI Model is not guaranteed to return the structured output as requested." (source: Spring AI 1.1.6 official docs). Developers test with short, clean PDFs where this never occurs. Token limit and JSON formatting edge cases only manifest with complex multi-section research plans.

**How to avoid:**
1. Wrap the entire `classify()` call in a try-catch that distinguishes model output parse failures from network/API failures. Log the full raw model response on parse failure.
2. Implement a JSON repair step: before deserializing, strip markdown fences (`` ```json `` / `` ``` ``), trim trailing commas using a lenient JSON parser (Jackson's `ALLOW_TRAILING_COMMA` or a manual pre-processor).
3. Implement token budget management: before sending to the model, truncate extracted text to fit within the model's context window minus the prompt template tokens. Store `truncatedAt` flag in the classification record.
4. On parse failure, fall back to the keyword classification strategy — the record gets a lower-confidence classification rather than a hard failure.
5. Store the raw extraction result in a `extractedTextPreview` field (first 2000 chars) so debugging is possible without re-fetching from S3.
6. Use native structured output (`AdvisorParams.ENABLE_NATIVE_STRUCTURED_OUTPUT`) with OpenAI or Anthropic — the model guarantees JSON schema conformance, eliminating most parse failures.

**Warning signs:**
- `FAILED` records with no meaningful error message in the UI.
- Failure rate spikes for long PDFs (> 20 pages) or PDFs with heavy table content.
- Log `NullPointerException` or `JsonParseException` in `ClassificationStage` without the raw model response alongside it.

**Phase to address:**
Phase covering ML/AI integration and classification pipeline. Retry logic and fallback strategy must be designed before pipeline goes to production.

---

### Pitfall 3: PDF Extraction Producing Garbage Text for Non-Standard PDFs

**What goes wrong:**
PDFBox `PDFTextStripper.getText()` works perfectly for text-layer PDFs. For scanned PDFs (image-only, no text layer), it returns an empty string or whitespace. For PDFs with text encoded in custom Type3 fonts or with flate-compressed object streams, extraction returns garbled Unicode sequences. When this garbage text is sent to the ML model, the model either hallucinates a classification or returns a very low confidence. The classification is stored as if it were legitimate, polluting the dataset.

**Why it happens:**
PCORI research plan PDFs are researcher-submitted documents with no format specification enforced. Researchers may scan printed documents, use custom Word → PDF converters, or export from LaTeX. PDFBox 3.x changed the loading API (must use `Loader.loadPDF()` not `PDDocument.load()` which was removed) — developers who learned PDFBox 2.x hit this immediately. (Source: PDFBox 3.0 Migration Guide, official docs.)

**How to avoid:**
1. Always use `Loader.loadPDF(new RandomAccessReadBuffer(inputStream.readAllBytes()))` — never `PDDocument.load()` which does not exist in PDFBox 3.x.
2. After extraction, validate that the result is non-empty and contains plausible text density: at least 100 characters of non-whitespace per page. If below threshold, transition to `NEEDS_REVIEW` status with `extractionWarning: "low_text_density"`.
3. For image-only PDFs (empty extraction), detect and surface a human-readable error: "PDF appears to be scanned — manual entry required."
4. Implement a text quality score: ratio of printable ASCII characters to total characters. A score < 0.7 suggests encoding issues.
5. Do not send empty or garbage text to the ML model — it will waste API credits and produce nonsensical results. Gate on extraction quality.
6. Store the character count and text quality score in the `Classification` record for audit purposes.

**Warning signs:**
- Any `Classification` record where `extractedText` length is < 500 characters for a multi-page PDF.
- High override rate for a specific submitter (often indicates their PDF export toolchain produces non-standard output).
- Model returns unexpected taxonomy codes that have no relationship to the document's claimed subject area.

**Phase to address:**
Phase covering PDF extraction and classification pipeline foundation. Text quality validation must be implemented before ML integration — it is a prerequisite gate.

---

### Pitfall 4: Async Pipeline Stuck Records — PROCESSING Status with No Recovery on Restart

**What goes wrong:**
The `@Async` classification pipeline runs on a `ThreadPoolTaskExecutor` in the same JVM. If the application restarts mid-classification (deployment, crash, OOM kill), records in `PROCESSING` status are permanently stuck — no thread is running to advance them, and no scheduler re-queues them. These records appear to users as eternally "Processing" and never resolve. Users re-upload the same document, creating duplicate records. The audit trail is corrupted.

**Why it happens:**
`@Async` is ephemeral — it exists only in memory of the running JVM. Unlike a durable queue (SQS, RabbitMQ), there is no persistence of in-flight tasks. This is a known architectural tradeoff of using `@Async` for async work (documented in the Spring Framework scheduling reference). Developers only discover this in production when the first deployment rollout orphans records.

**How to avoid:**
1. Implement a startup recovery job that runs on `ApplicationReadyEvent`:
   ```java
   @EventListener(ApplicationReadyEvent.class)
   public void recoverStuckClassifications() {
       // Re-queue any record that has been PROCESSING for > configurable timeout (e.g., 10 minutes)
       Instant cutoff = Instant.now().minus(Duration.ofMinutes(10));
       repo.findByStatusAndUpdatedAtBefore(ClassificationStatus.PROCESSING, cutoff)
           .forEach(c -> pipeline.process(c.getId()));
   }
   ```
2. Add a `currentStage` field and `stageUpdatedAt` timestamp to the `Classification` entity — this makes it possible to compute how long a record has been stuck in a given stage.
3. Store `processingStartedAt` and compute `processingDurationMs` — alert (or auto-retry) if duration exceeds P99 processing time.
4. For the Pipeline Monitoring screen (FR-5), surface records stuck in PROCESSING for > threshold as a health warning.
5. Keep `@Async` for v1 but design the `ClassificationStrategy` interface to be implementable by a durable queue consumer in v2 without changing callers.

**Warning signs:**
- Any record in `PROCESSING` status for > 5 minutes (classification including ML API call should complete in < 2 minutes at P95).
- After a deployment, a batch of records is suddenly stuck in PROCESSING.
- Duplicate `Classification` records for the same PDF (users re-uploaded because the original stuck).

**Phase to address:**
Phase covering classification pipeline and FR-5 pipeline monitoring. Recovery logic must be in the initial pipeline implementation, not added later.

---

### Pitfall 5: JWT Secret Hardcoded, Symmetric Key Too Short, or Algorithm Confusion

**What goes wrong:**
The JWT signing secret is placed in `application.properties` in source code (e.g., `jwt.secret=mySecretKey`). This leaks into git history and the build artifact. Alternatively, the secret is too short (< 256 bits for HMAC-SHA256) allowing brute-force. In the worst case, the application accepts tokens signed with `alg: none` (the "none algorithm" attack) if `NimbusJwtDecoder` is configured without algorithm restriction.

**Why it happens:**
Spring Security 7 with `NimbusJwtDecoder` defaults to trusting `RS256` but developers building a custom `JwtAuthFilter` with JJWT 0.12.x do not always set `requireAlgorithm()`. JJWT before 0.12 had known signature validation weaknesses in how it handled algorithm selection.

**How to avoid:**
1. JWT secret must come from environment variable only: `@Value("${JWT_SECRET}")` and `JWT_SECRET` set via Kubernetes Secret / Docker secret / AWS Secrets Manager. Never in `application.properties`.
2. Use a cryptographically random secret of at least 512 bits (64 bytes) for HMAC-SHA256. Generate with: `openssl rand -base64 64`.
3. With JJWT 0.12.x, explicitly call `.requireAlgorithm(SignatureAlgorithm.HS256)` when parsing tokens.
4. With Spring Security's `NimbusJwtDecoder`, configure `.jws-algorithms: HS256` in config and `.jwsAlgorithm(MacAlgorithm.HS256)` in the builder to prevent algorithm confusion.
5. Add a startup check: if `JWT_SECRET` env var is unset or fewer than 64 characters, fail fast with `IllegalStateException` — do not start with a weak or missing secret.
6. Rotate the secret at least annually and on any suspected exposure — all existing tokens become invalid on rotation (stateless JWT, acceptable for this use case).

**Warning signs:**
- `jwt.secret` key appears in `application.properties` or `application.yml` committed to git.
- Tokens with `"alg":"none"` are accepted by the application.
- Secret length is < 32 characters (too short for HS256).

**Phase to address:**
Phase covering authentication foundation (FR-1). This must be locked down before any other feature is built — it is a security prerequisite.

---

### Pitfall 6: RBAC Check Gaps — Service Layer Trusts Controller-Level @PreAuthorize Too Much

**What goes wrong:**
Access control is implemented via `@PreAuthorize("hasRole('ADMIN')")` on controller methods. A developer later adds an internal `@Service` method that calls `classificationRepository.deleteById()` or `userRepository.findAll()` — no `@PreAuthorize` on the service method because "it's internal." A bug in another part of the code (e.g., a misconfigured route, an accidentally public endpoint, a test endpoint left in production) calls the service method directly, bypassing the controller. Sensitive data is exposed or modified without authorization.

Additionally: a Reviewer can see the `/api/admin/users` endpoint returns 403, but if they know the user UUID and call `/api/users/{id}` (the non-admin endpoint), they retrieve full user details because only the admin-scoped list endpoint has RBAC — the individual get endpoint does not.

**Why it happens:**
RBAC at the controller layer only is insufficient. Developers assume that if the route is protected, the data behind it is safe. But with 80+ endpoints and 5 roles, gaps are nearly inevitable without service-layer enforcement.

**How to avoid:**
1. Enable method security globally: `@EnableMethodSecurity` in `SecurityConfig` (not just `@EnableWebSecurity`).
2. Apply `@PreAuthorize` to service-layer methods that access sensitive data, not just controllers. Controllers delegate — services enforce.
3. Use a permission matrix in code: create a `Permission` enum with values like `CLASSIFY_PLAN`, `OVERRIDE_CLASSIFICATION`, `VIEW_ALL_USERS`, `MANAGE_TAXONOMY` — map roles to permissions rather than checking role names directly. This prevents the role-proliferation problem.
4. Write dedicated security integration tests for each role: `@WithMockUser(roles = "REVIEWER")` calling every endpoint and asserting forbidden/allowed correctly. With 80+ endpoints this must be automated.
5. For data-scoped access (a Reviewer can only see their own uploads), add owner checks in the service layer: `if (!classification.getUploadedBy().getUsername().equals(currentUser)) throw new AccessDeniedException(...)` — unless the user is a Program Manager or Admin.

**Warning signs:**
- Any `@RestController` endpoint that does not have an explicit `@PreAuthorize` annotation or a `SecurityConfig` rule.
- Service methods that call `repository.findAll()` or `repository.deleteById()` without an authorization check.
- A user can retrieve another user's classification record by guessing the UUID.

**Phase to address:**
Phase covering authentication and authorization (FR-1). Must be established before any feature endpoints are built. Add security integration tests in the testing phase.

---

### Pitfall 7: Soft-Delete @SQLRestriction Not Applied to All Query Paths

**What goes wrong:**
Hibernate 6's `@SQLRestriction("deleted_at IS NULL")` on the `Classification` entity is correctly applied to `JpaRepository` methods and `findById()`. However, native SQL queries (`@Query(nativeQuery = true)`) do NOT apply the `@SQLRestriction` — they execute exactly as written. The analytics queries (`SELECT COUNT(*) FROM classifications GROUP BY status`) run as native SQL for performance reasons, and they count soft-deleted records, inflating the dashboard KPIs. When compliance requires showing "how many plans were classified," the numbers include deleted test data from development.

**Why it happens:**
The distinction between JPQL queries (which respect `@SQLRestriction`) and native SQL queries (which do not) is not prominently documented and is easy to forget. Developers write native SQL for analytics aggregations because JPQL is verbose for GROUP BY queries.

**How to avoid:**
1. For all native SQL analytics queries, explicitly add `AND deleted_at IS NULL` to the WHERE clause.
2. Create a rule in the code review checklist: any `nativeQuery = true` query against the `classifications` table must include `deleted_at IS NULL`.
3. Prefer JPQL or Specifications for queries that will benefit from `@SQLRestriction`; use native SQL only when JPQL cannot express the query efficiently.
4. Write integration tests that create a soft-deleted record and assert it does not appear in counts, list queries, and analytics results.
5. Consider naming all native SQL count queries with a suffix (`_NATIVE`) as a code convention — makes them findable for audit.

**Warning signs:**
- Dashboard KPI counts do not match the visible records in the classification list.
- Analytics counts decrease after a user "deletes" a record (which should soft-delete, not remove from counts for audit).

**Phase to address:**
Phase covering database schema + analytics/dashboard features. The test must be written at the same time as the soft-delete implementation, not after.

---

### Pitfall 8: Audit Trail Gaps — AuditorAware Returns Empty During Async Execution

**What goes wrong:**
`SecurityAuditorAware.getCurrentAuditor()` reads from `SecurityContextHolder`. In normal HTTP request handling, the SecurityContext is thread-local and available. But when the `@Async` classification pipeline runs on a separate thread (the `classificationExecutor` thread pool), the SecurityContext is NOT propagated by default — `SecurityContextHolder.getContext().getAuthentication()` returns null. Any JPA entity saved during pipeline execution (status updates, result persistence) records `createdBy = null` and `lastModifiedBy = null`. This corrupts the audit trail.

**Why it happens:**
Spring Security's `SecurityContextHolder` uses thread-local storage by default. `@Async` spawns a new thread where the context is empty unless explicitly propagated. The Spring Security concurrency documentation specifically addresses this but many developers skip it.

**How to avoid:**
1. Set `SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_INHERITABLETHREADLOCAL)` — this propagates context to child threads automatically. But this only works for threads that are child threads of the request thread; may not work for all executor types.
2. Preferred approach: use a `TaskDecorator` on the `classificationExecutor` that captures and restores the SecurityContext:
   ```java
   exec.setTaskDecorator(runnable -> {
       SecurityContext context = SecurityContextHolder.getContext();
       return () -> {
           try {
               SecurityContextHolder.setContext(context);
               runnable.run();
           } finally {
               SecurityContextHolder.clearContext();
           }
       };
   });
   ```
3. For pipeline audit writes where the "author" is the system (not a user), store the uploading user's username in the `Classification` entity itself (already planned as `uploadedBy`) and reference it directly when writing audit fields during pipeline processing — do not rely on `@CreatedBy` for pipeline-stage updates.
4. Write an integration test: upload a file, let the pipeline run, verify `lastModifiedBy` is not null on the final `CLASSIFIED` record.

**Warning signs:**
- `createdBy` or `lastModifiedBy` is null in the database for records saved by the pipeline.
- `@LastModifiedBy` shows null for status-update saves.
- Compliance audit finds gaps: some records have no `reviewedBy` populated even though they were processed.

**Phase to address:**
Phase covering async pipeline + audit trail. The `TaskDecorator` must be applied at the time `AsyncConfig` is written, not discovered during testing.

---

### Pitfall 9: PHI Exposure Vector — Extracted PDF Text Logged in Plain Text

**What goes wrong:**
Research plan PDFs submitted to PCORI may contain Protected Health Information (PHI): patient demographics, clinical study site details, or identifiable medical record data. The classification pipeline extracts full text from the PDF and passes it to the ML model. Without care, this extracted text is:
- Logged in full by `@Slf4j` debug statements in the service layer (e.g., `log.debug("Extracted text: {}", extractedText)`).
- Included in exception messages that propagate to centralized logging (Grafana Loki, ELK).
- Stored in a `raw_extraction` column without encryption.
- Exposed in the Swagger UI response body when testing endpoints.

A log aggregation tool with weak access controls becomes a PHI exposure vector.

**Why it happens:**
Developers add verbose logging during development for debugging, forget to remove or redact it before production. No systematic PHI detection is applied to log output.

**How to avoid:**
1. Never log extracted text from PDFs at any log level except TRACE, and disable TRACE in production via `logging.level.com.pcori=INFO`.
2. Add a Logback `%replace` pattern or `MaskingConverter` to redact any string longer than 200 characters that could be document text.
3. Do NOT store raw extracted text in the database. If debugging requires it, store only a truncated preview (first 500 characters) in a `extractedTextPreview` field with a documented retention/access policy.
4. Configure Swagger UI to be disabled in production: `springdoc.swagger-ui.enabled=false` in the production profile.
5. Enable structured logging (logstash-logback-encoder) with a field whitelist — only log named fields, not arbitrary message strings.
6. If using AWS, enable CloudTrail and S3 server access logging for the bucket holding uploaded PDFs. Add bucket policy denying public read access and requiring SSE-KMS encryption.

**Warning signs:**
- Any log line containing > 500 characters of free-form text.
- Swagger UI accessible in production without authentication.
- S3 bucket policy allows `s3:GetObject` without resource restriction.

**Phase to address:**
Phase covering ML integration and file pipeline. Must be addressed before any real research plan PDFs are uploaded, even for testing.

---

### Pitfall 10: React/Next.js Classification Table Performance — Rendering 100s of Rows with Recharts in Same Component

**What goes wrong:**
The analytics dashboard and classification list table are built in the same `'use client'` component. When the classification list grows beyond 200 rows and the dashboard simultaneously renders 4 Recharts charts (line chart with 30 data points, bar histogram, area chart, confidence gauge), the entire component re-renders on every TanStack Query background refetch. Each background refetch (every 5 seconds for polling) triggers a full re-render of all 4 charts plus the table. With Recharts animations enabled, this causes noticeable 200–400ms jank on every poll cycle. The PRD target is dashboard initial load < 1.5 seconds; background refetch jank is not captured by that metric but devastates perceived performance.

**Why it happens:**
Developers build the full page as one large client component to avoid the complexity of multiple `useQuery` hooks and component boundaries. Recharts animations run on every mount/re-render by default. TanStack Query's `staleTime` defaults to `0` (always stale), meaning every focus event triggers a refetch.

**How to avoid:**
1. Separate Recharts chart components and the classification table into independent components, each with their own `useQuery` call and independent cache keys. Changes to the table data (e.g., a new classification) don't re-render the charts.
2. Set `staleTime` appropriately per resource type: dashboard KPIs = 60 seconds, classification list = 30 seconds, analytics trend data = 5 minutes. Avoid the default `staleTime: 0`.
3. Disable Recharts animations in production: `<LineChart isAnimationActive={false}>`. Animations look good in demos but degrade performance on repeated renders.
4. Use `React.memo` on chart components — they should only re-render when their data prop changes.
5. Implement virtual scrolling for the classification table if the list grows beyond 100 rows (`@tanstack/react-virtual` or `react-window`).
6. For the classification list polling, use `refetchInterval` conditionally: only poll when at least one record is in `PROCESSING` status, not continuously.

**Warning signs:**
- Chrome DevTools performance trace shows > 200ms long tasks on every 5-second refetch interval.
- The browser `fps` counter drops below 30 during chart animation + table refetch.
- `console.count('render')` shows chart components rendering more than once per data change.

**Phase to address:**
Phase covering analytics dashboard (FR-4) and classification list (FR-2). Performance architecture decisions must be made during component design, not optimized post-hoc.

---

### Pitfall 11: Flyway Migration Fails on H2 (Dev) Due to PostgreSQL-Specific SQL

**What goes wrong:**
The production migration script uses PostgreSQL-specific SQL: `gen_random_uuid()`, `TIMESTAMPTZ`, `GENERATED ALWAYS AS ... STORED`, `CREATE INDEX ... WHERE deleted_at IS NULL` (partial indexes), and `GIN` index type for full-text search. These do not exist in H2. The migration runs successfully against PostgreSQL in production but fails immediately in the H2 dev environment with `JdbcSQLSyntaxErrorException`. Developers cannot run the application locally without either switching to PostgreSQL locally (dev overhead) or maintaining two separate migration scripts.

**Why it happens:**
H2 has a "PostgreSQL compatibility mode" (`MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE`) that supports some syntax but not all. The advanced features (partial indexes, `GENERATED ALWAYS AS STORED`, `GIN`) are not supported in any H2 compatibility mode.

**How to avoid:**
1. Configure H2 in PostgreSQL compatibility mode as a minimum baseline: `spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH`.
2. Use Flyway's vendor-specific script directories: place PostgreSQL-specific migrations in `db/migration/postgresql/` and H2-compatible versions in `db/migration/` (or use `flyway.locations` per profile).
3. Simpler approach: remove H2 from the dev environment entirely. Use Docker Compose with a real PostgreSQL container (`postgres:16-alpine`). This eliminates the dialect gap and ensures dev matches production. H2 was only recommended for "fast dev iteration" — Docker Compose is fast enough.
4. For CI, use Testcontainers (PostgreSQL) in integration tests — no H2.
5. If H2 is retained: use `UUID()` instead of `gen_random_uuid()`, avoid `TIMESTAMPTZ` (use `TIMESTAMP`), remove `GENERATED ALWAYS AS STORED` columns from H2 migrations (add them only in PostgreSQL migration), and replace `GIN` indexes with plain `INDEX` in H2.

**Warning signs:**
- `org.h2.jdbc.JdbcSQLSyntaxErrorException` on startup in dev.
- Flyway `migrate` shows success in CI (PostgreSQL Testcontainers) but fails locally (H2).
- Developers begin modifying migration scripts to "fix H2" and breaking the PostgreSQL version.

**Phase to address:**
Phase covering database schema and Flyway migration setup. The dev environment strategy must be decided before the first migration is written.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded taxonomy seed data in `@PostConstruct` | Faster to ship | Cannot be updated without code change; breaks when taxonomy changes; no audit trail for taxonomy changes | Never — use Flyway `R__seed_taxonomy.sql` (repeatable migration) instead |
| `spring.jpa.hibernate.ddl-auto=update` in production | No Flyway setup needed | Schema drift, data loss risk, no version history, violates HIPAA change management controls | Never in production — dev only with H2 |
| `@Async` without a rejection policy on the `ThreadPoolTaskExecutor` | Default works in testing | Under load, when queue (capacity 50) fills, tasks are silently dropped. `PENDING` records never become `CLASSIFIED`. | Never — set `setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy())` |
| `jwt.secret` from `application.properties` | Works immediately | Security incident vector; leaks in git, build artifacts, and Java heap dumps | Never — env var only |
| JWT stored in `localStorage` | Simple to implement | XSS can steal the token; cannot be revoked before expiry | Acceptable for v1 if CSP headers are strict and the system is not a high-value target; revisit for v2 with HttpOnly cookies if SSO is added |
| No `staleTime` on TanStack Query | Always fresh data | Excessive API load; dashboard makes 20+ requests per minute per user from background refetches | Never — always set `staleTime` per resource type |
| Single Axios instance without timeout | Simple | Long-running slow API responses block the UI indefinitely; users think the app is hung | Never — set `timeout: 30_000` as a baseline |
| `disabled_at` instead of `deleted_at` for soft-delete column | Slightly clearer semantics | `@SQLRestriction("deleted_at IS NULL")` is the Hibernate convention — must change annotation if column name differs | Use `deleted_at` always — match the Hibernate convention |
| Skip email verification in early development | Faster signup | Users register with fake emails; cannot password reset; PHI-touching system with unverified user identities | Never in production — implement email verification before first real user onboarding |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| S3 / MinIO | Using `content.available()` to get content length in `RequestBody.fromInputStream()` | `InputStream.available()` does not return the total length — it returns bytes buffered in memory. Use `file.getSize()` from the `MultipartFile` for content length, or buffer to byte array first. |
| S3 / MinIO | Not configuring `pathStyleAccessEnabled(true)` for MinIO/LocalStack | AWS S3 uses virtual-hosted style (`bucket.s3.amazonaws.com`); MinIO requires path-style (`localhost:9000/bucket`). Missing this causes `NoSuchBucketException` in dev. |
| Spring AI (OpenAI/Anthropic) | Missing retry on rate-limit (429) errors | LLM API providers rate-limit by default. Implement exponential backoff with jitter: catch `OpenAiHttpException` with status 429, retry up to 3 times with 1s/2s/4s delays. Spring Retry `@Retryable` on the classification strategy method. |
| Spring AI structured output | LLM returns a field as `null` when the schema marks it as required | Use `@NotNull` on the `ClassificationResult` POJO fields and validate after deserialization — do not assume the model respected the JSON schema. |
| JavaMailSender (SMTP) | `spring.mail.*` properties set in `application.properties` (plain text) | Credentials for SMTP relay (SES/SendGrid) must come from env vars. Use `${SMTP_USERNAME}` and `${SMTP_PASSWORD}` in `application.properties`, populated from environment. |
| Flyway + PostgreSQL | Flyway 10.x requires `flyway-database-postgresql` artifact separately | Spring Boot 3.4.x still requires `flyway-database-postgresql` as an explicit dependency alongside `flyway-core` for PostgreSQL 14+ support. Missing this causes `FlywayTeamsUpgradeRequiredException` at startup. |
| PDFBox 3.x | Using `PDDocument.load()` (removed in 3.x) | Must use `Loader.loadPDF()`. If code was ported from PDFBox 2.x examples, this will cause `NoSuchMethodError` at runtime. |
| TanStack Query | Not wrapping `QueryClient` in `useState` in the provider | Creating `new QueryClient()` outside `useState` causes a new client instance on every render in Next.js App Router. Use `const [queryClient] = useState(() => new QueryClient(...))`. |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `SELECT *` analytics queries without pagination | Dashboard slow to load | All analytics queries must return aggregated counts, not row sets. Never `findAll()` for KPIs. | At ~500 classification records |
| Eager loading `@OneToMany` `children` on `TaxonomyCategory` | Taxonomy tree endpoint returns slowly and consumes excessive memory | Use `FetchType.LAZY` on all `@OneToMany` relationships; use `JOIN FETCH` only in the specific queries that need tree traversal | At ~200 taxonomy nodes with 4 levels |
| No database indexes on filter columns | Classification list sort/filter becomes slow | Add indexes on `status`, `uploaded_at`, `uploaded_by`, `deleted_at`. Partial indexes on `(status) WHERE deleted_at IS NULL`. | At ~10,000 classification records |
| Re-fetching the entire classification list on every mutation | Table flickers and feels slow | Use TanStack Query `queryClient.setQueryData()` for optimistic updates; invalidate the specific affected record not the entire list | Noticeable with > 50 records, bad with > 200 |
| Recharts animations on data-dense charts | 60fps drops to 15fps on chart re-render | Set `isAnimationActive={false}` on all Recharts chart elements in production | With > 30 data points per series |
| Blocking ML API call on Tomcat request thread (not using @Async) | P95 API latency > 2s; thread pool exhaustion under concurrent uploads | Always route ML calls through the async pipeline; never call ML API synchronously in the controller → service flow | At > 2 concurrent uploads |
| Excel report loading all rows into memory (Apache POI XSSF) | OOM for large exports | Use `SXSSFWorkbook` (streaming variant of XSSF) for reports with > 1000 rows. `SXSSFWorkbook` writes rows to disk and streams output. | At > 5,000 classification records in an export |
| N+1 query in classification list (loading `uploadedBy` user per row) | `SELECT * FROM users WHERE id=?` fires once per classification in the list page | Use `@EntityGraph` or `JOIN FETCH` on the classification list query to eagerly load `uploadedBy` in a single query | At > 25 records per page |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing `/actuator/*` endpoints without auth | Internal metrics, environment info, and health details accessible to anyone | Configure `management.endpoints.web.exposure.include=health,prometheus` only. Secure non-public actuator endpoints with a separate `SecurityFilterChain` restricted to internal IP range or admin role. |
| CORS wildcard `*` in `SecurityConfig` | Any website can make authenticated API calls using a stolen JWT | Set `allowedOrigins` to the exact production frontend URL. Use `allowedOriginPatterns` only for dev. Never `*` in production. |
| JWT stored in `localStorage` with no Content Security Policy | XSS can exfiltrate JWT token | Implement strict CSP headers via Spring Security's `headers().contentSecurityPolicy(...)`. Restrict `script-src` to `'self'`. |
| Returning full `User` entity in API responses | `passwordHash` or internal fields exposed | Always return DTOs — never JPA entities from `@RestController`. Create `UserResponse` record that excludes `passwordHash`, `failedLoginAttempts`, `lockoutExpiry`. |
| Classification records accessible by ID without owner check | Any authenticated user can access any classification by guessing UUIDs | Add owner verification in `ClassificationService.getById()`: throw `AccessDeniedException` if the requester is not the uploader, a Program Manager, or an Admin. |
| Email enumeration via "Email not found" messages | Attackers can enumerate valid user accounts | Return the same response ("If an account with this email exists, a reset link has been sent") whether or not the email is found. |
| No rate limiting on `/api/auth/login` | Brute-force password attacks | Implement account lockout in the service layer (already planned in PRD). Additionally, add IP-level rate limiting via a filter: max 5 requests per minute per IP to the login endpoint. |
| PDF upload without server-side MIME validation | Malicious files uploaded as PDFs (SVG with XSS, JavaScript, executable) | Use Apache Tika to validate MIME type from file content (not extension). Reject anything that is not `application/pdf`. |
| S3 bucket with public read access | Uploaded research plan PDFs (potentially containing PHI) publicly accessible | Bucket policy must deny `s3:GetObject` without an explicit IAM principal. Use pre-signed URLs with short TTL (15 minutes) for download links, not permanent public URLs. |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No upload progress for large PDFs | Users think the app is broken, refresh and duplicate their upload | Use `onUploadProgress` callback in Axios to show deterministic progress bar during multipart upload |
| Blocking UI during classification ("waiting" state with spinner only) | Users don't know how long to wait; close the tab | Return 202 immediately, show status progression: "Queued → Extracting text → Classifying → Complete" with time elapsed |
| No empty state for the classification list | First-time users see a blank table with no guidance | Show an illustrated empty state with a call to action: "Upload your first research plan" |
| Confidence displayed as decimal (0.87) | Non-technical users don't understand | Display as percentage (87%) with a color band: green ≥ 80%, yellow 60–79%, red < 60% |
| Override dialog that clears on accidental close | Reviewer loses all entered correction data | Warn on close if fields are dirty; or keep form state in React state outside the dialog |
| Table with no column sort indicators | Users can't tell what column the data is sorted by | Show sort direction arrow on the active sort column header; persist sort preference in `localStorage` or URL params |
| Date filtering that applies only to the chart, not the KPI cards | Program managers expect date range to apply to all data | Date range filter must cascade to KPI counts, table, and charts simultaneously — single source of truth |
| Audit log showing only final status, not history | Compliance review needs to see who changed what when | Implement a classification event timeline: each status transition stored as an event with `actor`, `timestamp`, `fromStatus`, `toStatus`, `note` |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **JWT Auth:** Often missing refresh token or explicit expiry handling — verify that 401 responses trigger a "Session expired" toast, clear localStorage, and redirect to `/login` with `?reason=session-expired` in the URL
- [ ] **Manual Override:** Often missing override reason persistence — verify `overrideReason` is saved to the database and appears in the audit trail view, not just the dialog
- [ ] **Soft Delete:** Often missing exclusion from analytics counts — verify that soft-deleted classifications are excluded from KPI counts and trend charts using native SQL `AND deleted_at IS NULL`
- [ ] **Email Verification:** Often "implemented" but not tested with email delivery disabled — verify that registration without email verification is blocked even if the verification email fails to send
- [ ] **Pipeline Retry:** Often only retries the ML call, not the full pipeline — verify that retry re-runs PDF extraction AND ML classification, not just one stage
- [ ] **RBAC on GET endpoints:** Often only applied to write operations — verify that `GET /api/users` and `GET /api/classifications` enforce role-based scoping (Reviewer sees only their own; Admin sees all)
- [ ] **Taxonomy activate/deactivate:** Often missing cascade — verify that deactivating a parent taxonomy category also makes it unavailable for new classifications, and that existing classifications referencing deactivated codes are flagged
- [ ] **Excel export:** Often tested only with < 100 rows — verify with 5,000+ rows using `SXSSFWorkbook`; verify Content-Disposition header triggers download rather than inline display
- [ ] **Account lockout:** Often locks permanently (bad UX) or never (bad security) — verify lockout duration is configurable, TTL-based auto-unlock works, and admin can manually unlock
- [ ] **S3 download link:** Often returns a permanent public URL — verify pre-signed URL is generated with a short TTL (15 minutes) and that unauthenticated requests to S3 are denied
- [ ] **Async pipeline status:** Often only shows PENDING/CLASSIFIED, not intermediate stages — verify that PROCESSING records show which stage they are in (EXTRACTING, CLASSIFYING) in the UI
- [ ] **Dashboard date range filter:** Often applies to charts only — verify it also updates KPI card values to reflect the selected time window

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| JWT secret exposed | HIGH | 1. Immediately rotate secret (all existing sessions invalidated). 2. Rotate in all deployment environments. 3. Audit logs for suspicious access patterns in the window of exposure. 4. Notify security team. |
| PHI exposed in logs | HIGH | 1. Immediately restrict log access. 2. Identify the time window and which logs contain PHI. 3. Delete or redact affected log entries. 4. Notify compliance officer / HIPAA privacy officer. 5. Assess whether breach notification is required. |
| Large batch of STUCK PROCESSING records | MEDIUM | 1. Deploy the startup recovery job. 2. Restart the application to trigger recovery. 3. Monitor the recovery queue for new FAILED records. 4. Communicate estimated resolution time to users. |
| Wrong taxonomy classification in bulk (model drift) | MEDIUM | 1. Identify affected classifications by date range and model version. 2. Mass-transition to NEEDS_REVIEW status. 3. Notify reviewers of the re-review backlog. 4. Update the model or prompt before re-running. |
| Flyway migration failed in production | HIGH | 1. Do NOT run `flyway repair` without understanding the failure. 2. Roll back the application to the previous version. 3. Fix the migration script. 4. Apply using `flyway migrate` manually after testing on a production-equivalent DB. Never auto-apply broken migrations. |
| Analytics counts inflated by soft-deleted records | LOW | Write a one-time data validation query. Add `AND deleted_at IS NULL` to all native SQL queries. Deploy. Re-verify counts. |
| TanStack Query fetching loop (staleTime: 0) causing API overload | MEDIUM | Deploy with corrected `staleTime` values immediately. Set emergency rate limiting on the API tier. Monitor request volume normalizes. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| JWT secret in source code | Auth foundation phase | Security scan in CI: `git grep -r "jwt.secret"` must find no hardcoded secrets; startup test with unset env var must fail fast |
| RBAC check gaps | Auth + RBAC phase | Automated security integration tests: each endpoint called with every role; assert correct 403/200 |
| Async pipeline stuck records | Classification pipeline phase | Integration test: kill and restart the app mid-classification; verify recovery job re-queues the stuck record |
| Audit trail gaps in async context | Classification pipeline phase | Integration test: classify a plan asynchronously; assert `lastModifiedBy` is not null on the final record |
| AI confidence miscalibration | ML integration phase | Manual test with deliberately ambiguous research plan PDFs; verify low-confidence results are flagged `NEEDS_REVIEW` |
| LLM structured output failure | ML integration phase | Unit test: inject malformed JSON response from WireMock; verify pipeline falls back to keyword strategy, not hard failure |
| PDF extraction garbage text | Classification pipeline phase | Integration test: upload a scanned (image-only) PDF; verify NEEDS_REVIEW status and extractionWarning field populated |
| Soft-delete not applied to analytics | Database + analytics phase | Integration test: create and soft-delete a record; assert it does not appear in KPI counts or trend charts |
| PHI in logs | ML integration + file pipeline phase | Log audit before any real data is processed: scan log output for strings > 200 chars; configure log level enforcement |
| Flyway H2/PostgreSQL dialect gap | Database schema phase | Verify all migrations run successfully against both H2 (if retained) and PostgreSQL Testcontainer in CI |
| Recharts performance on repeated re-renders | Analytics dashboard phase | Performance test: Playwright script that loads dashboard and measures long tasks over 60 seconds with polling active |
| N+1 query in classification list | Classification list phase | Integration test with Spring Boot Test + Testcontainers: enable Hibernate statistics, assert `SELECT` count ≤ 2 for loading the classification list page |
| Excel OOM for large exports | Reports phase | Integration test: generate report with 5,000 rows using `SXSSFWorkbook`; verify no `OutOfMemoryError` and file is valid `.xlsx` |
| S3 public access | File management phase | Test: verify that direct S3 object URL returns 403 without pre-signed credentials |

---

## Sources

- Spring AI 1.1.6 Structured Output docs — https://docs.spring.io/spring-ai/reference/api/structured-output-converter.html (official, verified 2026-05-20): "The `StructuredOutputConverter` is a best effort... The AI Model is not guaranteed to return the structured output as requested."
- Spring Security 7.0.5 JWT Resource Server docs — https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html (official, verified 2026-05-20): JWT algorithm configuration, NimbusJwtDecoder
- Spring Framework 7.0.7 Task Execution docs — https://docs.spring.io/spring-framework/reference/integration/scheduling.html (official, verified 2026-05-20): ThreadPoolTaskExecutor configuration, TaskDecorator pattern
- Apache PDFBox 3.0 Migration Guide — https://pdfbox.apache.org/3.0/migration.html (official, verified 2026-05-20): `Loader.loadPDF()` requirement, `PDDocument.load()` removal
- Next.js 16 Server and Client Components — https://nextjs.org/docs/app/getting-started/server-and-client-components (official, verified 2026-05-20): `'use client'` boundary, environment poisoning, context providers
- Spring Security concurrency — https://docs.spring.io/spring-security/reference/features/integrations/concurrency.html (HIGH confidence — official docs): SecurityContext propagation in async contexts
- HIPAA Technical Safeguard Controls — Covered under 45 CFR §164.312 (MEDIUM confidence — regulatory text; no direct URL to code); compliance review required for PHI handling
- Hibernate 6 `@SQLRestriction` behavior with native queries — community knowledge + Hibernate 6 ORM documentation (MEDIUM confidence); JPQL respects filter, native SQL does not
- TanStack Query best practices — https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults (official, HIGH confidence): staleTime defaults, QueryClient instantiation pattern

---

*Pitfalls research for: PCORI Research Analytics Platform — healthcare research AI classification*
*Researched: 2026-05-20*
