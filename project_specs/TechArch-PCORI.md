# Technical Architecture — PCORI Research Analytics Platform

| Field | Value |
|---|---|
| **Project Acronym** | PCORI |
| **Document Version** | 1.0 |
| **Date** | 2026-05-20 |
| **Architecture Pattern** | Layered Monolith (Controller → Service → Repository) with async classification pipeline |
| **Deployment Model** | Containerized — Docker (backend), Docker Compose (dev stack) |
| **Source Documents** | PRD-PCORI.md v1.0, FRD-PCORI.md v1.0 |

---

## 1. Architectural Overview

### 1.1 Pattern Decision

The PCORI platform uses a **layered monolith** architecture: a single Spring Boot 3.4 backend with domain-per-package organization, paired with a Next.js 16 App Router frontend. This pattern is appropriate for v1 because:

- Single-tenant scope eliminates distributed coordination complexity
- ~80 API endpoints across 16 controllers is manageable within one process
- Classification pipeline uses in-process `@Async` threading (adequate for projected v1 volume)
- Stateless JWT auth enables horizontal scaling behind a load balancer when needed

All ML and storage integrations are placed behind swappable interfaces (`ClassificationStrategy`, `StorageService`, `EmailService`) so provider decisions remain deferrable without architectural rework.

### 1.2 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER CLIENT                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      Next.js 16 App Router                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  ┌───────────┐  │ │
│  │  │ RSC Pages    │  │ 'use client' │  │  TanStack     │  │  Axios +  │  │ │
│  │  │ (layout,     │  │  Islands     │  │  Query v5     │  │  Auth     │  │ │
│  │  │  loading)    │  │ (tables,     │  │  Cache        │  │  Interceptor  │ │
│  │  │              │  │  forms,      │  │               │  │  (JWT hdr)│  │ │
│  │  │              │  │  charts)     │  │               │  │           │  │ │
│  │  └──────────────┘  └──────────────┘  └───────────────┘  └───────────┘  │ │
│  │                                                                         │ │
│  │  Tailwind CSS 4 · Radix UI · react-hook-form + zod · Recharts          │ │
│  │  next-themes (dark/light) · lucide-react · sonner · react-dropzone     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │  HTTPS  /api/*
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│              REVERSE PROXY / LOAD BALANCER (Nginx or AWS ALB)                │
│                         HTTPS termination · CORS                             │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SPRING BOOT 3.4 BACKEND (Java 21)                     │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │              SecurityFilterChain  ←  JwtAuthFilter                     │  │
│  │         (JWT validate → SecurityContext → @PreAuthorize RBAC)          │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  auth/   │ │classifi- │ │taxonomy/ │ │pipeline/ │ │analytics/reports/│  │
│  │Controller│ │cation/   │ │Controller│ │Controller│ │notifications/    │  │
│  │          │ │Controller│ │          │ │          │ │help/ files/      │  │
│  │          │ │          │ │          │ │          │ │filters/          │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────────┬────────┘  │
│       │            │            │            │               │           │  │
│  ┌────▼────────────▼────────────▼────────────▼───────────────▼──────────┐   │
│  │                         SERVICE LAYER                                 │   │
│  │  AuthService · ClassificationService · TaxonomyService               │   │
│  │  PipelineStatusService · AnalyticsService · ReportService            │   │
│  │  NotificationService · HelpService · FileService · UserService       │   │
│  └──────────────────────────┬──────────────────────┬─────────────────────┘  │
│                             │                      │                        │
│  ┌──────────────────────────▼──────────────────┐   │                        │
│  │         ClassificationPipeline (@Async)      │   │                        │
│  │  ┌────────────────────────────────────────┐  │   │                        │
│  │  │ classificationExecutor                 │  │   │                        │
│  │  │ (ThreadPoolTaskExecutor, core=4,max=8) │  │   │                        │
│  │  │ + SecurityContextPropagatingDecorator  │  │   │                        │
│  │  └────────────────────────────────────────┘  │   │                        │
│  │  Stage 1: PdfExtractionStage  (PDFBox 3.x)   │   │                        │
│  │  Stage 2: ClassificationStage (Strategy)     │   │                        │
│  │  Stage 3: PersistResultStage  (JPA)          │   │                        │
│  └─────────────────────────────────────────────┘   │                        │
│                                                     │                        │
│  ┌──────────────────────────────────────────────────▼─────────────────────┐  │
│  │                        REPOSITORY LAYER (Spring Data JPA)              │  │
│  │  UserRepository · ClassificationRepository · TaxonomyRepository       │  │
│  │  (JpaRepository + JpaSpecificationExecutor for dynamic filtering)     │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                       INTEGRATION ADAPTERS                              │  │
│  │  StorageService ─── S3StorageService (AWS SDK v2)                      │  │
│  │  ClassificationStrategy ─── SpringAiStrategy / KeywordStrategy        │  │
│  │  EmailService ─── JavaMailSender (SMTP relay)                          │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└──────────┬───────────────────┬───────────────────┬────────────────────────────┘
           │                   │                   │
    ┌──────▼──────┐   ┌────────▼────────┐   ┌──────▼──────────────┐
    │ PostgreSQL  │   │  S3 / MinIO /   │   │ Spring AI ChatClient │
    │ 16          │   │  LocalStack     │   │ (OpenAI / Bedrock /  │
    │ (HikariCP + │   │  (object store) │   │  Keyword fallback)   │
    │  Flyway)    │   │                 │   │                      │
    └─────────────┘   └─────────────────┘   └──────────────────────┘
                                                      │
                                             ┌────────▼───────────┐
                                             │  SMTP Relay        │
                                             │ (MailHog dev /     │
                                             │  SES/SendGrid prod)│
                                             └────────────────────┘
```

### 1.3 Deployment Topology

#### Development (Docker Compose)

```
docker-compose.yml
├── backend     (Spring Boot JAR / Dockerfile)   port 8080
├── frontend    (Next.js dev server)              port 3000
├── postgres    (PostgreSQL 16)                   port 5432
├── mailhog     (SMTP trap + web UI)              port 1025/8025
└── localstack  (S3 emulation)                    port 4566
```

#### Production (recommended)

```
Internet → AWS ALB (HTTPS)
              ├── /api/*   → Spring Boot ECS Task (or EC2)
              │              └─ HikariCP → RDS PostgreSQL
              │              └─ AWS SDK v2 → S3 bucket (private)
              │              └─ Spring AI → ML API (OpenAI/Bedrock)
              │              └─ JavaMailSender → SES SMTP
              └── /*       → Next.js (Vercel or ECS)
```

Key production constraints:
- `spring.jpa.hibernate.ddl-auto=validate` — never `create-drop`
- JWT secret from `JWT_SECRET` env var (min 64 chars / 512-bit)
- S3 bucket: all public access blocked; SSE-S3 encryption; IAM role access only
- Swagger UI disabled via `springdoc.swagger-ui.enabled=false` in production profile
- `/actuator/*` restricted to internal IP or `ADMIN` role; only `health` and `prometheus` exposed externally

### 1.4 Classification Upload Data Flow

```
Reviewer (Browser)
    │  POST /api/classifications/upload (multipart PDF)
    ▼
JwtAuthFilter → validates Bearer token → sets SecurityContext
    ▼
ClassificationController.upload()
    │  @PreAuthorize("hasRole('REVIEWER')")
    ▼
ClassificationService.uploadAndClassify()
    │  1. FileValidator.validate() — Apache Tika MIME check (byte-level)
    │  2. Size check (≤ MAX_UPLOAD_SIZE_MB)
    │  3. StorageService.upload() — stream directly to S3
    │  4. UploadedFile record created
    │  5. planId generated: RP-{YYYY}-{seq}
    │  6. Classification record saved (status=PENDING)
    │  7. pipeline.process(id) — @Async, returns immediately
    ▼
HTTP 202 Accepted { classificationId, planId, status:"PENDING" }

[Async — classificationExecutor thread pool]
    ▼
ClassificationPipeline.process(id)
    │  status → PROCESSING / stage "EXTRACTING"
    │  PdfExtractionStage.extract()  ← PDFBox Loader.loadPDF()
    │  Text quality gate (char count, printable ratio)
    │  ── quality fail → status=NEEDS_REVIEW, extractionWarning set
    │
    │  status → PROCESSING / stage "CLASSIFYING"
    │  ClassificationStrategy.classify(text, taxonomy)
    │  ── keyword: match against active taxonomy keywords
    │  ── ML: Spring AI ChatClient → structured output POJO
    │  ── confidenceScore < threshold → NEEDS_REVIEW
    │  ── confidenceScore >= threshold → CLASSIFIED
    │
    │  PersistResultStage.persist()
    │  status → CLASSIFIED / NEEDS_REVIEW / FAILED
    ▼
Classification record updated

[Frontend polls GET /api/classifications/{id} every 5–10s via TanStack Query]
    ▼
PENDING → PROCESSING → CLASSIFIED visible in UI
```

---

*Section 1 of 7 — TechArch-PCORI.md*
---

## 2. Component Architecture

### 2.1 Backend Package Structure

```
src/main/java/com/pcori/platform/
│
├── config/
│   ├── SecurityConfig.java          # SecurityFilterChain, CORS, CSRF-off, permitAll for /api/auth/**
│   ├── AsyncConfig.java             # @EnableAsync + classificationExecutor ThreadPoolTaskExecutor bean
│   ├── S3Config.java                # S3Client bean (endpointOverride for LocalStack/MinIO)
│   ├── JpaAuditConfig.java          # @EnableJpaAuditing + SecurityAuditorAware bean
│   └── OpenApiConfig.java           # SpringDoc config; disabled in prod profile
│
├── security/
│   ├── JwtAuthFilter.java           # OncePerRequestFilter: extract/validate JWT → SecurityContext
│   ├── JwtService.java              # generateToken(), validateToken(), extractUsername(), extractClaims()
│   ├── JwtAuthEntryPoint.java       # 401 response for unauthenticated requests (RFC 7807)
│   ├── UserDetailsServiceImpl.java  # Loads UserDetails from UserRepository by username
│   └── SecurityContextPropagatingDecorator.java  # TaskDecorator: copies SecurityContext to async threads
│
├── domain/
│   │
│   ├── auth/
│   │   ├── AuthController.java      # /api/auth — register, login, logout, refresh, verify-email, forgot/reset-password
│   │   ├── AuthService.java         # login logic, JWT issuance, lockout, password reset, email verification
│   │   └── dto/                     # RegisterRequest, LoginRequest, LoginResponse, RefreshRequest, etc.
│   │
│   ├── user/
│   │   ├── User.java                # @Entity extends AuditableEntity; BCrypt password_hash; RBAC fields
│   │   ├── Role.java                # @Entity — REVIEWER, MANAGER, TAXONOMY_ADMIN, ADMIN, VIEWER
│   │   ├── Permission.java          # @Entity — atomic capability (resource:action)
│   │   ├── RefreshToken.java        # @Entity — server-side refresh token with expiry
│   │   ├── UserRepository.java      # JpaRepository<User,UUID> + custom finders
│   │   ├── RoleRepository.java      # JpaRepository<Role,UUID>
│   │   ├── UserService.java         # @Service, @Transactional — user CRUD, role assignment, status toggle
│   │   ├── UserController.java      # /api/users — CRUD, search, PATCH status
│   │   └── dto/                     # UserResponse, CreateUserRequest, UpdateUserRequest, etc.
│   │
│   ├── classification/
│   │   ├── Classification.java      # @Entity @SQLRestriction("deleted_at IS NULL"); core aggregate
│   │   ├── ClassificationStatus.java # enum: PENDING, PROCESSING, CLASSIFIED, FAILED, NEEDS_REVIEW
│   │   ├── ClassificationRepository.java  # JpaRepository + JpaSpecificationExecutor
│   │   ├── ClassificationSpecification.java # Specification builder for dynamic filtering
│   │   ├── ClassificationService.java     # uploadAndClassify(), applyOverride(), retry(), search()
│   │   ├── ClassificationController.java  # /api/classifications
│   │   ├── PlanIdGenerator.java           # RP-YYYY-### atomic sequence (AtomicInteger per year)
│   │   ├── pipeline/
│   │   │   ├── ClassificationPipeline.java   # @Async orchestrator: runs on classificationExecutor
│   │   │   ├── PdfExtractionStage.java       # PDFBox 3.x Loader.loadPDF(); text quality gate
│   │   │   ├── ClassificationStage.java      # delegates to ClassificationStrategy interface
│   │   │   ├── PersistResultStage.java       # persists result + final status update
│   │   │   └── PipelineRecovery.java         # @EventListener(ApplicationReadyEvent) — re-queues stuck PROCESSING
│   │   └── dto/                     # ClassificationResponse, UploadMetadataRequest, ManualOverrideRequest, etc.
│   │
│   ├── taxonomy/
│   │   ├── TaxonomyCategory.java    # @Entity self-referential parent_id; @SQLRestriction
│   │   ├── TaxonomyRepository.java  # findByParentIsNull, findByCode, search()
│   │   ├── TaxonomyService.java     # CRUD, cascading deactivate, tree assembly, circular-ref guard
│   │   ├── TaxonomyController.java  # /api/taxonomy — tree, children, search, active, CRUD, PATCH status
│   │   └── dto/                     # TaxonomyCategoryDto, TaxonomyTreeNode, etc.
│   │
│   ├── analytics/
│   │   ├── AnalyticsService.java    # accuracy-trend, category-accuracy, confidence-dist, volume, overrides, model-perf
│   │   ├── AnalyticsController.java # /api/analytics
│   │   ├── DashboardService.java    # metrics, range-metrics, configuration CRUD
│   │   ├── DashboardController.java # /api/dashboard
│   │   ├── DashboardConfiguration.java # @Entity per-user widget layout JSON
│   │   ├── DashboardMetric.java     # @Entity time-series pre-aggregation
│   │   └── dto/                     # MetricsResponse, AnalyticsRangeRequest, etc.
│   │
│   ├── report/
│   │   ├── ExcelReportService.java  # XSSF / SXSSFWorkbook; chunked query (500 rows); async large exports
│   │   ├── ReportService.java       # template CRUD, async report lifecycle, pre-signed download URL
│   │   ├── ReportConfiguration.java # @Entity saved template
│   │   ├── ExcelReport.java         # @Entity artifact — status, file_path
│   │   ├── FilterConfiguration.java # @Entity saved filter set
│   │   ├── ReportRepository.java
│   │   ├── ExcelController.java     # /api/excel
│   │   ├── ReportController.java    # /api/reports
│   │   ├── FilterController.java    # /api/filters
│   │   └── dto/                     # GenerateReportRequest, ReportResponse, FilterCriteria, etc.
│   │
│   ├── pipeline/
│   │   ├── PipelineStatusService.java  # stage health, stuck-record surfacing, run history, control actions
│   │   ├── PipelineController.java     # /api/pipeline
│   │   ├── PipelineRun.java            # @Entity optional audit log
│   │   ├── PipelineLog.java            # @Entity event log
│   │   └── dto/                        # PipelineStatusResponse, StageCardDto, etc.
│   │
│   ├── notification/
│   │   ├── Notification.java           # @Entity per-user events
│   │   ├── NotificationPreference.java # @Entity per-user per-event-type per-channel
│   │   ├── NotificationService.java    # create(), markRead(), preferences, email dispatch
│   │   ├── NotificationController.java # /api/notifications
│   │   └── dto/                        # NotificationDto, PreferenceUpdateRequest, etc.
│   │
│   ├── help/
│   │   ├── HelpArticle.java            # @Entity Markdown content
│   │   ├── Faq.java                    # @Entity FAQ accordion item
│   │   ├── DocumentationFeedback.java  # @Entity per-user per-article feedback
│   │   ├── HelpService.java            # article CRUD, FAQ CRUD, feedback upsert, search
│   │   ├── HelpController.java         # /api/help
│   │   └── dto/                        # ArticleDto, FaqDto, FeedbackRequest, etc.
│   │
│   └── files/
│       ├── UploadedFile.java           # @Entity S3 object metadata
│       ├── UploadedFileRepository.java
│       ├── FileService.java            # metadata retrieval, pre-signed URL generation, soft-delete
│       ├── FileController.java         # /api/files
│       └── dto/                        # FileMetadataResponse, DownloadUrlResponse, etc.
│
├── integration/
│   ├── storage/
│   │   ├── StorageService.java         # interface: store(), getDownloadUrl(), delete()
│   │   └── S3StorageService.java       # AWS SDK v2 S3Client; endpointOverride for LocalStack
│   ├── ml/
│   │   ├── ClassificationStrategy.java    # interface: classify(text, taxonomy) → ClassificationResult
│   │   ├── SpringAiStrategy.java          # @ConditionalOnProperty(strategy=openai|anthropic|bedrock)
│   │   │                                  # ChatClient.prompt().user(prompt).call().entity(ClassificationResult)
│   │   └── KeywordStrategy.java           # @ConditionalOnProperty(strategy=keyword) [default]
│   └── email/
│       ├── EmailService.java              # interface: sendVerification(), sendPasswordReset(), sendNotification()
│       └── SmtpEmailService.java          # JavaMailSender implementation; MailHog dev, SES prod
│
└── common/
    ├── audit/
    │   ├── AuditableEntity.java           # @MappedSuperclass: createdAt, updatedAt, @CreatedBy, @LastModifiedBy
    │   └── SecurityAuditorAware.java      # AuditorAware<String> reads from SecurityContextHolder
    ├── exception/
    │   ├── GlobalExceptionHandler.java    # @RestControllerAdvice → RFC 7807 Problem Details
    │   └── DomainExceptions.java          # ResourceNotFoundException, ClassificationException, InvalidFileTypeException, etc.
    ├── dto/
    │   ├── ApiResponse.java               # generic wrapper
    │   ├── PagedResponse.java             # {content, page, size, totalElements, totalPages}
    │   └── ErrorResponse.java             # RFC 7807: {type, title, status, detail, timestamp, errors}
    └── util/
        ├── PaginationUtil.java            # Pageable param helpers
        └── FileValidator.java             # Apache Tika MIME detection
```

### 2.2 Backend Component Responsibilities

| Component | Responsibility | Key Design Rule |
|---|---|---|
| `SecurityFilterChain` | JWT extraction, validation, SecurityContext population, RBAC | `JwtAuthFilter` added before `UsernamePasswordAuthenticationFilter`; `FilterRegistrationBean.setEnabled(false)` prevents double-registration |
| `@RestController` | HTTP boundary only: parse request, validate inputs, delegate to service, serialize response | Zero business logic; `@Valid` on DTOs; `@AuthenticationPrincipal UserDetails` for current user |
| `@Service` | Business logic, transaction boundary (`@Transactional`), orchestrates repos and integrations | Services never call other services' private methods; cross-service calls via constructor injection |
| `@Repository` | Data access, query construction; soft-delete scoped via `@SQLRestriction("deleted_at IS NULL")` | `JpaSpecificationExecutor` for filter/sort; native SQL analytics queries add `AND deleted_at IS NULL` explicitly |
| `ClassificationPipeline` | Async 3-stage processor (extract → classify → persist) | `@Async("classificationExecutor")`; `SecurityContextPropagatingDecorator` ensures audit fields populated |
| `StorageService` | S3-agnostic file storage abstraction | Interface impl via `@ConditionalOnProperty("storage.provider")`; `endpointOverride` for LocalStack/MinIO |
| `ClassificationStrategy` | Pluggable ML vs keyword classifier | Interface; `KeywordStrategy` default; `SpringAiStrategy` activated via `app.classification.strategy=openai` |
| `AuditableEntity` | Cross-cutting audit fields | `@MappedSuperclass`; `@EntityListeners(AuditingEntityListener.class)`; populated automatically by Spring Data JPA |
| `GlobalExceptionHandler` | Centralized error handling | Maps all domain exceptions to RFC 7807 JSON; never leaks stack traces in production |
| `PipelineRecovery` | Startup recovery for stuck PROCESSING records | `@EventListener(ApplicationReadyEvent.class)`; queries `status=PROCESSING AND updated_at < now - STUCK_TIMEOUT` |

### 2.3 Async Configuration (classificationExecutor)

```java
// config/AsyncConfig.java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "classificationExecutor")
    public ThreadPoolTaskExecutor classificationExecutor() {
        ThreadPoolTaskExecutor exec = new ThreadPoolTaskExecutor();
        exec.setCorePoolSize(4);             // 4 concurrent classifications
        exec.setMaxPoolSize(8);              // burst up to 8
        exec.setQueueCapacity(50);           // queue buffer
        exec.setThreadNamePrefix("classification-");
        exec.setRejectedExecutionHandler(new CallerRunsPolicy()); // prevents silent drops
        exec.setTaskDecorator(new SecurityContextPropagatingDecorator()); // audit fields
        exec.initialize();
        return exec;
    }
}

// security/SecurityContextPropagatingDecorator.java
public class SecurityContextPropagatingDecorator implements TaskDecorator {

    @Override
    public Runnable decorate(Runnable runnable) {
        // Capture SecurityContext from the submitting (HTTP request) thread
        SecurityContext context = SecurityContextHolder.getContext();
        return () -> {
            try {
                SecurityContextHolder.setContext(context);
                runnable.run();
            } finally {
                SecurityContextHolder.clearContext();
            }
        };
    }
}
```

### 2.4 JWT Filter Chain

```java
// config/SecurityConfig.java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // enables @PreAuthorize at service layer
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final JwtAuthEntryPoint jwtAuthEntryPoint;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)          // stateless API
            .sessionManagement(s -> s
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/auth/verify-email").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**")
                    .access("@environment.acceptsProfiles('dev')")  // dev only
                .anyRequest().authenticated())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(e -> e.authenticationEntryPoint(jwtAuthEntryPoint))
            .build();
    }

    // Prevents double-registration with Servlet container
    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilterRegistration(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> reg = new FilterRegistrationBean<>(filter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
```

**RBAC is enforced at the service layer** (not controller-only) via `@PreAuthorize`:

```java
// Example service-layer RBAC
@Service
public class ClassificationService {

    @PreAuthorize("hasRole('REVIEWER')")
    public Classification uploadAndClassify(...) { ... }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteClassification(UUID id) { ... }

    @PreAuthorize("hasRole('MANAGER')")
    public ClassificationStatistics getStatistics() { ... }
}
```

### 2.5 Frontend Component Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root: QueryClientProvider, ThemeProvider, Toaster (sonner)
│   ├── page.tsx                      # Landing page (public)
│   ├── (auth)/
│   │   ├── login/page.tsx            # Login form (react-hook-form + zod)
│   │   └── signup/page.tsx           # Self-registration form
│   └── (protected)/
│       ├── layout.tsx                # Single auth guard: reads JWT; redirect to /login if missing
│       ├── dashboard/
│       │   ├── page.tsx              # RSC shell; Suspense-wraps KpiCards, RecentTable
│       │   └── loading.tsx           # Skeleton grid
│       ├── classifications/
│       │   ├── page.tsx              # RSC shell + 'use client' ClassificationsTable
│       │   └── loading.tsx
│       ├── taxonomy/page.tsx
│       ├── data-pipeline/page.tsx
│       ├── analytics/page.tsx
│       ├── reports/page.tsx
│       ├── users/page.tsx            # ADMIN only
│       ├── settings/page.tsx
│       └── help/page.tsx
│
├── components/
│   ├── ui/                           # Radix UI primitives wrapped with CVA variants
│   │   ├── button.tsx, dialog.tsx, badge.tsx, input.tsx
│   │   ├── select.tsx, checkbox.tsx, tabs.tsx, tooltip.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Header.tsx                # Notification bell, user avatar, dark-mode toggle
│   │   ├── Sidebar.tsx               # Nav links; mobile drawer below 768px
│   │   └── Footer.tsx
│   ├── classifications/
│   │   ├── ClassificationsTable.tsx  # 'use client'; useClassifications(); filterable/sortable
│   │   ├── UploadPlanDialog.tsx      # react-dropzone; useMutation → POST /upload; progress bar
│   │   ├── ManualOverrideDialog.tsx  # Four taxonomy dimensions; overrideReason required
│   │   └── ViewClassificationDialog.tsx
│   ├── dashboard/
│   │   ├── KpiCards.tsx              # 'use client'; useDashboardMetrics(); skeleton on load
│   │   ├── RecentClassificationsTable.tsx
│   │   └── StatusBreakdown.tsx
│   ├── analytics/
│   │   ├── AccuracyTrendChart.tsx    # Recharts LineChart; isAnimationActive={false}
│   │   ├── ConfidenceDistribution.tsx  # Recharts BarChart histogram; "AI Confidence"
│   │   ├── CategoryAccuracyChart.tsx   # Recharts horizontal BarChart
│   │   └── ProcessingVolumeChart.tsx   # Recharts AreaChart
│   ├── taxonomy/
│   │   ├── TaxonomyTreePane.tsx      # Two-pane: tree sidebar + detail panel
│   │   └── TaxonomyCategoryForm.tsx
│   └── shared/
│       ├── DataTable.tsx             # Reusable paginated table
│       ├── StatusBadge.tsx           # Color + text label (never color-only — WCAG)
│       ├── DateRangePicker.tsx       # date-fns; cascades to all chart queries
│       └── SkeletonCard.tsx
│
├── hooks/
│   ├── useClassifications.ts         # useQuery wrapper; CLASSIFICATION_KEYS; 30s staleTime
│   ├── useDashboardMetrics.ts        # staleTime 60s; conditional refetch when PROCESSING exists
│   ├── useAuth.ts                    # reads JWT from localStorage; exposes claims; handles expiry
│   ├── useTaxonomy.ts
│   └── useNotifications.ts           # polls unread-count every 30s
│
├── lib/
│   ├── api.ts                        # Axios singleton: baseURL env, auth interceptor, 401 handler
│   ├── query-client.ts               # TanStack QueryClient: retry 2, staleTime per resource
│   └── validators/
│       ├── upload.schema.ts          # zod: file type, title, notes
│       ├── override.schema.ts        # zod: overrideReason required
│       └── user.schema.ts
│
└── types/
    ├── classification.ts             # Classification, ClassificationStatus, ClassificationResponse
    ├── taxonomy.ts                   # TaxonomyCategory, TaxonomyTreeNode
    ├── user.ts                       # User, Role, Permission
    ├── dashboard.ts                  # MetricsResponse, DashboardConfiguration
    └── api.ts                        # ApiResponse<T>, PagedResponse<T>, ErrorResponse
```

### 2.6 Frontend Data Layer

**Axios singleton with auth interceptor:**

```typescript
// lib/api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token')
      window.location.href = '/login?reason=session-expired'
    }
    return Promise.reject(error)
  }
)
```

**TanStack Query pattern:**

```typescript
// hooks/useClassifications.ts
export const CLASSIFICATION_KEYS = {
  all: ['classifications'] as const,
  list: (f: ClassificationFilters) => [...CLASSIFICATION_KEYS.all, 'list', f] as const,
  detail: (id: string) => [...CLASSIFICATION_KEYS.all, 'detail', id] as const,
}

export function useClassifications(filters: ClassificationFilters) {
  return useQuery({
    queryKey: CLASSIFICATION_KEYS.list(filters),
    queryFn: () => api.get('/api/classifications', { params: filters }).then(r => r.data),
    staleTime: 30_000,
    // Conditional polling: only when any record is PROCESSING
    refetchInterval: (query) => {
      const data = query.state.data as PagedResponse<Classification> | undefined
      const hasProcessing = data?.content.some(c => c.status === 'PROCESSING')
      return hasProcessing ? 5_000 : false
    },
  })
}
```

---

*Section 2 of 7 — TechArch-PCORI.md*
---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
┌──────────────────┐         ┌────────────────────┐
│      users       │─────────│     user_roles      │
│ PK id            │  1    * │ PK user_id (FK)     │
│    username      │         │ PK role_id (FK)     │
│    email         │         └─────────┬───────────┘
│    password_hash │                   │ *
│    is_active     │         ┌─────────▼───────────┐
│    is_email_     │         │       roles         │
│    verified      │         │ PK id               │
│    locked_until  │         │    name             │
│    login_attempts│         │    description      │
└──┬───────────────┘         └─────────┬───────────┘
   │                                   │ *
   │ 1                       ┌─────────▼───────────┐
   │                         │  role_permissions   │
   │                         │ PK role_id (FK)     │
   │                         │ PK permission_id (FK│
   │                         └─────────┬───────────┘
   │                                   │ *
   │                         ┌─────────▼───────────┐
   │                         │    permissions      │
   │                         │ PK id               │
   │                         │    name             │
   │                         │    resource, action │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│   uploaded_files    │
   │  (uploaded_by)          │ PK id               │
   │                         │    filename (S3 key)│
   │  1                      │    original_name    │
   ├────────────────────────►│    content_type     │
   │  (uploaded_by)          │    size             │
   │                         │    path             │
   │  1                      │    uploaded_by (FK) │
   ├────────────────────────►└──────────┬──────────┘
   │  (reviewed_by)                     │ 1
   │                                    │
   │                         ┌──────────▼──────────┐
   │                         │   classifications   │
   │                         │ PK id               │
   │                         │    plan_id (unique) │
   │                         │    title, status    │
   │                         │    pcc, taxonomy_*  │
   │                         │    confidence_score │
   │                         │    model_version    │
   │                         │    text_preview     │
   │                         │    extraction_warning│
   │                         │    override_reason  │
   │                         │    uploaded_by (FK) │
   │                         │    reviewed_by (FK) │
   │                         │    file_id (FK)     │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│taxonomy_categories  │
   │                         │ PK id               │
   │                         │    code (unique/sib)│
   │                         │    name, description│
   │                         │    parent_id → self │
   │                         │    level (0–3)      │
   │                         │    is_active        │
   │                         │    display_order    │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│dashboard_config     │
   │                         │ PK id               │
   │                         │    user_id (unique) │
   │                         │    layout (JSONB)   │
   │                         └─────────────────────┘
   │
   │                         ┌─────────────────────┐
   │                         │  dashboard_metrics  │
   │                         │ PK id               │
   │                         │    name, value      │
   │                         │    category         │
   │                         │    recorded_at      │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│ report_configurations│
   │  (owner_id)             │ PK id               │
   │                         │    name, owner_id   │
   │                         │    columns (JSONB)  │
   │                         │    filters (JSONB)  │
   │                         └──────────┬──────────┘
   │                                    │ 1
   │                         ┌──────────▼──────────┐
   │                         │    excel_reports    │
   │                         │ PK id               │
   │                         │    config_id (FK)   │
   │                         │    status (enum)    │
   │                         │    file_path        │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│filter_configurations │
   │  (user_id)              │ PK id               │
   │                         │    user_id, name    │
   │                         │    criteria (JSONB) │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│   notifications     │
   │  (user_id)              │ PK id               │
   │                         │    user_id, type    │
   │                         │    title, message   │
   │                         │    is_read          │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│notification_prefs   │
   │  (user_id)              │ PK id               │
   │                         │    user_id, event   │
   │                         │    channel, enabled │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│   help_articles     │
   │  (created_by)           │ PK id               │
   │                         │    title, slug      │
   │                         │    category, content│
   │                         │    published_at     │
   │                         └──────────┬──────────┘
   │                                    │ 1
   │                         ┌──────────▼──────────┐
   │                         │documentation_feedbk │
   │                         │ PK id               │
   │                         │    article_id (FK)  │
   │                         │    user_id (FK)     │
   │                         │    helpful, comment │
   │                         └─────────────────────┘
   │
   │                         ┌─────────────────────┐
   │                         │       faqs          │
   │                         │ PK id               │
   │                         │    question, answer │
   │                         │    category         │
   │                         │    display_order    │
   │                         └─────────────────────┘
   │
   │                         ┌─────────────────────┐
   │                         │   pipeline_runs     │
   │                         │ PK id               │
   │                         │    status           │
   │                         │    started_at       │
   │                         │    completed_at     │
   │                         └──────────┬──────────┘
   │                                    │ 1
   │                         ┌──────────▼──────────┐
   │                         │   pipeline_logs     │
   │                         │ PK id               │
   │                         │    run_id (FK)      │
   │                         │    level, message   │
   │                         │    logged_at        │
   │                         └─────────────────────┘
```

### 3.2 AuditableEntity Base Class

All domain entities extend `AuditableEntity`. Fields automatically populated by Spring Data JPA Auditing:

```java
// common/audit/AuditableEntity.java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity {

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;        // username from SecurityContext

    @LastModifiedBy
    @Column(name = "last_modified_by")
    private String lastModifiedBy;
}
```

### 3.3 Complete Database DDL (Flyway — V1__initial_schema.sql)

```sql
-- ============================================================
-- PCORI Research Analytics Platform — V1__initial_schema.sql
-- Database: PostgreSQL 16
-- Conventions:
--   - All PKs: UUID DEFAULT gen_random_uuid()
--   - All timestamps: TIMESTAMPTZ NOT NULL DEFAULT NOW()
--   - Soft-delete: deleted_at TIMESTAMPTZ DEFAULT NULL
--   - Audit: created_by / last_modified_by UUID FK → users(id)
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- §1  AUTH — users, roles, permissions
-- ──────────────────────────────────────────────────────────

CREATE TABLE users (
    id                          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_users_email        ON users(email)    WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username     ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_reset_token  ON users(password_reset_token)
    WHERE password_reset_token IS NOT NULL;
CREATE INDEX idx_users_verify_token ON users(email_verification_token)
    WHERE email_verification_token IS NOT NULL;
CREATE INDEX idx_users_locked       ON users(locked_until)
    WHERE locked_until IS NOT NULL;

CREATE TABLE refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_token_value  ON refresh_tokens(token) WHERE revoked = FALSE;
CREATE INDEX idx_refresh_token_user   ON refresh_tokens(user_id) WHERE revoked = FALSE;

CREATE TABLE roles (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE permissions (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
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
    role_id       UUID NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ──────────────────────────────────────────────────────────
-- §2  TAXONOMY
-- ──────────────────────────────────────────────────────────

CREATE TABLE taxonomy_categories (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code             VARCHAR(50)  NOT NULL,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    parent_id        UUID         REFERENCES taxonomy_categories(id) ON DELETE RESTRICT,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    level            INTEGER      NOT NULL DEFAULT 0,
    display_order    INTEGER      NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by       UUID         REFERENCES users(id),
    last_modified_by UUID         REFERENCES users(id),
    deleted_at       TIMESTAMPTZ,
    UNIQUE (code, parent_id)  -- code unique within sibling group (allows NULL parent)
);

CREATE INDEX idx_taxonomy_code   ON taxonomy_categories(code)      WHERE deleted_at IS NULL;
CREATE INDEX idx_taxonomy_parent ON taxonomy_categories(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_taxonomy_active ON taxonomy_categories(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_taxonomy_level  ON taxonomy_categories(level)     WHERE deleted_at IS NULL AND is_active = TRUE;

-- Full-text search vector (generated + stored)
ALTER TABLE taxonomy_categories ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english',
            COALESCE(code, '') || ' ' ||
            COALESCE(name, '') || ' ' ||
            COALESCE(description, ''))
    ) STORED;
CREATE INDEX idx_taxonomy_fts ON taxonomy_categories USING GIN(search_vector);

-- ──────────────────────────────────────────────────────────
-- §3  FILES + CLASSIFICATIONS
-- ──────────────────────────────────────────────────────────

CREATE TABLE uploaded_files (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    filename         VARCHAR(500) NOT NULL,   -- S3 object key
    original_name    VARCHAR(255) NOT NULL,
    content_type     VARCHAR(100) NOT NULL,
    size             BIGINT       NOT NULL,
    path             VARCHAR(500) NOT NULL,   -- S3 object key
    uploaded_by      UUID         NOT NULL REFERENCES users(id),
    uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_files_uploaded_by ON uploaded_files(uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_uploaded_at ON uploaded_files(uploaded_at DESC) WHERE deleted_at IS NULL;

CREATE TYPE classification_status AS ENUM (
    'PENDING', 'PROCESSING', 'CLASSIFIED', 'FAILED', 'NEEDS_REVIEW'
);

CREATE TABLE classifications (
    id                   UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id              VARCHAR(20)           NOT NULL UNIQUE,  -- RP-YYYY-###
    title                VARCHAR(255),
    status               classification_status NOT NULL DEFAULT 'PENDING',
    -- Taxonomy assignment fields
    pcc                  VARCHAR(255),
    taxonomy_category    VARCHAR(255),
    taxonomy_code        VARCHAR(100),
    taxonomy_subcode     VARCHAR(100),
    primary_condition    VARCHAR(255),
    secondary_conditions TEXT,
    icd_codes            TEXT,
    -- Extracted content (truncated; never full text)
    project_summary      TEXT,
    population_setting   TEXT,
    intervention         TEXT,
    comparator           TEXT,
    primary_outcome      TEXT,
    secondary_outcomes   TEXT,
    text_preview         VARCHAR(500),         -- max 500 chars; no PHI logged
    extraction_warning   VARCHAR(255),
    -- Classification metadata
    confidence_score     DECIMAL(5,4),         -- 0.0000–1.0000
    model_version        VARCHAR(100),         -- 'keyword-v1' or ML provider version
    processing_time_ms   INTEGER,
    -- File reference
    file_id              UUID                  REFERENCES uploaded_files(id),
    file_name            VARCHAR(255),
    file_size            BIGINT,
    file_path            VARCHAR(500),         -- S3 object key
    notes                TEXT,
    -- Review trail
    uploaded_by          UUID                  NOT NULL REFERENCES users(id),
    uploaded_at          TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    classified_at        TIMESTAMPTZ,
    reviewed_by          UUID                  REFERENCES users(id),
    reviewed_at          TIMESTAMPTZ,
    override_reason      TEXT,
    error_message        TEXT,
    -- AuditableEntity base fields
    created_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    created_by           UUID                  REFERENCES users(id),
    last_modified_by     UUID                  REFERENCES users(id),
    deleted_at           TIMESTAMPTZ
);

CREATE INDEX idx_class_status      ON classifications(status)       WHERE deleted_at IS NULL;
CREATE INDEX idx_class_plan_id     ON classifications(plan_id)      WHERE deleted_at IS NULL;
CREATE INDEX idx_class_uploaded_by ON classifications(uploaded_by)  WHERE deleted_at IS NULL;
CREATE INDEX idx_class_uploaded_at ON classifications(uploaded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_class_pcc         ON classifications(pcc)          WHERE deleted_at IS NULL;
CREATE INDEX idx_class_processing  ON classifications(status, updated_at)
    WHERE status = 'PROCESSING' AND deleted_at IS NULL;  -- startup recovery query
CREATE INDEX idx_class_reviewed_by ON classifications(reviewed_by)
    WHERE reviewed_by IS NOT NULL AND deleted_at IS NULL;

-- Full-text search on plan_id + title
ALTER TABLE classifications ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english',
            COALESCE(plan_id, '') || ' ' || COALESCE(title, ''))
    ) STORED;
CREATE INDEX idx_class_fts ON classifications USING GIN(search_vector);

-- ──────────────────────────────────────────────────────────
-- §4  DASHBOARD
-- ──────────────────────────────────────────────────────────

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
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100)  NOT NULL,
    value       DECIMAL(15,4) NOT NULL,
    category    VARCHAR(100),
    recorded_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dash_metrics_name_date ON dashboard_metrics(name, recorded_at DESC);
CREATE INDEX idx_dash_metrics_category  ON dashboard_metrics(category, recorded_at DESC);

-- ──────────────────────────────────────────────────────────
-- §5  REPORTS
-- ──────────────────────────────────────────────────────────

CREATE TYPE report_status AS ENUM ('GENERATING', 'READY', 'FAILED');

CREATE TABLE report_configurations (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    owner_id    UUID         NOT NULL REFERENCES users(id),
    columns     JSONB        NOT NULL DEFAULT '[]',
    filters     JSONB        NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ,
    UNIQUE (owner_id, name)   -- template name unique per user (among non-deleted)
);

CREATE INDEX idx_report_config_owner ON report_configurations(owner_id) WHERE deleted_at IS NULL;

CREATE TABLE excel_reports (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_id UUID          REFERENCES report_configurations(id),
    status           report_status NOT NULL DEFAULT 'GENERATING',
    generated_at     TIMESTAMPTZ,
    file_path        VARCHAR(500),  -- S3 object key; null until READY
    error_message    TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_excel_reports_config ON excel_reports(configuration_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_excel_reports_status ON excel_reports(status) WHERE deleted_at IS NULL;

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

CREATE INDEX idx_filter_config_user ON filter_configurations(user_id) WHERE deleted_at IS NULL;

-- ──────────────────────────────────────────────────────────
-- §6  NOTIFICATIONS
-- ──────────────────────────────────────────────────────────

CREATE TYPE notification_type AS ENUM (
    'CLASSIFICATION_COMPLETED',
    'CLASSIFICATION_FAILED',
    'CLASSIFICATION_NEEDS_REVIEW',
    'PIPELINE_FAILURE',
    'OVERRIDE_SUBMITTED'
);

CREATE TYPE notification_channel AS ENUM ('IN_APP', 'EMAIL');

CREATE TABLE notifications (
    id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        notification_type NOT NULL,
    title       VARCHAR(255)      NOT NULL,
    message     TEXT              NOT NULL,
    is_read     BOOLEAN           NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read)         WHERE deleted_at IS NULL;
CREATE INDEX idx_notif_user_date   ON notifications(user_id, created_at DESC) WHERE deleted_at IS NULL;

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

-- ──────────────────────────────────────────────────────────
-- §7  HELP CENTER
-- ──────────────────────────────────────────────────────────

CREATE TABLE help_articles (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(255) NOT NULL,
    slug             VARCHAR(100) NOT NULL UNIQUE,
    category         VARCHAR(100) NOT NULL,
    content          TEXT         NOT NULL,   -- Markdown; sanitized in frontend
    published_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by       UUID         REFERENCES users(id),
    last_modified_by UUID         REFERENCES users(id),
    deleted_at       TIMESTAMPTZ
);

ALTER TABLE help_articles ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, ''))
    ) STORED;
CREATE INDEX idx_help_fts  ON help_articles USING GIN(search_vector);
CREATE INDEX idx_help_slug ON help_articles(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_help_cat  ON help_articles(category) WHERE deleted_at IS NULL;

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

CREATE INDEX idx_faq_category ON faqs(category) WHERE deleted_at IS NULL;

CREATE TABLE documentation_feedback (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id   UUID        NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    helpful      BOOLEAN     NOT NULL,
    comment      TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (article_id, user_id)   -- upsert: one feedback per user per article
);

CREATE INDEX idx_feedback_article ON documentation_feedback(article_id);

-- ──────────────────────────────────────────────────────────
-- §8  PIPELINE (optional persistence)
-- ──────────────────────────────────────────────────────────

CREATE TABLE pipeline_runs (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    status            VARCHAR(20) NOT NULL,
    started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at      TIMESTAMPTZ,
    records_processed INTEGER     NOT NULL DEFAULT 0,
    failed_count      INTEGER     NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pipeline_runs_status ON pipeline_runs(status, started_at DESC);

CREATE TABLE pipeline_logs (
    id        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id    UUID          REFERENCES pipeline_runs(id) ON DELETE CASCADE,
    level     VARCHAR(10)   NOT NULL,     -- INFO, WARN, ERROR
    message   VARCHAR(1000) NOT NULL,     -- never contains extracted text
    logged_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pipeline_logs_run ON pipeline_logs(run_id, logged_at DESC);
```

### 3.4 Flyway Migration Strategy

```
src/main/resources/db/migration/
├── V1__initial_schema.sql          # All tables above; PostgreSQL-specific syntax from V1
├── V2__seed_roles_permissions.sql  # INSERT roles (REVIEWER, MANAGER, TAXONOMY_ADMIN, ADMIN, VIEWER)
│                                   # INSERT permissions (classifications:write, taxonomy:manage, etc.)
│                                   # INSERT role_permissions
└── R__seed_taxonomy.sql            # Repeatable; PCORI taxonomy upsert on (code, parent_id)
                                    # Re-runs on any content change; idempotent
```

**Key Flyway rules:**
- `spring.flyway.enabled=true` in all profiles
- `spring.jpa.hibernate.ddl-auto=validate` in production (never `create-drop`)
- Dev uses PostgreSQL 16 via Docker Compose — H2 is eliminated to prevent dialect gaps
- `flyway-database-postgresql` artifact required for Flyway 10.x + PostgreSQL
- `R__seed_taxonomy.sql` uses `INSERT ... ON CONFLICT (code, parent_id) DO UPDATE` (upsert)
- All migrations are forward-only; no `undo` scripts needed for v1

### 3.5 Entity Summary

| Entity | Table | Soft-Delete | Extends AuditableEntity | Notes |
|---|---|---|---|---|
| User | `users` | yes (`deleted_at`) | yes | BCrypt hash; RBAC FK |
| RefreshToken | `refresh_tokens` | no | no | Server-side revocation |
| Role | `roles` | yes | no | Seeded via V2 migration |
| Permission | `permissions` | no | no | Seeded via V2 migration |
| UserRole (join) | `user_roles` | no | no | Many-to-many |
| RolePermission (join) | `role_permissions` | no | no | Many-to-many |
| TaxonomyCategory | `taxonomy_categories` | yes | yes | Self-referential; GIN FTS |
| UploadedFile | `uploaded_files` | yes | no | S3 object key in `path` |
| Classification | `classifications` | yes | yes | Core aggregate; GIN FTS |
| DashboardConfiguration | `dashboard_configurations` | yes | no | Per-user JSONB layout |
| DashboardMetric | `dashboard_metrics` | no | no | Time-series pre-aggregation |
| ReportConfiguration | `report_configurations` | yes | no | Named template |
| ExcelReport | `excel_reports` | yes | no | Artifact; S3 path when READY |
| FilterConfiguration | `filter_configurations` | yes | no | Saved filter set |
| Notification | `notifications` | yes | no | Per-user events |
| NotificationPreference | `notification_preferences` | no | no | Per-user per-channel |
| HelpArticle | `help_articles` | yes | yes | Markdown; GIN FTS |
| FAQ | `faqs` | yes | no | Accordion item |
| DocumentationFeedback | `documentation_feedback` | no | no | Upsert per user/article |
| PipelineRun | `pipeline_runs` | no | no | Optional audit persistence |
| PipelineLog | `pipeline_logs` | no | no | Event log; no PHI |

---

*Section 3 of 7 — TechArch-PCORI.md*
---

## 4. API Design

### 4.1 Global Conventions

| Convention | Value |
|---|---|
| Base URL | `/api` |
| Auth | `Authorization: Bearer <jwt>` on all protected endpoints |
| Content-Type | `application/json` (except file upload: `multipart/form-data`) |
| Error format | RFC 7807 Problem Details: `{type, title, status, detail, timestamp, errors?: [{field, message}]}` |
| Pagination | `{content: [...], page: N, size: N, totalElements: N, totalPages: N}` |
| Default page size | 25 |
| Max page size | 100 |
| Soft-delete | `DELETE` endpoints deactivate/soft-delete; never hard-delete |
| Timestamps | ISO-8601 with UTC (`2026-05-20T10:00:00Z`) |

### 4.2 TypeScript Interfaces (Frontend Types)

```typescript
// types/api.ts
export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ErrorResponse {
  type: string
  title: string
  status: number
  detail: string
  timestamp: string
  errors?: FieldError[]
}

export interface FieldError {
  field: string
  message: string
}
```

```typescript
// types/user.ts
export type UserRole = 'REVIEWER' | 'MANAGER' | 'TAXONOMY_ADMIN' | 'ADMIN' | 'VIEWER'

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  isActive: boolean
  isEmailVerified: boolean
  roles: UserRole[]
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    username: string
    roles: UserRole[]
  }
}

export interface RegisterRequest {
  username: string          // 3–50 chars; alphanumeric + underscore
  email: string             // RFC 5322
  password: string          // 8–128 chars; complexity rules
  firstName: string
  lastName: string
}
```

```typescript
// types/classification.ts
export type ClassificationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'CLASSIFIED'
  | 'FAILED'
  | 'NEEDS_REVIEW'

export interface Classification {
  id: string
  planId: string              // RP-2026-001
  title?: string
  status: ClassificationStatus
  // Taxonomy assignment
  pcc?: string
  taxonomyCategory?: string
  taxonomyCode?: string
  taxonomySubcode?: string
  primaryCondition?: string
  secondaryConditions?: string
  icdCodes?: string
  // Extracted content
  projectSummary?: string
  populationSetting?: string
  intervention?: string
  comparator?: string
  primaryOutcome?: string
  secondaryOutcomes?: string
  textPreview?: string        // max 500 chars
  extractionWarning?: string
  // Classification metadata
  confidenceScore?: number    // 0.0–1.0 — displayed as "AI Confidence"
  modelVersion?: string
  processingTimeMs?: number
  // File
  fileId?: string
  fileName?: string
  fileSize?: number
  filePath?: string
  notes?: string
  // Review audit
  uploadedBy: string          // username
  uploadedAt: string
  classifiedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  overrideReason?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface UploadResponse {
  classificationId: string
  planId: string
  status: 'PENDING'
  uploadedAt: string
}

export interface ManualOverrideRequest {
  pcc?: string
  taxonomyCategory?: string
  taxonomyCode?: string
  taxonomySubcode?: string
  overrideReason: string      // required; 1–2000 chars
}

export interface ClassificationFilters {
  page?: number
  size?: number
  sort?: string
  status?: ClassificationStatus
  startDate?: string
  endDate?: string
  pcc?: string
  q?: string
}

export interface ClassificationStatistics {
  total: number
  classified: number
  processing: number
  pending: number
  failed: number
  needsReview: number
  avgConfidence: number
  overrideRate: number
}
```

```typescript
// types/taxonomy.ts
export interface TaxonomyCategory {
  id: string
  code: string
  name: string
  description?: string
  parentId?: string
  isActive: boolean
  level: number              // 0=root/PCC, 1=category, 2=code, 3=subcode
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface TaxonomyTreeNode extends TaxonomyCategory {
  children: TaxonomyTreeNode[]
}

export interface CreateTaxonomyRequest {
  code: string               // 1–50 chars; unique within parent
  name: string               // 1–255 chars
  description?: string
  parentId?: string
  level: number
  displayOrder?: number
}
```

```typescript
// types/dashboard.ts
export interface DashboardMetrics {
  total: number
  classified: number
  processing: number
  pending: number
  failed: number
  needsReview: number
  avgConfidence: number      // field name: avgConfidence; UI label: "Avg. AI Confidence"
}

export interface DashboardConfiguration {
  id: string
  userId: string
  layout: WidgetLayout
  createdAt: string
  updatedAt: string
}

export interface WidgetLayout {
  widgets: WidgetConfig[]
  version: number
}

export interface WidgetConfig {
  id: string
  position: number
  size: number               // 1–12 (12-column grid)
  visible: boolean
}

export interface AccuracyTrendPoint {
  date: string
  aiAccuracy: number
  humanCorrectedAccuracy: number
}

export interface CategoryAccuracy {
  category: string
  total: number
  overrideCount: number
  accuracyRate: number
}

export interface ConfidenceBucket {
  bucket: string             // "0.0-0.1", "0.1-0.2", ...
  count: number
}

export interface ModelPerformance {
  precision: number
  recall: number
  f1: number
  totalEvaluated: number
  insufficient?: boolean
}
```

```typescript
// types/notification.ts
export type NotificationType =
  | 'CLASSIFICATION_COMPLETED'
  | 'CLASSIFICATION_FAILED'
  | 'CLASSIFICATION_NEEDS_REVIEW'
  | 'PIPELINE_FAILURE'
  | 'OVERRIDE_SUBMITTED'

export type NotificationChannel = 'IN_APP' | 'EMAIL'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface NotificationPreference {
  eventType: NotificationType
  channel: NotificationChannel
  enabled: boolean
}
```

```typescript
// types/report.ts
export type ReportStatus = 'GENERATING' | 'READY' | 'FAILED'

export interface ReportConfiguration {
  id: string
  name: string
  ownerId: string
  columns: string[]
  filters: ReportFilters
  createdAt: string
  updatedAt: string
}

export interface ReportFilters {
  status?: ClassificationStatus[]
  startDate?: string
  endDate?: string
  pcc?: string[]
}

export interface ExcelReport {
  id: string
  configurationId?: string
  status: ReportStatus
  generatedAt?: string
  filePath?: string
  errorMessage?: string
  createdAt: string
}

export interface GenerateReportRequest {
  columns?: string[]       // defaults to all if omitted
  filters?: ReportFilters
}

export interface FilterConfiguration {
  id: string
  userId: string
  name: string
  criteria: ReportFilters
  createdAt: string
}
```

### 4.3 Complete API Endpoint Catalog

#### §Auth — `/api/auth`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | None | — | Create account; returns 201 with sanitized User |
| `POST` | `/api/auth/login` | None | — | Authenticate; returns JWT + refresh token |
| `POST` | `/api/auth/logout` | JWT | any | Invalidate refresh token |
| `POST` | `/api/auth/refresh` | None | — | Exchange refresh token for new JWT |
| `GET` | `/api/auth/verify-email?token={uuid}` | None | — | Confirm email verification |
| `POST` | `/api/auth/forgot-password` | None | — | Send password reset email |
| `POST` | `/api/auth/reset-password` | None | — | Complete reset with token + newPassword |

#### §Users — `/api/users`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/users` | JWT | `ADMIN` | List all users (paginated) |
| `GET` | `/api/users/{id}` | JWT | `ADMIN` | Get user by ID |
| `POST` | `/api/users` | JWT | `ADMIN` | Create user with role assignment |
| `PUT` | `/api/users/{id}` | JWT | `ADMIN` | Update user (name, phone, roles) |
| `DELETE` | `/api/users/{id}` | JWT | `ADMIN` | Deactivate user (soft) |
| `PATCH` | `/api/users/{id}/status` | JWT | `ADMIN` | Toggle `isActive` |
| `GET` | `/api/users/search?q=&role=&status=&page=&size=` | JWT | `ADMIN` | Search users |
| `GET` | `/api/users/active` | JWT | `ADMIN` | List active users |

#### §Dashboard — `/api/dashboard`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/dashboard/metrics` | JWT | `REVIEWER` | KPI counts + avgConfidence (all-time) |
| `GET` | `/api/dashboard/metrics/range?startDate=&endDate=` | JWT | `REVIEWER` | Date-filtered metrics |
| `GET` | `/api/dashboard/configuration` | JWT | `REVIEWER` | Current user's widget config |
| `GET` | `/api/dashboard/configuration/{id}` | JWT | `REVIEWER` | Specific config by ID |
| `POST` | `/api/dashboard/configuration` | JWT | `REVIEWER` | Create widget config |
| `PUT` | `/api/dashboard/configuration/{id}` | JWT | `REVIEWER` | Update widget layout |
| `DELETE` | `/api/dashboard/configuration/{id}` | JWT | `REVIEWER` | Delete config (reset to default) |

#### §Taxonomy — `/api/taxonomy`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/taxonomy` | JWT | `REVIEWER` | List all categories (paginated) |
| `GET` | `/api/taxonomy/tree` | JWT | `REVIEWER` | Full nested tree |
| `GET` | `/api/taxonomy/{id}` | JWT | `REVIEWER` | Get category by ID |
| `GET` | `/api/taxonomy/code/{code}` | JWT | `REVIEWER` | Get category by code |
| `GET` | `/api/taxonomy/{id}/children` | JWT | `REVIEWER` | Direct children of node |
| `GET` | `/api/taxonomy/search?q=&activeOnly=true` | JWT | `REVIEWER` | Full-text search |
| `GET` | `/api/taxonomy/active` | JWT | `REVIEWER` | All active categories (flat list) |
| `POST` | `/api/taxonomy` | JWT | `TAXONOMY_ADMIN` | Create category |
| `PUT` | `/api/taxonomy/{id}` | JWT | `TAXONOMY_ADMIN` | Update category |
| `DELETE` | `/api/taxonomy/{id}` | JWT | `TAXONOMY_ADMIN` | Deactivate (not hard-delete) |
| `PATCH` | `/api/taxonomy/{id}/status` | JWT | `TAXONOMY_ADMIN` | Toggle `isActive` (cascading deactivation) |

#### §Classifications — `/api/classifications`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/classifications/upload` | JWT | `REVIEWER` | Upload PDF; returns 202 immediately |
| `GET` | `/api/classifications` | JWT | `REVIEWER` | List (paginated, filterable, sortable) |
| `GET` | `/api/classifications/{id}` | JWT | `REVIEWER` | Get classification by ID |
| `GET` | `/api/classifications/{id}/results` | JWT | `REVIEWER` | Classification result fields only |
| `PUT` | `/api/classifications/{id}/override` | JWT | `REVIEWER` | Apply manual override (reason required) |
| `POST` | `/api/classifications/{id}/retry` | JWT | `REVIEWER` | Retry FAILED classification |
| `DELETE` | `/api/classifications/{id}` | JWT | `ADMIN` | Soft-delete |
| `GET` | `/api/classifications/search?q=` | JWT | `REVIEWER` | Full-text search (planId/title) |
| `GET` | `/api/classifications/status/{status}` | JWT | `REVIEWER` | Filter by status enum |
| `GET` | `/api/classifications/statistics` | JWT | `MANAGER` | Aggregate statistics |
| `GET` | `/api/classifications/recent?limit=10` | JWT | `REVIEWER` | Recent N classifications |

#### §Pipeline — `/api/pipeline`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/pipeline/status` | JWT | `MANAGER` | Current state, active runs, queue depth |
| `GET` | `/api/pipeline/health` | JWT | `ADMIN` | DB connection pool stats |
| `GET` | `/api/pipeline/stats` | JWT | `MANAGER` | Aggregate run statistics |
| `GET` | `/api/pipeline/{id}` | JWT | `ADMIN` | Pipeline run by ID |
| `GET` | `/api/pipeline/{id}/stages` | JWT | `MANAGER` | Stage cards (state, duration, errors) |
| `GET` | `/api/pipeline/{id}/logs?page=&size=` | JWT | `ADMIN` | Paginated event log |
| `GET` | `/api/pipeline/{id}/history` | JWT | `MANAGER` | Run history list |
| `POST` | `/api/pipeline/{id}/start` | JWT | `ADMIN` | Start run; 202 or 409 if already running |
| `POST` | `/api/pipeline/{id}/stop` | JWT | `ADMIN` | Graceful stop |
| `POST` | `/api/pipeline/{id}/pause` | JWT | `ADMIN` | Pause after current stage |
| `POST` | `/api/pipeline/{id}/resume` | JWT | `ADMIN` | Resume from PAUSED |
| `POST` | `/api/pipeline/{id}/stages/{stageId}/retry` | JWT | `ADMIN` | Stage-level retry (FAILED only) |
| `POST` | `/api/pipeline/sync` | JWT | `ADMIN` | Manual sync — pick up PENDING records |
| `GET` | `/api/pipeline/connections` | JWT | `ADMIN` | DB connection details |
| `POST` | `/api/pipeline/connections/{id}/check` | JWT | `ADMIN` | Test specific connection |

#### §Analytics — `/api/analytics`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/analytics/overview` | JWT | `MANAGER` | High-level analytics summary |
| `GET` | `/api/analytics/accuracy-trend?startDate=&endDate=&granularity=` | JWT | `MANAGER` | Accuracy over time |
| `GET` | `/api/analytics/category-accuracy?startDate=&endDate=` | JWT | `MANAGER` | Per-category breakdown |
| `GET` | `/api/analytics/confidence-distribution?startDate=&endDate=` | JWT | `MANAGER` | 10-bucket histogram |
| `GET` | `/api/analytics/processing-volume?startDate=&endDate=&granularity=` | JWT | `MANAGER` | Upload volume over time |
| `GET` | `/api/analytics/overrides?limit=&page=` | JWT | `MANAGER` | Recent overrides (paginated) |
| `GET` | `/api/analytics/report` | JWT | `MANAGER` | Full analytics report data |
| `GET` | `/api/analytics/model-performance?startDate=&endDate=` | JWT | `MANAGER` | Precision/recall/F1 |

#### §Reports & Excel — `/api/excel`, `/api/reports`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/excel/generate` | JWT | `MANAGER` | Generate + stream Excel inline |
| `GET` | `/api/reports` | JWT | `MANAGER` | List generated reports |
| `POST` | `/api/reports` | JWT | `MANAGER` | Create async report |
| `GET` | `/api/reports/{id}` | JWT | `MANAGER` | Report status |
| `GET` | `/api/reports/{id}/download` | JWT | `MANAGER` | Pre-signed S3 download URL |
| `GET` | `/api/reports/templates` | JWT | `MANAGER` | List saved templates |
| `POST` | `/api/reports/templates` | JWT | `MANAGER` | Create template |
| `PUT` | `/api/reports/templates/{id}` | JWT | `MANAGER` | Update template |
| `DELETE` | `/api/reports/templates/{id}` | JWT | `MANAGER` | Soft-delete template |
| `POST` | `/api/reports/templates/{id}/run` | JWT | `MANAGER` | Execute template |
| `GET` | `/api/reports/preview` | JWT | `MANAGER` | Preview row count + sample rows |

#### §Files — `/api/files`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/files` | JWT | `ADMIN` | List uploaded files (paginated) |
| `GET` | `/api/files/{id}` | JWT | owner or `ADMIN` | File metadata |
| `GET` | `/api/files/{id}/download-url` | JWT | owner or `ADMIN` | Pre-signed URL (15-min TTL) |
| `DELETE` | `/api/files/{id}` | JWT | `ADMIN` | Soft-delete file record |

#### §Filters — `/api/filters`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/filters` | JWT | `REVIEWER` | Current user's saved filter configs |
| `POST` | `/api/filters` | JWT | `REVIEWER` | Create filter config |
| `GET` | `/api/filters/{id}` | JWT | `REVIEWER` | Get filter config by ID |
| `PUT` | `/api/filters/{id}` | JWT | `REVIEWER` | Update filter config |
| `DELETE` | `/api/filters/{id}` | JWT | `REVIEWER` | Soft-delete filter config |

#### §Notifications — `/api/notifications`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/notifications?page=&size=` | JWT | any | Paginated notification list (current user) |
| `GET` | `/api/notifications/unread-count` | JWT | any | `{count: N}` for badge |
| `PATCH` | `/api/notifications/{id}/read` | JWT | any | Mark single notification read |
| `POST` | `/api/notifications/read-all` | JWT | any | Mark all read |
| `GET` | `/api/notifications/preferences` | JWT | any | Per-user preference list |
| `PUT` | `/api/notifications/preferences` | JWT | any | Update preferences (full replace) |

#### §Help — `/api/help`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/help/articles` | JWT | any | Article list (title, slug, category, publishedAt) |
| `GET` | `/api/help/articles/{slug}` | JWT | any | Full article with Markdown content |
| `GET` | `/api/help/articles/search?q=` | JWT | any | Full-text search (min 2 chars) |
| `POST` | `/api/help/articles` | JWT | `ADMIN` | Create article |
| `PUT` | `/api/help/articles/{id}` | JWT | `ADMIN` | Update article |
| `DELETE` | `/api/help/articles/{id}` | JWT | `ADMIN` | Soft-delete article |
| `GET` | `/api/help/faqs?category=` | JWT | any | FAQ list (accordion) |
| `POST` | `/api/help/faqs` | JWT | `ADMIN` | Create FAQ |
| `PUT` | `/api/help/faqs/{id}` | JWT | `ADMIN` | Update FAQ |
| `DELETE` | `/api/help/faqs/{id}` | JWT | `ADMIN` | Soft-delete FAQ |
| `POST` | `/api/help/feedback` | JWT | any | Submit article feedback (upsert) |
| `GET` | `/api/help/articles/{id}/feedback` | JWT | `ADMIN` | Feedback summary |

### 4.4 Key Request/Response Examples

**Classification Upload (202):**
```
POST /api/classifications/upload
Content-Type: multipart/form-data
Authorization: Bearer <jwt>

file: [PDF binary]
title: "Research Plan 2026 - Heart Failure Study"
notes: "Priority review requested"

→ 202 Accepted
{
  "classificationId": "550e8400-e29b-41d4-a716-446655440000",
  "planId": "RP-2026-001",
  "status": "PENDING",
  "uploadedAt": "2026-05-20T10:00:00Z"
}
```

**Override (200):**
```
PUT /api/classifications/{id}/override
{
  "pcc": "T2D",
  "taxonomyCategory": "Shared Decision Making",
  "taxonomyCode": "SDM",
  "taxonomySubcode": "DigitalTool",
  "overrideReason": "AI misclassified — correct PCC is Type 2 Diabetes per Section 3 of plan"
}
```

**Excel Export (200 — binary stream):**
```
POST /api/excel/generate
{
  "columns": ["planId", "title", "status", "pcc", "confidenceScore", "reviewedBy"],
  "filters": {
    "status": ["CLASSIFIED", "NEEDS_REVIEW"],
    "startDate": "2026-01-01",
    "endDate": "2026-05-20"
  }
}

→ 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="pcori-report-20260520.xlsx"
[binary stream]
```

---

*Section 4 of 7 — TechArch-PCORI.md*
---

## 5. Security Architecture

### 5.1 Authentication Model

The platform uses **stateless JWT authentication** via `Authorization: Bearer <token>` on all protected requests. There are no server-side sessions. The JWT is validated on every request by `JwtAuthFilter` (a `OncePerRequestFilter`).

```
JWT Lifecycle:
  Register → [email verification] → Login → JWT (1h) + RefreshToken (long-lived)
                                         ↓
                              Protected API calls (Bearer header)
                                         ↓
                              JWT expires → POST /api/auth/refresh
                                         ↓
                              Logout → RefreshToken revoked (server-side mark)
```

**JWT token structure:**
- Algorithm: HS512
- Subject: user UUID
- Claims: `roles` (array of role names), `exp`, `iat`, `username`
- Secret: `JWT_SECRET` env var (minimum 64 chars / 512 bits); application throws `IllegalStateException` at startup if missing or too short
- Default expiry: 1 hour (configurable via `JWT_EXPIRATION_MS`)

**Startup validation:**
```java
@Value("${JWT_SECRET}")
private String jwtSecret;

@PostConstruct
public void validateSecret() {
    if (jwtSecret == null || jwtSecret.length() < 64) {
        throw new IllegalStateException(
            "JWT_SECRET environment variable is required and must be at least 64 characters (512-bit)");
    }
}
```

### 5.2 Authorization Model (RBAC)

Five roles with hierarchical permissions:

| Role | Key Capabilities |
|---|---|
| `REVIEWER` | Upload plans, view classifications, submit overrides, view dashboard |
| `MANAGER` | All REVIEWER + analytics, reports, pipeline status, statistics |
| `TAXONOMY_ADMIN` | All REVIEWER + taxonomy CRUD, activate/deactivate codes |
| `ADMIN` | All permissions + user CRUD, pipeline control, file admin, help admin |
| `VIEWER` | Read-only: dashboard, analytics, reports download |

**Implementation: Service-layer enforcement**

```java
// RBAC enforced at service layer via @PreAuthorize (not controller-only)
@Service
@RequiredArgsConstructor
public class ClassificationService {

    @PreAuthorize("hasRole('REVIEWER')")
    @Transactional
    public Classification uploadAndClassify(MultipartFile file,
                                            UploadMetadataRequest metadata,
                                            String username) { ... }

    @PreAuthorize("hasAnyRole('REVIEWER', 'ADMIN')")
    public Classification getById(UUID id) { ... }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteClassification(UUID id) { ... }

    @PreAuthorize("hasRole('MANAGER')")
    public ClassificationStatistics getStatistics() { ... }
}
```

**Permission granularity (stored in `permissions` table):**

| Permission | Resource | Action |
|---|---|---|
| `classifications:read` | classifications | READ |
| `classifications:write` | classifications | CREATE |
| `classifications:override` | classifications | UPDATE |
| `classifications:delete` | classifications | DELETE |
| `taxonomy:read` | taxonomy | READ |
| `taxonomy:manage` | taxonomy | WRITE |
| `users:manage` | users | ALL |
| `pipeline:view` | pipeline | READ |
| `pipeline:control` | pipeline | EXECUTE |
| `reports:generate` | reports | CREATE |
| `analytics:view` | analytics | READ |

### 5.3 Password Security

- BCrypt strength 12 (cost factor)
- Password complexity: 8–128 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit
- Passwords never logged, never returned in API responses
- BCrypt bean:

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
}
```

### 5.4 Account Lockout

```
Failed login:
  increment users.login_attempts
  IF login_attempts >= MAX_LOGIN_ATTEMPTS (default 5):
    SET locked_until = NOW() + LOCKOUT_DURATION_MINUTES (default 30)
    RETURN 403 ACCOUNT_LOCKED

Lockout check on each login:
  IF locked_until IS NOT NULL AND locked_until > NOW():
    RETURN 403 ACCOUNT_LOCKED with time remaining

Admin unlock:
  PATCH /api/users/{id}/status { isActive: true }
  → resets login_attempts = 0, clears locked_until

Auto-expiry:
  Checked on each login attempt: if locked_until < NOW(), treat as unlocked
```

### 5.5 CORS Configuration

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    // Production: replace with actual origin from env var
    config.setAllowedOrigins(List.of(
        System.getenv().getOrDefault("ALLOWED_ORIGIN", "http://localhost:3000")
    ));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
    // Required for Excel download: Content-Disposition must be exposed
    config.setExposedHeaders(List.of("Content-Disposition", "Content-Type"));
    config.setAllowCredentials(false);   // localStorage JWT — no credentials cookie
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

**Critical:** Never use wildcard origin (`*`) in production. `ALLOWED_ORIGIN` must be set to the exact frontend URL.

### 5.6 Data Protection

| Control | Implementation |
|---|---|
| Password hashing | BCrypt strength 12 |
| JWT secret | Env var only (`JWT_SECRET`); min 512-bit; startup failure if missing |
| PHI in logs | Extracted PDF text never logged above TRACE; structured logging via Logback |
| PHI in DB | `textPreview` max 500 chars only; raw extracted text never stored |
| S3 security | `BlockPublicAcls`, `BlockPublicPolicy`, `RestrictPublicBuckets` all true; SSE-S3 encryption |
| S3 access | Pre-signed URLs (15-min TTL) only; no permanent public URLs |
| S3 keys | UUID-based (`pdfs/{year}/{month}/{uuid}-{name}.pdf`); no patient names in path |
| HTTPS | Required in production; HSTS header; no HTTP fallback |
| Swagger | Disabled in production profile (`springdoc.swagger-ui.enabled=false`) |
| Actuator | Only `/actuator/health` and `/actuator/prometheus` exposed externally; others restricted |

### 5.7 PHI Safeguards

```java
// CORRECT: Text preview only; no full text
c.setTextPreview(extractedText.length() > 500
    ? extractedText.substring(0, 500)
    : extractedText);

// CORRECT: TRACE level only for diagnostic text
log.trace("Extracted {} chars from PDF {}", extractedText.length(), classificationId);

// WRONG — never do this:
log.info("Extracted text: {}", extractedText);   // PHI violation
log.debug("PDF content: {}", extractedText);      // PHI violation
c.setFullText(extractedText);                     // never stored in DB
```

S3 object key pattern (no PHI in path):
```java
// CORRECT: UUID-based key
String key = String.format("pdfs/%d/%02d/%s-%s.pdf",
    year, month, UUID.randomUUID(), sanitizedFilename);

// sanitizedFilename: replaces spaces/special chars; no patient names allowed in key
String sanitizedFilename = originalName.replaceAll("[^a-zA-Z0-9._-]", "_").toLowerCase();
```

### 5.8 Environment Variables (Required)

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | **Mandatory** | Min 64 chars; HS512 signing key; startup failure if missing |
| `JWT_EXPIRATION_MS` | Optional | Default 3600000 (1 hour) |
| `DATABASE_URL` | Mandatory | JDBC URL for PostgreSQL |
| `DATABASE_USERNAME` | Mandatory | DB user |
| `DATABASE_PASSWORD` | Mandatory | DB password |
| `AWS_ACCESS_KEY_ID` | Mandatory (prod) | S3 credentials |
| `AWS_SECRET_ACCESS_KEY` | Mandatory (prod) | S3 credentials |
| `AWS_S3_BUCKET` | Mandatory | S3 bucket name |
| `AWS_ENDPOINT_OVERRIDE` | Dev only | LocalStack/MinIO endpoint |
| `MAIL_HOST` | Mandatory | SMTP host |
| `MAIL_PORT` | Mandatory | SMTP port (587 for STARTTLS) |
| `MAIL_USERNAME` | Mandatory | SMTP credentials |
| `MAIL_PASSWORD` | Mandatory | SMTP credentials |
| `ALLOWED_ORIGIN` | Mandatory (prod) | Frontend URL for CORS |
| `MAX_LOGIN_ATTEMPTS` | Optional | Default 5 |
| `LOCKOUT_DURATION_MINUTES` | Optional | Default 30 |
| `PASSWORD_RESET_TTL_MINUTES` | Optional | Default 60 |
| `MAX_UPLOAD_SIZE_MB` | Optional | Default 50 |
| `STUCK_TIMEOUT_MINUTES` | Optional | Default 15 |
| `PRE_SIGNED_URL_TTL_SECONDS` | Optional | Default 900 (15 min) |
| `NEEDS_REVIEW_THRESHOLD` | Optional | Default 0.75 (admin-configurable at runtime too) |
| `APP_CLASSIFICATION_STRATEGY` | Optional | `keyword` (default) or `openai` / `anthropic` / `bedrock` |

---

*Section 5 of 7 — TechArch-PCORI.md*
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
---

## 7. Integration Points

### 7.1 StorageService — S3-Compatible Object Storage

**Interface contract:**

```java
// integration/storage/StorageService.java
public interface StorageService {

    /**
     * Store a file and return its object key (storage path).
     * @param key      S3 object key (UUID-based; no PHI in path)
     * @param content  File input stream
     * @param contentType  MIME type (always "application/pdf" after Tika validation)
     * @return         S3 object key (stored as Classification.filePath)
     */
    String store(String key, InputStream content, String contentType);

    /**
     * Generate a pre-signed URL for a stored object.
     * @param key      S3 object key
     * @param ttlSeconds  URL expiry (default 900 = 15 min)
     * @return         Pre-signed URL string; never logged or stored
     */
    String getDownloadUrl(String key, int ttlSeconds);

    /**
     * Download object content.
     * @param key  S3 object key
     * @return     InputStream for the object
     */
    InputStream download(String key);

    /**
     * Soft-delete the object record; optionally delete the S3 object.
     * @param key  S3 object key
     */
    void delete(String key);
}
```

**S3 implementation:**

```java
// integration/storage/S3StorageService.java
@Service
@ConditionalOnProperty(name = "storage.provider", havingValue = "s3", matchIfMissing = true)
@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.s3.bucket}")
    private String bucket;

    @Override
    public String store(String key, InputStream content, String contentType) {
        try {
            byte[] bytes = content.readAllBytes();
            s3Client.putObject(
                PutObjectRequest.builder()
                    .bucket(bucket).key(key).contentType(contentType)
                    .serverSideEncryption(ServerSideEncryption.AES256)  // SSE-S3
                    .build(),
                RequestBody.fromBytes(bytes)
            );
            return key;
        } catch (S3Exception | IOException e) {
            throw new StorageException("Failed to store file: " + e.getMessage(), e);
        }
    }

    @Override
    public String getDownloadUrl(String key, int ttlSeconds) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(Duration.ofSeconds(ttlSeconds))
            .getObjectRequest(r -> r.bucket(bucket).key(key))
            .build();
        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }
}
```

**S3 configuration (dev — LocalStack / MinIO):**

```java
// config/S3Config.java
@Configuration
public class S3Config {

