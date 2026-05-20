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
