# Stack Research

**Domain:** Healthcare Research Analytics — AI-assisted PDF classification, audit trail, dashboards, Excel reporting
**Researched:** 2026-05-20
**Confidence:** HIGH (core framework choices verified against official docs; supporting libraries verified against official release pages; minor gaps flagged LOW)

---

## PRD-Chosen Stack Validation

The PRD pre-selects the following core technologies. Research verdict for each:

| Technology | PRD Choice | Verdict | Notes |
|---|---|---|---|
| Backend runtime | Spring Boot 3.4 + Java 21 | ✅ **SOLID** | 3.4.x is current production release family; Java 21 is the LTS baseline Spring Boot 3.x requires |
| Frontend | Next.js 16 + React 19 + TypeScript | ✅ **SOLID** | App Router + RSC is the standard 2025 pattern; TS is non-negotiable for maintainability |
| Auth | JWT stateless, BCrypt, account lockout | ✅ **SOLID** | Correct for a stateless, horizontally-scalable backend |
| Persistence | JPA + HikariCP; H2 dev → PostgreSQL prod | ✅ **SOLID** | Industry standard; Flyway migration needed (see Gap below) |
| Build tool | Docker for backend | ✅ **SOLID** | Standard; use multi-stage Dockerfile |
| CSS | Tailwind CSS 4 | ✅ **SOLID** | CSS-first config (no tailwind.config.js in v4); breaking change from v3 — confirm plugin imports |
| Components | Radix UI primitives | ✅ **SOLID** | Best WCAG 2.1 AA accessibility primitives for React |
| Charts | Recharts | ✅ **SOLID** | Composable, React-native; correct for analytics dashboards |
| Forms | react-hook-form + zod | ✅ **SOLID** | Standard pairing; zod schema shared between form and API validation |
| Toasts | sonner | ✅ **SOLID** | Lightweight, performant; replaces react-hot-toast as the community default |
| Theming | next-themes | ✅ **SOLID** | Standard light/dark token approach with Next.js |
| Fonts | Geist | ✅ **SOLID** | Vercel's system font; zero-CLS with `next/font` |

---

## Recommended Stack

### Core Technologies — Backend

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Spring Boot | 3.4.x | Application framework | PRD-mandated; 3.4 is current stable; Spring Security, JPA, Actuator all auto-configured |
| Java | 21 (LTS) | Runtime | Virtual threads (Project Loom) available; record types; pattern matching; long-term support |
| Spring Security | 6.4.x (bundled with Boot 3.4) | JWT auth, RBAC, CORS | Built-in support for `NimbusJwtDecoder`, `JwtAuthenticationConverter`; BCrypt via `PasswordEncoder`; method-level `@PreAuthorize` for RBAC |
| Spring Data JPA + Hibernate | 3.x (bundled) | ORM, repositories | Full JPA spec, soft-delete via `@SQLRestriction`, Specifications for dynamic filtering |
| HikariCP | 5.x (bundled) | Connection pooling | Fastest JDBC pool; auto-configured by Boot |
| Flyway | 10.x | Database migrations | Schema versioning; works with H2 (dev) and PostgreSQL/MySQL (prod); preferred over Liquibase for simplicity |
| Spring Boot Actuator | 3.4.x | Health, metrics endpoints | `/actuator/health` (required by PRD); `/actuator/prometheus` for metric scraping |
| Apache PDFBox | **3.0.7** | PDF text extraction | Latest stable (2026-03-09); Java-native; no system dependencies; used for FR-2.2 text extraction |
| Apache POI (XSSF) | **5.3.x** | Excel `.xlsx` generation | Standard Java Excel library; XSSF for modern `.xlsx`; required for FR-6 reports |
| Spring Boot Mail (JavaMailSender) | bundled | SMTP email dispatch | Framework-level abstraction; configures against any SMTP relay (SES, SendGrid, Mailgun) via `spring.mail.*` properties |
| AWS SDK for Java v2 (`software.amazon.awssdk:s3`) | **2.26+** | S3-compatible object storage | AWS-native SDK; also works against MinIO/Localstack via `endpointOverride`; required for FR-10 |
| Spring AI | **1.1.6** | ML model integration | Official Spring abstraction for OpenAI, Anthropic, Bedrock, Ollama; unified `ChatClient` API; allows model swap without code changes |
| Logback + Logstash JSON encoder | Logback 1.5.x | Structured JSON logging | Spring Boot default logger; add `logstash-logback-encoder` for JSON logs consumable by log aggregators |