    @Value("${app.s3.endpoint:#{null}}")
    private String endpointOverride;

    @Value("${app.s3.region:us-east-1}")
    private String region;

    @Bean
    public S3Client s3Client(AwsCredentialsProvider credentialsProvider) {
        S3ClientBuilder builder = S3Client.builder()
            .region(Region.of(region))
            .credentialsProvider(credentialsProvider);

        if (endpointOverride != null) {
            builder.endpointOverride(URI.create(endpointOverride))
                   .forcePathStyle(true);  // Required for LocalStack/MinIO
        }
        return builder.build();
    }
}
```

**application-dev.properties:**
```properties
storage.provider=s3
app.s3.endpoint=http://localhost:4566
app.s3.bucket=pcori-dev
app.s3.region=us-east-1
```

### 7.2 ClassificationStrategy — ML / Keyword

**Interface contract:**

```java
// integration/ml/ClassificationStrategy.java
public interface ClassificationStrategy {

    /**
     * Classify extracted text against the PCORI taxonomy.
     * @param extractedText  Text from PDF (truncated to context window if needed)
     * @param taxonomy       Active taxonomy categories for structured output constraint
     * @return               ClassificationResult POJO
     */
    ClassificationResult classify(String extractedText,
                                  List<TaxonomyCategory> taxonomy);
}

