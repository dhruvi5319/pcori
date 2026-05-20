---

## 6. Technology Stack

### 6.1 Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Java | 21 (LTS) | Virtual threads (Project Loom); record types; pattern matching |
| **Framework** | Spring Boot | 3.4.x | Application framework; auto-configuration; starter ecosystem |
| **Security** | Spring Security | 6.4.x (managed) | `SecurityFilterChain`; BCrypt; `@PreAuthorize` method-level RBAC |
| **JWT** | jjwt-api / jjwt-impl / jjwt-jackson | 0.12.6 | JWT generation (HS512); Spring Security Nimbus for validation |
| **Persistence** | Spring Data JPA + Hibernate | 3.x / 6.6.x (managed) | ORM; `@SQLRestriction` soft-delete; `JpaSpecificationExecutor` |
| **Connection Pool** | HikariCP | 5.x (managed) | Fastest JDBC pool; auto-configured |
| **Migrations** | Flyway | 10.x + flyway-database-postgresql | Versioned schema; `V{n}__*.sql` + `R__*.sql` repeatable |
| **Validation** | Spring Validation (Jakarta Bean) | managed | `@Valid` on DTOs; automatic 400 |
| **Async** | Spring `@Async` + `ThreadPoolTaskExecutor` | managed | Classification pipeline; `CallerRunsPolicy`; `SecurityContextPropagatingDecorator` |
| **PDF Extraction** | Apache PDFBox | 3.0.7 | `Loader.loadPDF()` (3.x API; 2.x `PDDocument.load()` removed) |
| **MIME Detection** | Apache Tika | 2.9.2 | Byte-level MIME type detection (not extension-only) |
| **Excel Generation** | Apache POI XSSF / SXSSFWorkbook | 5.3.x | XSSF for ≤1,000 rows; SXSSFWorkbook streaming for >1,000 rows |
| **ML Abstraction** | Spring AI | 1.1.6 | Unified `ChatClient` API; OpenAI / Anthropic / Bedrock; structured output |
| **Object Storage** | AWS SDK for Java v2 (`software.amazon.awssdk:s3`) | 2.26+ | S3 + MinIO/LocalStack via `endpointOverride` |
| **Email** | Spring Boot Mail (JavaMailSender) | managed | SMTP relay; MailHog dev; SES/SendGrid prod |
| **Database** | PostgreSQL | 16 | Dev: Docker Compose; Prod: RDS or managed PostgreSQL |
| **JSON** | Jackson Databind + Jackson JavaTimeModule | 2.17.x (managed) | JSON serialization; ISO-8601 dates |
| **API Docs** | SpringDoc OpenAPI | 2.5.x | Swagger UI in dev; disabled in prod |
| **Observability** | Spring Boot Actuator + Micrometer | managed | `/actuator/health`; `/actuator/prometheus`; `@Timed` counters |
| **Logging** | Logback + logstash-logback-encoder | 1.5.x / 7.4 | Structured JSON logs for log aggregators |
| **Boilerplate** | Lombok | 1.18.x | `@Data`, `@Builder`, `@Slf4j`, `@RequiredArgsConstructor` |

### 6.2 Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js App Router | 16 | SSR/RSC shells + `'use client'` TanStack Query islands |
| **UI Library** | React | 19 | Server Components; `use()` hook; improved Suspense |
| **Language** | TypeScript | 5.x | Type safety across 80+ API endpoints |
| **Styling** | Tailwind CSS | 4.x | CSS-first config; `@import "tailwindcss"` — no `tailwind.config.js` |
| **Components** | Radix UI Primitives | latest | Dialog, Dropdown, Tabs, Tooltip, Select — WCAG 2.1 AA out-of-box |
| **Variant Management** | class-variance-authority (CVA) + clsx + tailwind-merge | latest | Tailwind class composition |
| **Charts** | Recharts | 2.x | LineChart, BarChart, AreaChart; `isAnimationActive={false}` in prod |
| **Server State** | TanStack Query (React Query) | v5 | Cache, background refresh, `useMutation` invalidation; explicit `staleTime` per resource |
| **HTTP Client** | Axios | 1.7.x | Single instance; auth interceptor (JWT header); 401 redirect handler |
| **Forms** | react-hook-form + zod | 7.x / 3.x | Uncontrolled forms; field-level inline errors; `zodResolver` |
| **File Upload** | react-dropzone | latest | Drag-and-drop PDF upload; type restriction; size display |
| **Toasts** | sonner | latest | Top-right, rich colors, lightweight |
| **Icons** | lucide-react | latest | Tree-shaken icon set |
| **Theming** | next-themes | latest | Light/dark with CSS variable strategy; no FOUC |
| **Date Utils** | date-fns | 3.x | Date range formatting/manipulation; tree-shaken |
| **Fonts** | Geist (`next/font`) | latest | Zero CLS; system font from Vercel |
| **Markdown** | react-markdown + rehype-sanitize | latest | Help Center article rendering; XSS prevention |

### 6.3 Infrastructure & Tooling

| Tool | Version | Purpose |
|---|---|---|
| Docker | — | Backend container (multi-stage Dockerfile) |
| Docker Compose | — | Dev stack: PostgreSQL 16, MailHog, LocalStack, backend |
| LocalStack | latest | S3 emulation in dev (`http://localhost:4566`) |
| MailHog | latest | SMTP trap in dev (port 1025/8025) |
| Testcontainers | latest | Real PostgreSQL + S3-compatible containers in CI integration tests |
| JUnit 5 + Spring Boot Test | managed | `@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest` slices |
| Mockito | managed | Mock ML service, S3 client in unit tests |
| WireMock | 3.x | Stub ML API responses in integration tests |
| Vitest | latest | Frontend unit tests (Jest-compatible; Vite-native) |
| Playwright | latest | E2E tests: upload → classify → override flow |
| ESLint + Prettier | latest | `eslint-config-next` + `@typescript-eslint/recommended` |
| GitHub Actions | — | CI: test + build + Docker push on merge to main |