### Core Technologies — Frontend

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16 (App Router) | SSR/SSG framework | PRD-mandated; App Router enables React Server Components, streaming, route-level code splitting |
| React | 19 | UI library | Server Components + `use()` hook + improved Suspense; compatible with App Router |
| TypeScript | 5.x | Type safety | Non-negotiable for a codebase of this size (~80+ API endpoints, 16 controllers) |
| Tailwind CSS | 4.x | Utility-first CSS | CSS-first config in v4; **note: no `tailwind.config.js`** — use `@import "tailwindcss"` in CSS |
| Radix UI | Latest | Accessible component primitives | Dialog, Dropdown, Tabs, Toast, Tooltip, AlertDialog — all with focus trap + ARIA + keyboard nav out of the box |
| Recharts | 2.x | Data visualization | Composable React charts; required for FR-4 dashboards (accuracy trend, confidence histogram, volume area chart) |
| react-hook-form | 7.x | Form state management | Uncontrolled form approach = best performance; integrates directly with zod via `zodResolver` |
| zod | 3.x | Schema validation | Runtime type checking; share schemas between client and server via a `types/` package |
| sonner | Latest | Toast notifications | Minimal API; rich colors; top-right positioning as per PRD; better DX than `react-hot-toast` |
| next-themes | Latest | Light/dark mode | CSS variable strategy; no flash of unstyled content with App Router |
| lucide-react | Latest | Icon library | PRD-specified; tree-shaken; consistent design language |
| Axios or native `fetch` | — | HTTP client | Use native `fetch` + React Server Actions for server-side; Axios on client side if interceptors needed for auth header injection |
| TanStack Query (React Query) | 5.x | Client-side data fetching | Server state management, automatic cache invalidation, optimistic updates; recommended for classification list, dashboard polling |

### Database

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| H2 (dev) | 2.x | In-memory dev database | Zero config; Flyway-compatible; fast iteration |
| PostgreSQL (prod) | 16+ | Production RDBMS | ACID-compliant; `pgvector` extension available for future embedding search; best JSON support for `layout (JSON)` columns in `DashboardConfiguration`; strong Hibernate dialect |
| MySQL (prod fallback) | 8.0+ | Alternative production RDBMS | PRD lists as alternative; acceptable but Postgres preferred for JSON and full-text indexing of classification fields |

### Object Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| AWS SDK v2 S3 Client | 2.26+ | Primary storage abstraction | Works against AWS S3, MinIO (via `endpointOverride`), LocalStack; single SDK, provider-agnostic via config |
| LocalStack (dev) | Latest | Local S3 emulation | Docker-based; enables full S3 integration testing without AWS credentials |

**Decision:** Use `software.amazon.awssdk:s3` regardless of final storage provider. Configure `endpointOverride` + `pathStyleAccessEnabled` for non-AWS (MinIO/Azure-compatible) backends. This decouples provider selection from code.

### Email

| Technology | Purpose | Why Recommended |
|------------|---------|-----------------|
| `spring-boot-starter-mail` | SMTP dispatch | Spring Boot auto-configures `JavaMailSender`; configure via `spring.mail.host/port/username/password` env vars only |
| AWS SES (recommended provider) | SMTP relay | HIPAA-eligible; high deliverability; simple SMTP interface or SES API v2; ~$0.10/1000 emails |
| SendGrid (alternative) | SMTP relay | Strong deliverability; more developer-friendly dashboard; HIPAA BAA available on paid plans |

**Dev strategy:** Use MailHog (Docker) as local SMTP trap — emails caught and displayable without actual delivery.

### ML / AI Integration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Spring AI | **1.1.6** | ML model abstraction layer | Unified `ChatClient` API across OpenAI, Anthropic, AWS Bedrock, Ollama, etc.; structured output to POJOs; no lock-in to one provider |
| OpenAI GPT-4o (recommended initial) | API | Classification model | Best classification accuracy; supports structured JSON output; configurable via Spring AI `OpenAiChatModel` |
| Anthropic Claude 3.5 Sonnet (alternative) | API | Classification model | Strong at structured extraction; competitive accuracy; supported by Spring AI |
| AWS Bedrock (alternative) | API | Classification model | HIPAA-eligible BAA available; private data processing stays in AWS boundary; supported by Spring AI |
| Keyword fallback engine | — | Pre-ML classification | Implement as a Java `ClassificationStrategy` interface; activated when ML confidence < threshold or model is unavailable |