// ClassificationResult is the structured output POJO
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
    double confidenceScore,    // 0.0–1.0
    String modelVersion
) {}
```

**Keyword fallback (default, ships first):**

```java
@Service
@ConditionalOnProperty(name = "app.classification.strategy",
    havingValue = "keyword", matchIfMissing = true)
@Slf4j
public class KeywordStrategy implements ClassificationStrategy {

    private final TaxonomyRepository taxonomyRepository;

    @Override
    public ClassificationResult classify(String extractedText,
                                         List<TaxonomyCategory> taxonomy) {
        // Simple TF/keyword matching against active taxonomy codes
        // Returns confidence 0.5–0.7 range for keyword matches
        // Falls through to NEEDS_REVIEW for low confidence
        ...
    }
}
```

**Spring AI strategy (Phase 5):**

```java
@Service
@ConditionalOnProperty(name = "app.classification.strategy", havingValue = "openai")
@RequiredArgsConstructor
public class SpringAiStrategy implements ClassificationStrategy {

    private final ChatClient chatClient;

    @Override
    public ClassificationResult classify(String extractedText,
                                         List<TaxonomyCategory> taxonomy) {
        // Truncate text to context window: model limit − prompt tokens
        String truncatedText = truncateToContextWindow(extractedText, 6000);

        String prompt = buildStructuredPrompt(truncatedText, taxonomy);

        try {
            return chatClient.prompt()
                .user(prompt)
                .call()
                .entity(ClassificationResult.class);   // structured output → POJO
        } catch (Exception e) {
            // Parse failure: fall back to keyword strategy (not FAILED status)
            log.warn("ML structured output parse failure; falling back to keyword: {}", e.getMessage());
            return keywordFallback.classify(extractedText, taxonomy);
        }
    }
}
```

**Provider swap via configuration (no code change):**

| Property | Provider |
|---|---|
| `app.classification.strategy=keyword` | `KeywordStrategy` (default; ships Phase 1) |
| `app.classification.strategy=openai` | `SpringAiStrategy` with `spring-ai-openai-spring-boot-starter` |
| `app.classification.strategy=anthropic` | `SpringAiStrategy` with `spring-ai-anthropic-spring-boot-starter` |
| `app.classification.strategy=bedrock` | `SpringAiStrategy` with `spring-ai-bedrock-converse-spring-boot-starter` |

**AWS Bedrock (HIPAA-eligible path):**
```properties
app.classification.strategy=bedrock
spring.ai.bedrock.aws.region=us-east-1
spring.ai.bedrock.converse.chat.options.model=anthropic.claude-3-5-sonnet-20241022-v2:0
```

### 7.3 EmailService — SMTP

**Interface contract:**

```java
// integration/email/EmailService.java
public interface EmailService {
    void sendEmailVerification(String toEmail, String username, String token);
    void sendPasswordReset(String toEmail, String username, String token);
    void sendNotification(String toEmail, String subject, String body);
}
```

**Implementation:**

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@pcori.org}")
    private String fromAddress;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    @Override
    public void sendEmailVerification(String toEmail, String username, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject("Verify your PCORI Platform email");
            message.setText(String.format(
                "Hello %s,\n\nClick to verify: %s/verify-email?token=%s\n\nExpires in 24 hours.",
                username, baseUrl, token));
            mailSender.send(message);
        } catch (MailException e) {
            // Log warning; don't propagate — email failure doesn't fail registration
            log.warn("Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }
}
```