### 6.4 Key Maven Dependencies (pom.xml excerpt)

```xml
<properties>
    <java.version>21</java.version>
    <spring-ai.version>1.1.6</spring-ai.version>
    <jjwt.version>0.12.6</jjwt.version>
    <pdfbox.version>3.0.7</pdfbox.version>
    <tika.version>2.9.2</tika.version>
    <poi.version>5.3.0</poi.version>
    <aws-sdk.version>2.26.31</aws-sdk.version>
    <springdoc.version>2.5.0</springdoc.version>
    <logstash.version>7.4</logstash.version>
</properties>

<dependencies>
    <!-- Spring Boot Starters -->
    <dependency><groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-mail</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId></dependency>

    <!-- JWT -->
    <dependency><groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId><version>${jjwt.version}</version></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId><version>${jjwt.version}</version>
        <scope>runtime</scope></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId><version>${jjwt.version}</version>
        <scope>runtime</scope></dependency>

    <!-- PDF -->
    <dependency><groupId>org.apache.pdfbox</groupId>
        <artifactId>pdfbox</artifactId><version>${pdfbox.version}</version></dependency>
    <dependency><groupId>org.apache.tika</groupId>
        <artifactId>tika-core</artifactId><version>${tika.version}</version></dependency>

    <!-- Excel -->
    <dependency><groupId>org.apache.poi</groupId>
        <artifactId>poi-ooxml</artifactId><version>${poi.version}</version></dependency>

    <!-- S3 -->
    <dependency><groupId>software.amazon.awssdk</groupId>
        <artifactId>s3</artifactId><version>${aws-sdk.version}</version></dependency>
    <dependency><groupId>software.amazon.awssdk</groupId>
        <artifactId>s3-transfer-manager</artifactId><version>${aws-sdk.version}</version></dependency>

    <!-- Spring AI (swap starter for provider) -->
    <dependency><groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
        <version>${spring-ai.version}</version></dependency>

    <!-- Database -->
    <dependency><groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId><scope>runtime</scope></dependency>
    <dependency><groupId>org.flywaydb</groupId>
        <artifactId>flyway-core</artifactId></dependency>
    <dependency><groupId>org.flywaydb</groupId>
        <artifactId>flyway-database-postgresql</artifactId></dependency>

    <!-- Observability -->
    <dependency><groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId></dependency>

    <!-- OpenAPI (dev only via profile exclusion) -->
    <dependency><groupId>org.springdoc</groupId>
        <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        <version>${springdoc.version}</version></dependency>

    <!-- Logging -->
    <dependency><groupId>net.logstash.logback</groupId>
        <artifactId>logstash-logback-encoder</artifactId>
        <version>${logstash.version}</version></dependency>

    <!-- Utilities -->
    <dependency><groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId><optional>true</optional></dependency>
    <dependency><groupId>com.fasterxml.jackson.datatype</groupId>
        <artifactId>jackson-datatype-jsr310</artifactId></dependency>

    <!-- Test -->
    <dependency><groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
    <dependency><groupId>org.testcontainers</groupId>
        <artifactId>postgresql</artifactId><scope>test</scope></dependency>
    <dependency><groupId>com.github.tomakehurst</groupId>
        <artifactId>wiremock-jre8-standalone</artifactId>
        <version>3.0.4</version><scope>test</scope></dependency>
</dependencies>
```

### 6.5 Key npm Dependencies

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "@radix-ui/react-tabs": "latest",
    "@radix-ui/react-tooltip": "latest",
    "@radix-ui/react-select": "latest",
    "@radix-ui/react-checkbox": "latest",
    "recharts": "^2.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "@hookform/resolvers": "latest",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.7.0",
    "react-dropzone": "latest",
    "sonner": "latest",
    "lucide-react": "latest",
    "next-themes": "latest",
    "date-fns": "^3.0.0",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "react-markdown": "latest",
    "rehype-sanitize": "latest"
  },
  "devDependencies": {
    "vitest": "latest",
    "@testing-library/react": "latest",
    "@testing-library/jest-dom": "latest",
    "@playwright/test": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "@typescript-eslint/eslint-plugin": "latest",
    "@typescript-eslint/parser": "latest",
    "prettier": "latest"
  }
}
```

### 6.6 Version Compatibility Notes

| Pairing | Status | Notes |
|---|---|---|
| Spring Boot 3.4.x + Spring Security 6.4.x | Managed | Do not override Security version in pom.xml |
| Spring Boot 3.4.x + Hibernate 6.6.x | Managed | `hibernate.dialect` auto-detected from driver |
| Spring Boot 3.4.x + Flyway 10.x | Managed | `flyway-database-postgresql` jar required |
| Spring AI 1.1.6 + Spring Boot 3.4.x | Compatible | Spring AI 2.0 targets Boot 4.x; do not upgrade AI version |
| PDFBox 3.0.7 + Java 21 | Supported | Uses `Loader.loadPDF()`; 2.x `PDDocument.load()` was removed |
| jjwt 0.12.6 + Java 21 | Supported | API stable since 0.12.0 |
| AWS SDK v2 2.26+ + LocalStack | Compatible | Set `endpointOverride` + `forcePathStyle(true)` |
| Tailwind CSS 4.x + Next.js 16 | Compatible | No `tailwind.config.js`; use `@import "tailwindcss"` in globals.css |
| TanStack Query v5 + React 19 | Compatible | `use()` hook supported |

---

*Section 6 of 7 — TechArch-PCORI.md*