**Integration pattern:**
```java
// Service layer uses interface — implementation can be ML or keyword
public interface ClassificationStrategy {
    ClassificationResult classify(String extractedText, List<TaxonomyCategory> taxonomy);
}

// Spring AI implementation
@Component
@ConditionalOnProperty("app.classification.strategy=openai")
public class SpringAiClassificationStrategy implements ClassificationStrategy {
    private final ChatClient chatClient;
    // Uses ChatClient.prompt() → structured output → ClassificationResult POJO
}

// Keyword fallback
@Component
@ConditionalOnProperty("app.classification.strategy=keyword")
public class KeywordClassificationStrategy implements ClassificationStrategy { ... }
```

### Observability

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Spring Boot Actuator | 3.4.x | `/actuator/health`, `/actuator/metrics`, `/actuator/prometheus` | Auto-configured; PRD-required health endpoint; exposes DB connection health, queue depth |
| Micrometer | 1.13.x (bundled with Boot 3.4) | Metrics instrumentation | `@Timed`, `@Counted` annotations; `MeterRegistry` for custom classification throughput counters |
| Micrometer Tracing + OpenTelemetry | 1.3.x | Distributed tracing | `ObservationRegistry` for cross-cutting traces; OTLP exporter for Jaeger/Zipkin/Grafana Tempo |
| Logback + logstash-logback-encoder | 1.5.x / 7.x | Structured JSON logs | Add `net.logstash.logback:logstash-logback-encoder:7.4` to emit JSON for log aggregators |
| Prometheus + Grafana (recommended stack) | — | Metrics visualization | Pull-based scraping from `/actuator/prometheus`; Grafana dashboards for classification throughput, override rate, model confidence |

### Supporting Libraries — Backend

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `io.jsonwebtoken:jjwt-api` + `jjwt-impl` + `jjwt-jackson` | **0.12.x** | JWT creation/validation | Used in auth service; generates signed JWTs; parses inbound tokens; **use Nimbus from Spring Security for validation, JJWT for generation** |
| `org.apache.tika:tika-core` | 2.x | MIME type detection | Validates uploaded files are actually PDFs before processing; prevents content-type spoofing |
| `org.springframework.boot:spring-boot-starter-validation` | bundled | Bean Validation (Jakarta) | `@Valid` + `@NotNull`/`@Size` on DTOs; integrates with Spring MVC for automatic 400 responses |
| `com.fasterxml.jackson.core:jackson-databind` | 2.17.x | JSON serialization | Bundled with Boot; register `JavaTimeModule` for LocalDateTime serialization |
| `org.flywaydb:flyway-core` + `flyway-database-postgresql` | 10.x | Schema migrations | Version-controlled migrations; runs automatically on startup |
| Lombok | 1.18.x | Boilerplate reduction | `@Data`, `@Builder`, `@Slf4j`; optional but reduces entity/DTO noise — use judiciously |
| `net.logstash.logback:logstash-logback-encoder` | 7.4 | JSON log formatting | Emit structured logs for ELK/Grafana Loki consumption |
| `org.springdoc:springdoc-openapi-starter-webmvc-ui` | **2.5.x** | OpenAPI / Swagger UI | Auto-generates API docs from controllers; `/swagger-ui.html` endpoint in dev; critical for 80+ endpoint surface |