**Dev (MailHog) configuration:**
```properties
spring.mail.host=localhost
spring.mail.port=1025
spring.mail.properties.mail.smtp.auth=false
spring.mail.properties.mail.smtp.starttls.enable=false
```

**Prod (SES SMTP) configuration:**
```properties
spring.mail.host=email-smtp.us-east-1.amazonaws.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### 7.4 PostgreSQL (Database)

| Environment | Config |
|---|---|
| **Development** | PostgreSQL 16 via Docker Compose (`localhost:5432`) |
| **Production** | RDS PostgreSQL 16 or managed PostgreSQL; `ddl-auto=validate` |
| **Migrations** | Flyway auto-runs on startup; versioned V-series + repeatable R-series |
| **Connection pool** | HikariCP; `spring.datasource.hikari.maximum-pool-size=10` (configurable) |
| **Dialect** | Auto-detected; no manual override needed with Spring Boot 3.4 + Hibernate 6.6 |

**application-prod.properties:**
```properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
```

### 7.5 Observability

| Endpoint | Access | Purpose |
|---|---|---|
| `GET /actuator/health` | Public | DB connection, disk space, application up/down |
| `GET /actuator/prometheus` | Internal / ops | Micrometer metrics for Prometheus scraping |
| All other `/actuator/*` | Restricted (ADMIN role or internal IP) | Prevent information exposure |

**Custom classification metrics:**
```java
// In ClassificationPipeline
@Autowired
private MeterRegistry meterRegistry;

// Increment on successful classification
meterRegistry.counter("classifications.completed",
    "model", result.modelVersion(),
    "status", "CLASSIFIED").increment();

// Timer for pipeline duration
meterRegistry.timer("classifications.pipeline.duration",
    "stage", "total").record(durationMs, TimeUnit.MILLISECONDS);
```

### 7.6 Docker Compose (Development Stack)

```yaml
# docker-compose.yml
version: '3.9'
services:

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pcori_dev
      POSTGRES_USER: pcori
      POSTGRES_PASSWORD: pcori_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"   # SMTP
      - "8025:8025"   # Web UI

  localstack:
    image: localstack/localstack:latest
    environment:
      SERVICES: s3
      AWS_DEFAULT_REGION: us-east-1
    ports:
      - "4566:4566"
    volumes:
      - localstack_data:/var/lib/localstack

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      SPRING_PROFILES_ACTIVE: dev
      DATABASE_URL: jdbc:postgresql://postgres:5432/pcori_dev
      DATABASE_USERNAME: pcori
      DATABASE_PASSWORD: pcori_dev_password
      JWT_SECRET: dev-secret-do-not-use-in-production-must-be-64-chars-minimum
      AWS_ENDPOINT_OVERRIDE: http://localstack:4566
      AWS_S3_BUCKET: pcori-dev
      MAIL_HOST: mailhog
      MAIL_PORT: "1025"
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - localstack
      - mailhog

volumes:
  postgres_data:
  localstack_data:
```

### 7.7 External Service Summary

| Service | Dev | Production | Interface |
|---|---|---|---|
| Object Storage | LocalStack (Docker, port 4566) | AWS S3 (or Azure Blob / MinIO) | `StorageService` interface |
| Email | MailHog (Docker, port 1025) | AWS SES / SendGrid SMTP | `EmailService` interface |
| ML Classification | Keyword fallback (in-process) | Spring AI: OpenAI / Bedrock / Anthropic | `ClassificationStrategy` interface |
| Database | PostgreSQL 16 (Docker, port 5432) | RDS PostgreSQL 16 | Spring Data JPA / HikariCP |
| Monitoring | Spring Actuator (port 8080) | Prometheus + Grafana | Micrometer registry |

### 7.8 Scaling Roadmap

| Phase | Threshold | Architecture Change |
|---|---|---|
| v1 Launch | 0–500 users | Single Spring Boot + PostgreSQL + S3. `@Async` ThreadPoolTaskExecutor. No external queue. |
| v1 Growth | 500–5K users | ALB / Nginx load balancer. Read replica for `AnalyticsService`. Redis cache for `GET /api/taxonomy/tree` (taxonomy changes rarely). Tune HikariCP pool size. |
| v2+ | 5K+ users | Extract pipeline to durable queue (SQS / RabbitMQ / Redis Streams). Multiple backend instances. WebSocket for real-time classification status. Consider read/write split at DataSource level. |

**First three scaling bottlenecks (in order):**
1. **Classification throughput** — `ThreadPoolTaskExecutor` queue fills under sustained load → introduce SQS/RabbitMQ consumer workers
2. **Analytics query latency** — `GROUP BY` on large `classifications` table → populate `dashboard_metrics` pre-aggregation table; add materialized views
3. **File upload bandwidth** — S3 handles this; v2: pre-signed S3 upload URLs from frontend (bypass backend for large files)

---

*Section 7 of 7 — TechArch-PCORI.md*