### Supporting Libraries — Frontend

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | 5.x | Server state management | All API calls with caching, background refresh, optimistic updates; especially classification list polling |
| `date-fns` | 3.x | Date manipulation | PRD has date range filters on analytics; lightweight alternative to moment.js |
| `react-dropzone` | Latest | File upload dropzone | PDF upload dialog (FR-2.1) with drag-and-drop, type restriction, size display |
| `@radix-ui/react-*` | Latest | Component primitives | Dialog, DropdownMenu, Tabs, Toast, Tooltip, AlertDialog, Select, Checkbox — all WCAG compliant |
| `class-variance-authority` (CVA) | Latest | Component variant management | Utility for managing Tailwind variant classes; pairs with shadcn/ui component pattern |
| `clsx` + `tailwind-merge` | Latest | Class merging | Conditional Tailwind class application without conflicts |
| `axios` | 1.7.x | HTTP client | Interceptors for auth header injection + 401 redirect; configure baseURL from env |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Docker + Docker Compose | Local dev environment | PostgreSQL, MailHog, LocalStack, backend all in compose; no local installs required |
| Testcontainers | Integration test infrastructure | Real PostgreSQL and S3-compatible containers in tests; auto-started; required for Phase 5 |
| JUnit 5 + Spring Boot Test | Backend unit/integration testing | `@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest` slices; MockMvc for controller tests |
| Mockito | Backend mocking | Mock ML service, S3 client in unit tests |
| WireMock | External service stubbing | Stub ML API responses in integration tests without hitting real API |
| Vitest | Frontend unit testing | Jest-compatible; Vite-native; faster than Jest for Next.js projects |
| Playwright or Cypress | E2E testing | Playwright recommended: native TypeScript, faster, more reliable CI execution; test upload → classify flow |
| ESLint + Prettier | Frontend linting/formatting | Use `eslint-config-next` + `@typescript-eslint/recommended`; Prettier for formatting |
| Checkstyle or SpotBugs | Backend code quality | Optional but valuable for HIPAA-adjacent code quality |
| GitHub Actions | CI/CD | Standard; run test suites + build Docker image + push to registry on merge to main |

---

## Installation

### Backend (Maven) — Key Dependencies

```xml
<!-- Core -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- JWT -->
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-api</artifactId>
  <version>0.12.6</version>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-impl</artifactId>
  <version>0.12.6</version>
  <scope>runtime</scope>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-jackson</artifactId>
  <version>0.12.6</version>
  <scope>runtime</scope>
</dependency>

<!-- PDF Extraction -->
<dependency>
  <groupId>org.apache.pdfbox</groupId>
  <artifactId>pdfbox</artifactId>
  <version>3.0.7</version>
</dependency>

<!-- Optional: Tika for MIME validation -->
<dependency>
  <groupId>org.apache.tika</groupId>
  <artifactId>tika-core</artifactId>
  <version>2.9.2</version>
</dependency>

<!-- Excel Generation -->
<dependency>
  <groupId>org.apache.poi</groupId>
  <artifactId>poi-ooxml</artifactId>
  <version>5.3.0</version>
</dependency>

<!-- S3 / Object Storage -->
<dependency>
  <groupId>software.amazon.awssdk</groupId>
  <artifactId>s3</artifactId>
  <version>2.26.31</version>
</dependency>

<!-- Spring AI -->
<dependency>
  <groupId>org.springframework.ai</groupId>
  <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
  <version>1.1.6</version>
</dependency>
<!-- Use Bedrock or Anthropic starters as alternatives -->

<!-- DB -->
<dependency>
  <groupId>org.postgresql</groupId>
  <artifactId>postgresql</artifactId>
  <scope>runtime</scope>
</dependency>
<dependency>
  <groupId>com.h2database</groupId>
  <artifactId>h2</artifactId>
  <scope>runtime</scope>
</dependency>
<dependency>
  <groupId>org.flywaydb</groupId>
  <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
  <groupId>org.flywaydb</groupId>
  <artifactId>flyway-database-postgresql</artifactId>
</dependency>

<!-- Observability -->
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>

<!-- OpenAPI -->
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>2.5.0</version>
</dependency>

<!-- Structured Logging -->
<dependency>
  <groupId>net.logstash.logback</groupId>
  <artifactId>logstash-logback-encoder</artifactId>
  <version>7.4</version>
</dependency>

<!-- Testing -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>postgresql</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>com.github.tomakehurst</groupId>
  <artifactId>wiremock-jre8-standalone</artifactId>
  <version>3.0.4</version>
  <scope>test</scope>
</dependency>
```

### Frontend (npm)

```bash
# Core (already PRD-chosen)
npm install next@16 react@19 react-dom@19 typescript
npm install tailwindcss@4 @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install recharts lucide-react react-hook-form zod sonner next-themes

# Add these gaps
npm install @tanstack/react-query axios react-dropzone date-fns
npm install class-variance-authority clsx tailwind-merge
npm install @hookform/resolvers   # zod integration with react-hook-form

# Dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D playwright eslint prettier eslint-config-next
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Spring AI `ChatClient` | Direct OpenAI HTTP client | If project locks to a single provider and Spring AI's abstraction adds unwanted overhead — unlikely for this domain |
| Apache PDFBox 3.x | Apache Tika PDF extraction | Tika is better for multi-format detection; PDFBox is more direct for PDF-specific text extraction with layout preservation |
| AWS SDK v2 (S3) | MinIO SDK or Azure SDK | Only if provider is definitively confirmed as MinIO or Azure; AWS SDK v2 works against MinIO via `endpointOverride` — keep it |
| Flyway | Liquibase | Liquibase is XML/YAML heavy; Flyway's SQL-first approach is simpler for this team size |
| PostgreSQL | MySQL 8 | PostgreSQL preferred for `jsonb` columns (widget configs, filter configs), full-text search on classification fields; MySQL 8 is acceptable fallback |
| TanStack Query | SWR | TanStack Query has more control (mutations, pagination, optimistic updates); SWR is simpler but limited for this analytics use case |
| Playwright | Cypress | Playwright: faster, TypeScript-native, better parallel test execution; Cypress has better DX for simple apps |
| jjwt 0.12.x | Spring Security OAuth2 Resource Server (Nimbus) | For validation of inbound JWTs, Spring Security Nimbus is the right tool. jjwt is for *generating* tokens in the auth controller |
| Vitest | Jest | Vitest is Vite-native; same API as Jest; significantly faster cold starts in CI |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `javax.servlet.*` (Jakarta EE 8) | Spring Boot 3.x requires Jakarta EE 9+ (`jakarta.servlet.*`); mixing causes `ClassNotFoundException` at startup | Import `jakarta.servlet.*` throughout |
| `io.jsonwebtoken:jjwt` older than 0.12.x | APIs changed significantly in 0.12; older versions have known signature validation weaknesses | `jjwt-api:0.12.6` + impl |
| PDFBox 2.x | PDFBox 3.x had a major API revamp; 2.x is in maintenance mode; 3.0.7 is current stable | Apache PDFBox 3.0.7 |
| Apache POI HSSf (`.xls`) | `.xls` is the obsolete binary format; limit is 65,536 rows; Excel 2003 only | Apache POI XSSF (`.xlsx`) — 1M+ rows, modern format |
| HttpOnly cookie-only JWT storage | PRD requires stateless JWT via `Authorization: Bearer` header; cookie approach changes CORS strategy significantly | `Authorization: Bearer <jwt>` header per PRD |
| WebFlux / Reactor | Nothing in the PRD needs reactive streams; mixing imperative Spring MVC and reactive creates complexity | Synchronous Spring MVC with virtual threads (Java 21 Project Loom) for I/O concurrency |
| `moment.js` | 300KB bundle; deprecated in favor of smaller alternatives | `date-fns` (modular, tree-shaken) or native `Intl` |
| `lodash` (full bundle) | 70KB bundle; most utilities available natively in ES2020+ | Native JS or cherry-picked `lodash-es` imports |
| Class-based React components | Legacy API; no Server Component support | Function components + hooks only |
| Flyway community edition for production Oracle | Not applicable here, but avoid switching DB vendors mid-project | Stick to PostgreSQL or MySQL as declared |

---

## Stack Patterns by Variant

**If ML provider is AWS Bedrock (HIPAA compliance desired):**
- Use `spring-ai-bedrock-converse-spring-boot-starter` instead of `spring-ai-openai-spring-boot-starter`
- All data stays in AWS; enables HIPAA BAA
- SES for email (already HIPAA-eligible with BAA)
- AWS S3 for storage (HIPAA BAA available)

**If ML provider is OpenAI:**
- Use `spring-ai-openai-spring-boot-starter`
- Ensure Business Associate Agreement is in place before processing real patient research data
- Consider: PHI may be in extracted PDF text → verify data classification with compliance team

**If storage is on-premise / air-gapped (NFS fallback):**
- Replace AWS SDK S3 with local filesystem + `StorageService` interface
- Use MinIO as local S3 emulator in Docker for dev regardless — same SDK, same code

**If PostgreSQL is chosen (recommended):**
- Enable `jsonb` column type for `DashboardConfiguration.layout`, `ReportConfiguration.columns/filters`, `FilterConfiguration.criteria`
- Use PostgreSQL full-text search (`tsvector`) on `Classification.projectSummary` for search performance at scale

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Spring Boot 3.4.x | Spring Security 6.4.x | Boot 3.4 manages Security version; don't override |
| Spring Boot 3.4.x | Hibernate 6.6.x | Managed by Boot; `hibernate.dialect` auto-detected |
| Spring Boot 3.4.x | Flyway 10.x | Flyway 10+ required for Boot 3.2+; add `flyway-database-postgresql` for PostgreSQL |
| Spring AI 1.1.6 | Spring Boot 3.4.x | Spring AI 1.1.x is compatible with Boot 3.3/3.4; Spring AI 2.0 targets Boot 4.x |
| Apache PDFBox 3.0.7 | Java 11+ | PDFBox 3.x requires Java 11 minimum; Java 21 is fine |
| jjwt 0.12.x | Java 11+ | API stable since 0.12.0; no breaking changes in patch versions |
| AWS SDK v2 2.26+ | Java 11+ | SDK v2 is the current generation; v1 is in maintenance mode |
| Tailwind CSS 4.x | Next.js 16 | Tailwind 4 uses CSS-first config; no `tailwind.config.js`; use `@import "tailwindcss"` in global CSS |
| React 19 + Next.js 16 | TanStack Query 5.x | TanStack Query 5 supports `use()` hook; compatible with Server Components boundary pattern |
| Flyway 10.x | H2 2.x | Flyway 10 supports H2 out of the box; no extra driver needed |
| springdoc-openapi 2.5.x | Spring Boot 3.4.x | springdoc 2.x is required for Spring Boot 3.x; springdoc 1.x is Boot 2.x only |

---

## Healthcare-Specific Notes

**HIPAA Alignment (LOW confidence — compliance review required):**
- No healthcare-specific Java libraries are needed for this platform. PCORI taxonomy classification of *research plans* (not patient records) is the domain — PHI may exist in plan documents but the system itself stores classification metadata, not clinical data.
- Key technical controls already in PRD: HTTPS-only, JWT auth, BCrypt, account lockout, audit trail (uploadedBy, reviewedBy, timestamps, override reason), soft-delete.
- Additional controls to add in Phase 5: encrypted S3 bucket (SSE-S3 or SSE-KMS), RDS encryption at rest, VPC isolation, CloudTrail logging if on AWS.
- No ICD-10 coding library is needed — taxonomy is managed as `TaxonomyCategory` entities in the DB with hierarchical structure. Seed data from PCORI directly.

**Audit Trail Pattern:**
- Every `Classification` entity includes: `uploadedBy`, `uploadedAt`, `reviewedBy`, `reviewedAt`, `overrideReason`, `modelVersion`
- Use Spring Data JPA `@CreatedBy`/`@LastModifiedBy` with `AuditorAware<String>` bean that reads from `SecurityContextHolder`
- This satisfies the PRD's auditability requirement without a separate audit library

---

## Sources

- Spring AI 1.1.6 — https://docs.spring.io/spring-ai/reference/index.html (official docs, verified 2026-05-20)
- Apache PDFBox 3.0.7 — https://pdfbox.apache.org/ (official release, 2026-03-09)
- Spring Security 7.0.5 (JWT) — https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html (official docs)
- Apache POI XSSF — https://poi.apache.org/components/spreadsheet/quick-guide.html (official docs)
- Spring Boot Actuator Observability — https://docs.spring.io/spring-boot/reference/actuator/observability.html (Boot 4.0.6 current, 3.4 confirmed compatible)
- Spring Boot Mail — https://docs.spring.io/spring-boot/reference/io/email.html (official docs)
- AWS SDK for Java v2 S3 — https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/java_s3_code_examples.html (official AWS docs)
- Tailwind CSS 4 — training data + official changelog (LOW confidence on specific breaking changes — verify `@import` syntax at setup)
- jjwt 0.12.x version — MEDIUM confidence (training data; verify latest patch on Maven Central)

---

*Stack research for: PCORI Research Analytics Platform — healthcare research AI classification*
*Researched: 2026-05-20*
