# Architecture Research

**Domain:** Healthcare Research Analytics — AI-assisted PDF classification, audit trail, dashboards, Excel reporting
**Researched:** 2026-05-20
**Confidence:** HIGH (Spring Security, Spring Data JPA, Next.js App Router patterns verified against official documentation)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER CLIENT                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│   │ Server   │  │ Client   │  │ TanStack │  │  Axios +         │   │
│   │ Comps    │  │ Comps    │  │ Query    │  │  Auth Interceptor│   │
│   │ (RSC)    │  │ ('use    │  │ Cache    │  │  (JWT header)    │   │
│   │          │  │  client')│  │          │  │                  │   │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│        │             │             │                  │             │
├────────┴─────────────┴─────────────┴──────────────────┴─────────────┤
│                      NEXT.JS 16 APP ROUTER                          │
│              (Route Segments / Layouts / Loading UI)                │
├─────────────────────────────────────────────────────────────────────┤
│                    REVERSE PROXY / LOAD BALANCER                    │
│              (Nginx / AWS ALB — HTTPS termination)                  │
├─────────────────────────────────────────────────────────────────────┤
│                    SPRING BOOT 3.4 BACKEND                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              SecurityFilterChain (JWT → RBAC)               │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │    │
│  │  │ Auth     │ │ Class-   │ │ Taxonomy │ │ Analytics /  │   │    │
│  │  │ Controller│ │ ification│ │ Controller│ │ Reports /    │   │    │
│  │  │          │ │ Controller│ │          │ │ Pipeline     │   │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │    │
│  ├───────┼────────────┼────────────┼──────────────┼───────────┤    │
│  │  ┌────┴─────┐ ┌────┴──────────┐ ┌──────────────┴───────┐   │    │
│  │  │ Auth     │ │ Classification│ │ Taxonomy / Analytics  │   │    │
│  │  │ Service  │ │ Service       │ │ / Report Services     │   │    │
│  │  └────┬─────┘ └────┬──────────┘ └──────────────┬────────┘   │    │
│  ├───────┼────────────┼───────────────────────────┼────────────┤    │
│  │  ┌────┴──┐ ┌───────┴───┐ ┌──────┐ ┌────────────┴────────┐   │    │
│  │  │ User  │ │Classific- │ │Taxon-│ │ Analytics / Report  │   │    │
│  │  │ Repo  │ │ation Repo │ │omy   │ │ / Notification      │   │    │
│  │  │       │ │           │ │ Repo │ │ Repositories         │   │    │
│  │  └───────┘ └───────────┘ └──────┘ └─────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│                         EXTERNAL SERVICES                           │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌───────────────┐   │
│   │PostgreSQL│   │   S3 /   │   │  ML API  │   │  SMTP Relay   │   │
│   │ (prod)   │   │  MinIO   │   │(Spring AI│   │ (SES/Mailgun) │   │
│   │  H2(dev) │   │          │   │ ChatClient│  │               │   │
│   └──────────┘   └──────────┘   └──────────┘   └───────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| SecurityFilterChain | JWT extraction, validation, SecurityContext population, RBAC gate | `OncePerRequestFilter` subclass + Spring Security DSL |
| `@RestController` | HTTP boundary: parse request, delegate to service, serialize response | Thin — no business logic; validates inputs via `@Valid` |
| `@Service` | Business logic, transaction boundary, orchestrates repositories and external integrations | `@Transactional`, composes repositories, calls ML/S3/SMTP |
| `@Repository` (JPA) | Data access, query construction, soft-delete scoping | `JpaRepository` + `JpaSpecificationExecutor` for dynamic filters |
| ClassificationPipeline | Async processing: PDF extract → ML classify → persist result | `@Async` task on `ThreadPoolTaskExecutor`, status updates per stage |
| StorageService | S3-agnostic file upload/download/delete | Interface + AWS SDK v2 implementation; LocalStack in dev |
| ML ClassificationStrategy | Pluggable ML vs keyword classification | Interface + `@ConditionalOnProperty` implementations |
| Next.js Route Segments | Server-side render with auth check; stream skeleton → data | `page.tsx` (RSC) + `loading.tsx` + `'use client'` islands |
| TanStack Query Cache | Client-side server-state: classification list, dashboard metrics | `useQuery` / `useMutation` with invalidation on mutations |
| Axios Interceptor | Inject JWT header on every request; handle 401 → redirect to `/login` | Single Axios instance shared across app |

---

## Recommended Project Structure

### Backend (Spring Boot)

```
src/main/java/com/pcori/platform/
├── config/
│   ├── SecurityConfig.java          # SecurityFilterChain bean, CORS, CSRF-off for API
│   ├── AsyncConfig.java             # ThreadPoolTaskExecutor bean for @Async
│   ├── S3Config.java                # S3Client bean (endpointOverride for dev/MinIO)
│   ├── JpaAuditConfig.java          # AuditorAware bean → reads from SecurityContextHolder
│   └── OpenApiConfig.java           # SpringDoc config, auth header schema
│
├── security/
│   ├── JwtAuthFilter.java           # OncePerRequestFilter: extract/validate JWT → set SecurityContext
│   ├── JwtService.java              # generateToken(), validateToken(), extractUsername()
│   ├── UserDetailsServiceImpl.java  # Loads UserDetails from UserRepository
│   └── JwtAuthEntryPoint.java       # 401 response for unauthenticated requests
│
├── domain/                          # One package per aggregate root
│   ├── user/
│   │   ├── User.java                # @Entity
│   │   ├── Role.java                # @Entity (M:N to Permission)
│   │   ├── Permission.java          # @Entity
│   │   ├── UserRepository.java      # JpaRepository<User, UUID>
│   │   ├── UserService.java         # @Service, @Transactional
│   │   └── UserController.java      # @RestController("/api/users")
│   │
│   ├── classification/
│   │   ├── Classification.java      # @Entity — core aggregate
│   │   ├── ClassificationStatus.java # enum: PENDING/PROCESSING/CLASSIFIED/FAILED/NEEDS_REVIEW
│   │   ├── ClassificationRepository.java  # + JpaSpecificationExecutor for filter/search
│   │   ├── ClassificationService.java     # upload, override, retry, search
│   │   ├── ClassificationController.java  # @RestController("/api/classifications")
│   │   └── pipeline/
│   │       ├── ClassificationPipeline.java   # @Async orchestrator (stages below)
│   │       ├── PdfExtractionStage.java       # PDFBox text extraction
│   │       ├── ClassificationStage.java      # delegates to ClassificationStrategy
│   │       ├── PersistResultStage.java       # persists + status → CLASSIFIED
│   │       └── ClassificationStrategy.java   # interface
│   │
│   ├── taxonomy/
│   │   ├── TaxonomyCategory.java    # @Entity, self-referential parentId
│   │   ├── TaxonomyRepository.java
│   │   ├── TaxonomyService.java
│   │   └── TaxonomyController.java
│   │
│   ├── analytics/
│   │   ├── AnalyticsService.java    # aggregation queries for dashboard + analytics
│   │   └── AnalyticsController.java
│   │
│   ├── report/
│   │   ├── ExcelReportService.java  # Apache POI XSSF workbook builder
│   │   ├── ReportConfiguration.java # @Entity
│   │   ├── ReportRepository.java
│   │   └── ReportController.java
│   │
│   ├── pipeline/
│   │   ├── PipelineStatusService.java  # FR-5: stage health, logs, history
│   │   └── PipelineController.java
│   │
│   ├── notification/
│   │   ├── Notification.java
│   │   ├── NotificationService.java
│   │   └── NotificationController.java
│   │
│   └── help/
│       ├── HelpArticle.java
│       ├── HelpService.java
│       └── HelpController.java
│
├── integration/
│   ├── storage/
│   │   ├── StorageService.java        # interface: upload, download, delete
│   │   └── S3StorageService.java      # AWS SDK v2 implementation
│   ├── ml/
│   │   ├── ClassificationStrategy.java  # interface
│   │   ├── SpringAiStrategy.java        # Spring AI ChatClient implementation
│   │   └── KeywordStrategy.java         # fallback implementation
│   └── email/
│       └── EmailService.java            # JavaMailSender wrapper
│
└── common/
    ├── dto/                          # Request/Response DTOs (records preferred in Java 21)
    ├── exception/
    │   ├── GlobalExceptionHandler.java  # @RestControllerAdvice: maps exceptions → RFC 7807
    │   └── DomainExceptions.java        # ResourceNotFoundException, ClassificationException, etc.
    ├── audit/
    │   └── AuditableEntity.java         # @MappedSuperclass: createdAt, updatedAt, @CreatedBy, @LastModifiedBy
    └── util/
        └── PaginationUtil.java          # Pageable param parsing helpers
```

### Frontend (Next.js 16 App Router)

```
src/
├── app/
│   ├── layout.tsx                   # Root layout: QueryClientProvider, ThemeProvider, Toaster
│   ├── page.tsx                     # Landing page (public, SSR)
│   ├── (auth)/                      # Route group — public routes (no auth guard)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── (protected)/                 # Route group — auth guard in layout
│       ├── layout.tsx               # Reads JWT from localStorage; redirect to /login if missing
│       ├── dashboard/
│       │   ├── page.tsx             # RSC: fetches /api/dashboard/metrics (Suspense)
│       │   └── loading.tsx          # Skeleton grid
│       ├── classifications/
│       │   ├── page.tsx             # RSC shell + 'use client' table
│       │   └── loading.tsx
│       ├── taxonomy/page.tsx
│       ├── data-pipeline/page.tsx
│       ├── analytics/page.tsx
│       ├── reports/page.tsx
│       ├── users/page.tsx           # Admin only
│       └── help/page.tsx
│
├── components/
│   ├── ui/                          # Radix UI primitives wrapped with CVA variants
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── classifications/
│   │   ├── ClassificationsTable.tsx    # 'use client'; useQuery → GET /api/classifications
│   │   ├── UploadPlanDialog.tsx        # react-dropzone + useMutation → POST /api/classifications/upload
│   │   ├── ManualOverrideDialog.tsx    # useMutation → PUT /api/classifications/{id}/override
│   │   └── ViewClassificationDialog.tsx
│   ├── dashboard/
│   │   ├── KpiCards.tsx
│   │   ├── RecentClassificationsTable.tsx
│   │   └── StatusBreakdown.tsx
│   ├── analytics/
│   │   ├── AccuracyTrendChart.tsx      # Recharts LineChart
│   │   ├── ConfidenceDistribution.tsx  # Recharts BarChart histogram
│   │   └── ProcessingVolumeChart.tsx   # Recharts AreaChart
│   └── shared/
│       ├── DataTable.tsx               # Reusable paginated table (Radix primitives)
│       ├── StatusBadge.tsx             # Maps ClassificationStatus → color + label
│       ├── DateRangePicker.tsx
│       └── SkeletonCard.tsx
│
├── hooks/
│   ├── useClassifications.ts           # useQuery wrapper for classification list
│   ├── useDashboardMetrics.ts
│   ├── useAuth.ts                       # reads/clears JWT from localStorage; exposes user claims
│   └── useNotifications.ts
│
├── lib/
│   ├── api.ts                           # Axios instance: baseURL, auth interceptor, 401 handler
│   ├── query-client.ts                  # TanStack QueryClient singleton (staleTime, retry config)
│   └── validators/
│       ├── upload.schema.ts             # zod schemas (shared shape: mirrored from backend DTOs)
│       ├── user.schema.ts
│       └── override.schema.ts
│
└── types/
    ├── classification.ts                # TypeScript types matching backend DTOs
    ├── taxonomy.ts
    ├── user.ts
    └── api.ts                           # ApiResponse<T>, PagedResponse<T> wrappers
```

### Structure Rationale

- **`domain/` by aggregate root (backend):** Each domain package owns its entity, repository, service, and controller — keeps related code co-located; prevents cross-domain service leakage; mirrors the 16-controller PRD surface cleanly.
- **`integration/` for external concerns:** S3, ML, email are infrastructure adapters behind interfaces — swappable without touching domain logic. This isolates the `StorageService` interface from AWS SDK details.
- **`common/`:** Shared cross-cutting concerns (audit entity, exception handler, DTOs). Not a dumping ground — each subfolder has a clear purpose.
- **`(protected)/layout.tsx` route group:** Next.js route groups allow an auth guard layout wrapping all protected routes without adding a URL segment. Single place for JWT validation logic.
- **`hooks/` as TanStack Query wrappers:** Co-locates query key, staleTime, and retry config with the resource. Components import `useClassifications()` not `useQuery({ queryKey: [...] })` directly — refactor-safe.
- **`lib/api.ts` single Axios instance:** All JWT injection in one interceptor — no token injection scattered across components.

---

## Architectural Patterns

### Pattern 1: JWT Auth Filter Chain

**What:** A custom `OncePerRequestFilter` sits in the Spring Security `SecurityFilterChain`, extracts the `Authorization: Bearer <token>` header, validates the JWT signature, and populates the `SecurityContextHolder`. Method-level RBAC is enforced via `@PreAuthorize`.

**When to use:** Always — every protected endpoint passes through this filter.

**Trade-offs:** Stateless = tokens can't be revoked mid-session (by design for v1). Account lockout is enforced at login time, not per-request.

**Example (HIGH confidence — verified against Spring Security 7 official docs):**

```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String username = jwtService.extractUsername(jwt);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        filterChain.doFilter(request, response);
    }
}

// SecurityConfig wires it in:
@Bean
public SecurityFilterChain filterChain(HttpSecurity http,
                                        JwtAuthFilter jwtAuthFilter) throws Exception {
    return http
        .csrf(AbstractHttpConfigurer::disable)          // stateless API — no CSRF needed
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/actuator/health").permitAll()
            .anyRequest().authenticated())
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
        .exceptionHandling(e -> e.authenticationEntryPoint(jwtAuthEntryPoint))
        .build();
}
```

**Declare `JwtAuthFilter` as a bean but prevent double-registration:**
```java
// Required because @Component filters auto-register with Servlet container
@Bean
public FilterRegistrationBean<JwtAuthFilter> jwtFilterRegistration(JwtAuthFilter filter) {
    FilterRegistrationBean<JwtAuthFilter> reg = new FilterRegistrationBean<>(filter);
    reg.setEnabled(false);   // Spring Security adds it; don't add it again
    return reg;
}
```

---

### Pattern 2: Layered Backend (Controller → Service → Repository)

**What:** Strict three-layer separation. Controllers are thin HTTP adapters. Services own business logic and transaction boundaries. Repositories own data access.

**When to use:** Always in Spring Boot. The pattern is load-bearing — breaking it (e.g., business logic in controllers) causes testability and maintenance failures.

**Trade-offs:** More classes per feature vs. direct repository-in-controller shortcuts. The overhead pays off above ~5 endpoints. This project has 80+.

**Example — Classification upload flow:**

```java
// CONTROLLER — HTTP boundary only
@RestController
@RequestMapping("/api/classifications")
@RequiredArgsConstructor
public class ClassificationController {

    private final ClassificationService classificationService;

    @PostMapping("/upload")
    @PreAuthorize("hasRole('REVIEWER')")
    public ResponseEntity<ClassificationResponse> upload(
            @RequestParam("file") MultipartFile file,
            @Valid @RequestPart("metadata") UploadMetadataRequest metadata,
            @AuthenticationPrincipal UserDetails userDetails) {

        Classification saved = classificationService.uploadAndClassify(
            file, metadata, userDetails.getUsername());
        return ResponseEntity.accepted()         // 202 — async processing
            .body(ClassificationResponse.from(saved));
    }

    @PutMapping("/{id}/override")
    @PreAuthorize("hasRole('REVIEWER')")
    public ResponseEntity<ClassificationResponse> override(
            @PathVariable UUID id,
            @Valid @RequestBody ManualOverrideRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Classification updated = classificationService.applyOverride(
            id, request, userDetails.getUsername());
        return ResponseEntity.ok(ClassificationResponse.from(updated));
    }
}

// SERVICE — business logic + transaction boundary
@Service
@RequiredArgsConstructor
public class ClassificationService {

    private final ClassificationRepository repo;
    private final StorageService storage;
    private final ClassificationPipeline pipeline;
    private final UserRepository userRepo;

    @Transactional
    public Classification uploadAndClassify(MultipartFile file,
                                            UploadMetadataRequest metadata,
                                            String username) {
        // 1. Persist file to object storage
        String storagePath = storage.upload(file.getOriginalFilename(),
                                            file.getInputStream(),
                                            file.getContentType());
        // 2. Create Classification record (PENDING)
        User uploader = userRepo.findByUsername(username).orElseThrow();
        Classification c = Classification.builder()
            .planId(generatePlanId())
            .title(metadata.title())
            .status(ClassificationStatus.PENDING)
            .fileName(file.getOriginalFilename())
            .fileSize(file.getSize())
            .filePath(storagePath)
            .uploadedBy(uploader)
            .uploadedAt(Instant.now())
            .build();
        Classification saved = repo.save(c);

        // 3. Trigger async classification (returns immediately)
        pipeline.process(saved.getId());

        return saved;
    }

    @Transactional
    public Classification applyOverride(UUID id,
                                        ManualOverrideRequest req,
                                        String reviewerUsername) {
        Classification c = repo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Classification", id));
        User reviewer = userRepo.findByUsername(reviewerUsername).orElseThrow();

        c.setPcc(req.pcc());
        c.setTaxonomyCategory(req.taxonomyCategory());
        c.setTaxonomyCode(req.taxonomyCode());
        c.setTaxonomySubcode(req.taxonomySubcode());
        c.setOverrideReason(req.reason());
        c.setReviewedBy(reviewer);
        c.setReviewedAt(Instant.now());
        c.setStatus(ClassificationStatus.CLASSIFIED);

        return repo.save(c);
    }
}

// REPOSITORY — data access only
public interface ClassificationRepository
        extends JpaRepository<Classification, UUID>,
                JpaSpecificationExecutor<Classification> {

    Page<Classification> findByStatus(ClassificationStatus status, Pageable pageable);

    @Query("SELECT c FROM Classification c WHERE c.uploadedBy.username = :username " +
           "ORDER BY c.uploadedAt DESC")
    Page<Classification> findByUploader(@Param("username") String username, Pageable pageable);

    List<Classification> findTop10ByOrderByUploadedAtDesc();

    // Analytics aggregation
    @Query("SELECT new com.pcori.platform.analytics.StatusCount(c.status, COUNT(c)) " +
           "FROM Classification c GROUP BY c.status")
    List<StatusCount> countByStatus();
}
```

---

### Pattern 3: Async Classification Pipeline (Stages)

**What:** Upload returns `202 Accepted` immediately. A `@Async` method on a dedicated `ThreadPoolTaskExecutor` runs the three-stage pipeline: PDF extraction → ML classification → result persistence. Status transitions are persisted between stages so the client can poll.

**When to use:** Classification involves PDF parsing and a remote ML API call — both can take 2-15+ seconds. Synchronous processing would exceed the PRD's 2-second response target and block Tomcat threads.

**Trade-offs:**
- `@Async` on the same JVM: simple, no queue infrastructure, adequate for v1 single-tenant scale.
- Not durable: if the server restarts mid-classification, the `PROCESSING` record is stuck. Implement a startup recovery job (`@EventListener(ApplicationReadyEvent.class)`) that re-queues stuck `PROCESSING` items.
- v2 escalation: if volume grows, extract to a durable queue (Redis Streams, RabbitMQ, or SQS) without changing the stage interfaces.

**Async configuration (HIGH confidence — verified against Spring Framework 7 scheduling docs):**

```java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "classificationExecutor")
    public ThreadPoolTaskExecutor classificationExecutor() {
        ThreadPoolTaskExecutor exec = new ThreadPoolTaskExecutor();
        exec.setCorePoolSize(4);           // concurrency for 4 parallel classifications
        exec.setMaxPoolSize(8);
        exec.setQueueCapacity(50);         // buffer for burst
        exec.setThreadNamePrefix("classification-");
        exec.setTaskDecorator(new SecurityContextPropagatingDecorator());  // carry SecurityContext
        exec.initialize();
        return exec;
    }
}

// Pipeline orchestrator
@Service
@RequiredArgsConstructor
public class ClassificationPipeline {

    private final ClassificationRepository repo;
    private final PdfExtractionStage extractionStage;
    private final ClassificationStage classificationStage;
    private final PersistResultStage persistStage;

    @Async("classificationExecutor")
    public CompletableFuture<Void> process(UUID classificationId) {
        try {
            Classification c = repo.findById(classificationId).orElseThrow();

            // Stage 1: PDF Text Extraction
            updateStatus(c, ClassificationStatus.PROCESSING, "EXTRACTING");
            String extractedText = extractionStage.extract(c.getFilePath());

            // Stage 2: ML Classification
            updateStatus(c, ClassificationStatus.PROCESSING, "CLASSIFYING");
            ClassificationResult result = classificationStage.classify(extractedText);

            // Stage 3: Persist result
            persistStage.persist(c, result);
            updateStatus(c, ClassificationStatus.CLASSIFIED, "COMPLETE");

        } catch (ClassificationException ex) {
            repo.findById(classificationId).ifPresent(c -> {
                c.setStatus(ClassificationStatus.FAILED);
                repo.save(c);
            });
            log.error("Classification {} failed: {}", classificationId, ex.getMessage());
        }
        return CompletableFuture.completedFuture(null);
    }

    @Transactional
    private void updateStatus(Classification c, ClassificationStatus status, String stage) {
        c.setStatus(status);
        c.setCurrentStage(stage);  // optional stage tracking field
        repo.save(c);
    }
}

// PDF Extraction Stage — PDFBox 3.x
@Component
public class PdfExtractionStage {

    private final StorageService storage;

    public String extract(String storagePath) {
        try (InputStream is = storage.download(storagePath);
             PDDocument doc = Loader.loadPDF(is.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        } catch (IOException e) {
            throw new ClassificationException("PDF extraction failed: " + e.getMessage(), e);
        }
    }
}

// ML Classification Stage — Spring AI
@Component
@ConditionalOnProperty(name = "app.classification.strategy", havingValue = "openai", matchIfMissing = true)
public class SpringAiStrategy implements ClassificationStrategy {

    private final ChatClient chatClient;

    public ClassificationResult classify(String extractedText) {
        String prompt = buildPrompt(extractedText);
        return chatClient.prompt()
            .user(prompt)
            .call()
            .entity(ClassificationResult.class);  // structured output → POJO
    }
}
```

**Startup recovery for stuck PROCESSING records:**
```java
@Component
@RequiredArgsConstructor
public class PipelineRecovery {

    private final ClassificationRepository repo;
    private final ClassificationPipeline pipeline;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void recoverStuckClassifications() {
        repo.findByStatus(ClassificationStatus.PROCESSING, Pageable.unpaged())
            .forEach(c -> pipeline.process(c.getId()));
    }
}
```

---

### Pattern 4: Hierarchical Taxonomy — Self-Referential JPA Entity

**What:** `TaxonomyCategory` has a `parentId` foreign key pointing back to the same table. The tree is materialized lazily — fetch children on demand.

**When to use:** PCORI taxonomy is a bounded tree (~100-500 nodes), not a massive hierarchy. Lazy loading of children per API call is adequate for FR-3.5 (tree view endpoint).

**Trade-offs:** For a large tree, use a recursive CTE query via `@Query` with native SQL. For this scale, simple parent-child JPA relationships are sufficient.

**Example:**

```java
@Entity
@Table(name = "taxonomy_categories")
public class TaxonomyCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String code;          // e.g., "SDM", "SDM-001"

    private String name;
    private String description;
    private boolean isActive;
    private int level;            // 0 = root, 1 = category, 2 = code, 3 = subcode
    private int displayOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private TaxonomyCategory parent;

    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<TaxonomyCategory> children = new ArrayList<>();
}

// Repository: flat list + tree endpoint
public interface TaxonomyRepository extends JpaRepository<TaxonomyCategory, UUID> {
    List<TaxonomyCategory> findByParentIsNullAndIsActiveTrueOrderByDisplayOrderAsc(); // roots
    List<TaxonomyCategory> findByParentIdAndIsActiveTrueOrderByDisplayOrderAsc(UUID parentId);
    Optional<TaxonomyCategory> findByCode(String code);

    // Full-text search
    @Query("SELECT t FROM TaxonomyCategory t WHERE " +
           "LOWER(t.code) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(t.name) LIKE LOWER(CONCAT('%',:q,'%'))")
    List<TaxonomyCategory> search(@Param("q") String query);
}
```

---

### Pattern 5: Audit Trail via JPA Auditing

**What:** All entities extend `AuditableEntity` which uses Spring Data JPA's `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, `@LastModifiedBy`. The `AuditorAware<String>` bean reads the current username from `SecurityContextHolder`.

**When to use:** Always — PRD requires `uploadedBy`, `reviewedBy`, timestamps on every classification record. This pattern provides it automatically without manual field assignment.

**Trade-offs:** `@LastModifiedBy` captures the last modifier, not a history. For full history (who changed what, when), use Spring Data Envers or a dedicated `audit_log` table. For v1, entity-level audit fields satisfy the PRD.

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity {

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;     // username from SecurityContext

    @LastModifiedBy
    private String lastModifiedBy;
}

// AuditorAware bean
@Component
public class SecurityAuditorAware implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        return Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
            .filter(Authentication::isAuthenticated)
            .map(Authentication::getName);
    }
}

// Enable in config
@Configuration
@EnableJpaAuditing(auditorAwareRef = "securityAuditorAware")
public class JpaAuditConfig {}
```

---

### Pattern 6: File Upload — Multipart → S3 → Entity

**What:** The classification upload endpoint accepts `multipart/form-data`. After server-side MIME validation (Apache Tika), the file is streamed directly to S3 via AWS SDK v2. The S3 path is stored in the `Classification` entity, not the file content.

**When to use:** Always for uploaded PDFs. Never store binary file content in the database.

**Trade-offs:** Direct stream to S3 is memory-efficient (no buffering entire PDF in heap). However, S3 upload failures must be handled before persisting the Classification record — wrap in try-catch with appropriate cleanup.

```java
@Service
@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private final S3Client s3Client;

    @Value("${app.s3.bucket}")
    private String bucket;

    @Override
    public String upload(String filename, InputStream content, String contentType) {
        String key = "uploads/" + UUID.randomUUID() + "/" + filename;
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .build(),
            RequestBody.fromInputStream(content, content.available())
        );
        return key;  // stored as filePath on Classification entity
    }

    @Override
    public InputStream download(String key) {
        ResponseInputStream<GetObjectResponse> response = s3Client.getObject(
            GetObjectRequest.builder().bucket(bucket).key(key).build());
        return response;
    }
}

// MIME validation before upload
@Component
public class FileValidator {
    private static final Set<String> ALLOWED_TYPES = Set.of("application/pdf");

    public void validate(MultipartFile file) {
        try {
            Tika tika = new Tika();
            String detectedType = tika.detect(file.getInputStream());
            if (!ALLOWED_TYPES.contains(detectedType)) {
                throw new InvalidFileTypeException("Only PDF files are accepted. Got: " + detectedType);
            }
        } catch (IOException e) {
            throw new FileValidationException("Cannot read uploaded file", e);
        }
    }
}
```

---

### Pattern 7: Frontend Data Layer — TanStack Query + Axios

**What:** All client-side API calls go through a single Axios instance with a request interceptor that injects the JWT header. TanStack Query wraps every API call with automatic caching, background refresh, and mutation-triggered invalidation. Server Components (RSC) fetch directly using `fetch` with `cache: 'no-store'` for authenticated data.

**When to use:** 
- Use RSC + `fetch` for initial page load (SEO, TTFB) — dashboard KPIs, static taxonomy tree.
- Use TanStack Query `useQuery` for interactive client-side data (classifications table with filter/sort, notifications polling).
- Use TanStack Query `useMutation` + `invalidateQueries` for all write operations.

**Trade-offs:** RSC data fetching requires the JWT from cookies (HttpOnly) for server-side auth. Since the PRD uses localStorage-based JWT with Bearer headers, RSC data fetching hits the backend from the server with no auth — instead, the RSC renders a skeleton and a `'use client'` component hydrates with TanStack Query. This is the correct pattern for this auth setup.

```typescript
// lib/api.ts — single Axios instance
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('jwt_token')
    : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token')
      window.location.href = '/login?reason=session-expired'
    }
    return Promise.reject(error)
  }
)

export default api

// hooks/useClassifications.ts — TanStack Query wrapper
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export const CLASSIFICATION_KEYS = {
  all: ['classifications'] as const,
  list: (filters: ClassificationFilters) =>
    [...CLASSIFICATION_KEYS.all, 'list', filters] as const,
  detail: (id: string) =>
    [...CLASSIFICATION_KEYS.all, 'detail', id] as const,
}

export function useClassifications(filters: ClassificationFilters) {
  return useQuery({
    queryKey: CLASSIFICATION_KEYS.list(filters),
    queryFn: () =>
      api.get('/api/classifications', { params: filters })
         .then(r => r.data as PagedResponse<Classification>),
    staleTime: 30_000,       // 30s cache — classifications don't change by the second
    retry: 2,
  })
}

export function useUploadClassification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/api/classifications/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data),
    onSuccess: () => {
      // Invalidate list so the new record appears
      queryClient.invalidateQueries({ queryKey: CLASSIFICATION_KEYS.all })
    },
  })
}

export function useOverrideClassification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ManualOverrideRequest }) =>
      api.put(`/api/classifications/${id}/override`, data).then(r => r.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: CLASSIFICATION_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: CLASSIFICATION_KEYS.all })
    },
  })
}
```

---

### Pattern 8: Database Schema — Audit Trail + Soft Delete

**What:** All classification records are never hard-deleted. A `deleted_at` timestamp column (null = active) implements soft delete. Spring Data JPA `@SQLRestriction` annotation automatically filters out deleted rows from all queries.

**When to use:** PRD requires "classifications retained indefinitely." Soft delete satisfies data retention without a separate archive table.

**Trade-offs:** Indexes must include `deleted_at IS NULL` predicates to remain efficient. Unique constraints need `WHERE deleted_at IS NULL` partial indexes (PostgreSQL) to allow re-use of codes after soft-delete.

```java
@Entity
@SQLRestriction("deleted_at IS NULL")    // Hibernate 6+ — auto-appended to all queries
public class Classification extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String planId;                // RP-2026-001 format

    @Enumerated(EnumType.STRING)
    private ClassificationStatus status;

    // ... all classification fields ...

    @Column(name = "deleted_at")
    private Instant deletedAt;            // null = active; non-null = soft-deleted

    public void softDelete() {
        this.deletedAt = Instant.now();
    }
}
```

**Flyway migration example for PostgreSQL:**
```sql
-- V1__initial_schema.sql

CREATE TABLE taxonomy_categories (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(50) UNIQUE NOT NULL,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    parent_id    UUID REFERENCES taxonomy_categories(id),
    is_active    BOOLEAN NOT NULL DEFAULT true,
    level        INT NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_taxonomy_parent ON taxonomy_categories(parent_id) WHERE is_active = true;

CREATE TABLE classifications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id           VARCHAR(20) UNIQUE NOT NULL,  -- RP-2026-001
    title             VARCHAR(500),
    status            VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    pcc               VARCHAR(255),
    taxonomy_category VARCHAR(255),
    taxonomy_code     VARCHAR(50),
    taxonomy_subcode  VARCHAR(50),
    project_summary   TEXT,
    population_setting TEXT,
    intervention      TEXT,
    comparator        TEXT,
    primary_outcome   TEXT,
    secondary_outcomes TEXT,
    confidence_score  NUMERIC(5,4),     -- 0.0000 to 1.0000
    file_name         VARCHAR(255),
    file_size         BIGINT,
    file_path         VARCHAR(1000),    -- S3 key
    notes             TEXT,
    uploaded_by       UUID REFERENCES users(id),
    uploaded_at       TIMESTAMPTZ,
    classified_at     TIMESTAMPTZ,
    reviewed_by       UUID REFERENCES users(id),
    reviewed_at       TIMESTAMPTZ,
    override_reason   TEXT,
    processing_time_ms BIGINT,
    model_version     VARCHAR(100),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ         -- soft delete
);

-- Partial index for soft-delete performance
CREATE INDEX idx_classifications_status ON classifications(status)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_classifications_uploader ON classifications(uploaded_by)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_classifications_uploaded_at ON classifications(uploaded_at DESC)
    WHERE deleted_at IS NULL;

-- Full-text search on project summary (PostgreSQL)
ALTER TABLE classifications
    ADD COLUMN ts_project_summary TSVECTOR
    GENERATED ALWAYS AS (to_tsvector('english', COALESCE(project_summary, ''))) STORED;
CREATE INDEX idx_classifications_fts ON classifications USING GIN(ts_project_summary);
```

---

## Data Flow

### Classification Upload Flow

```
Reviewer (Browser)
    │  POST /api/classifications/upload (multipart PDF)
    ▼
JwtAuthFilter
    │  validates Bearer token → sets SecurityContext
    ▼
ClassificationController.upload()
    │  @Valid metadata, @AuthenticationPrincipal username
    ▼
ClassificationService.uploadAndClassify()
    │  1. FileValidator.validate() — Tika MIME check
    │  2. StorageService.upload() — stream to S3
    │  3. Classification.save(status=PENDING)
    │  4. pipeline.process(id) — @Async, returns immediately
    │  returns Classification (PENDING)
    ▼
HTTP 202 Accepted { id, status: "PENDING", planId }
    │
    │  [Async - background thread]
    ▼
ClassificationPipeline.process(id)
    │  updateStatus(PROCESSING, "EXTRACTING")
    │  extractedText = PdfExtractionStage.extract(filePath)
    │  updateStatus(PROCESSING, "CLASSIFYING")
    │  result = ClassificationStage.classify(extractedText)
    │  PersistResultStage.persist(classification, result)
    │  updateStatus(CLASSIFIED, "COMPLETE")
    ▼
Classification persisted (status=CLASSIFIED)

[Frontend polls GET /api/classifications/{id} via TanStack Query refetchInterval]
    │
    ▼
Status changes PENDING → PROCESSING → CLASSIFIED visible in UI
```

### Dashboard Load Flow

```
Browser navigates to /dashboard
    │
    ▼
Next.js (protected)/dashboard/page.tsx [RSC - Server Component]
    │  Renders layout immediately (no data fetch in RSC — auth in localStorage only)
    │  Wraps KpiCards, RecentTable in <Suspense fallback={<Skeleton/>}>
    ▼
loading.tsx rendered immediately (skeleton grid)
    │
    │  Client hydrates
    ▼
KpiCards.tsx ['use client']
    │  useDashboardMetrics() → TanStack Query
    │  GET /api/dashboard/metrics (with Bearer token via Axios interceptor)
    │  staleTime: 60_000 — cached 1 min
    ▼
DashboardMetricsResponse rendered (totals, avg confidence)

RecentClassificationsTable.tsx ['use client']
    │  useClassifications({ limit: 10, sort: 'uploadedAt,desc' })
    │  GET /api/classifications (paginated)
    ▼
Recent classifications rendered
```

### State Management Flow

```
User action: Upload PDF
    │
    ▼
UploadPlanDialog.tsx
    │  react-hook-form (zod validation)
    │  useUploadClassification() mutation
    ▼
api.post('/api/classifications/upload', formData)
    │  Axios → Spring Boot → 202 Accepted
    ▼
onSuccess callback:
    │  queryClient.invalidateQueries(['classifications'])
    │  sonner.success('Plan submitted for classification')
    │  dialog.close()
    ▼
ClassificationsTable re-fetches automatically (query invalidated)
    │  new PENDING record appears in table
    │  TanStack Query refetchInterval: 5000 (if any row is PROCESSING)
    ▼
Table updates PENDING → PROCESSING → CLASSIFIED as backend processes
```

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| S3 / MinIO | AWS SDK v2 `S3Client` behind `StorageService` interface | `endpointOverride` for MinIO/LocalStack in dev; bucket configured via `app.s3.bucket` env var |
| ML API (OpenAI/Bedrock/etc.) | Spring AI `ChatClient` behind `ClassificationStrategy` interface | Swap provider via `@ConditionalOnProperty("app.classification.strategy")`; no code change |
| SMTP (SES/SendGrid) | Spring Boot `JavaMailSender` behind `EmailService` | Provider configured via `spring.mail.*` env vars only; MailHog in dev |
| PostgreSQL (prod) | JPA / HikariCP; Flyway migrations auto-run on startup | `spring.jpa.hibernate.ddl-auto=validate` in prod (never `create-drop`) |
| H2 (dev) | Same as above; Flyway-compatible | Use `spring.profiles.active=dev` to switch |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Controller ↔ Service | Direct method call (same JVM) | Service methods annotated `@Transactional` — controller is outside transaction |
| Service ↔ Pipeline | `@Async` CompletableFuture call | Pipeline runs on `classificationExecutor` thread pool; SecurityContext propagated via TaskDecorator |
| Service ↔ StorageService | Interface method call | S3StorageService injected; LocalStack URL from `app.s3.endpoint` in dev |
| Service ↔ ClassificationStrategy | Interface method call | Spring AI or Keyword impl injected based on `@ConditionalOnProperty` |
| Frontend ↔ Backend | REST over HTTP; JWT via `Authorization: Bearer` | Axios instance; CORS origin restricted in `SecurityConfig` |
| TanStack Query ↔ UI | React state subscription | `useQuery` returns `{ data, isLoading, isError }`; components re-render on cache update |

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–500 users (v1 launch) | Monolith is fine. Single Spring Boot instance + PostgreSQL + S3. `ThreadPoolTaskExecutor` for async classification. No queue infrastructure. |
| 500–5K users | Add read replica for analytics queries (route `AnalyticsService` reads to replica via separate `DataSource`). Add Nginx or ALB load balancer. Cache `GET /api/taxonomy/tree` in Redis (taxonomy changes rarely). |
| 5K+ users (v2+) | Extract classification pipeline to durable queue (SQS/RabbitMQ/Redis Streams). Multiple backend instances behind ALB. WebSocket for real-time status (already deferred to v2). Consider read/write split at service level. |

### Scaling Priorities

1. **First bottleneck:** Classification pipeline throughput — `ThreadPoolTaskExecutor` queue fills under sustained load. Fix: tune pool size or introduce a durable async queue (SQS) with multiple consumer instances.
2. **Second bottleneck:** Analytics query latency — `GROUP BY` queries on the `classifications` table degrade as rows grow. Fix: materialized views or `DashboardMetric` time-series pre-aggregation table (already in the data model).
3. **Third bottleneck:** File upload bandwidth — S3 handles this without backend change. Frontend can use pre-signed S3 upload URLs (bypass backend for large files) — v2 optimization.

---

## Anti-Patterns

### Anti-Pattern 1: Business Logic in Controllers

**What people do:** Put `if/else`, validation, or database calls directly in `@RestController` methods because it's faster to write.

**Why it's wrong:** Controllers are untestable without HTTP (require MockMvc), security tests are harder, and business logic can't be reused. With 80+ endpoints, this becomes unmaintainable.

**Do this instead:** Controllers call one service method. All logic lives in `@Service` classes tested with plain JUnit + Mockito.

---

### Anti-Pattern 2: Synchronous ML API Call on the Request Thread

**What people do:** Call the ML API (OpenAI/Bedrock) directly inside `ClassificationController.upload()` and block the response until classification is complete.

**Why it's wrong:** ML API calls are 2-30 seconds. Blocking Tomcat threads starves the server. The PRD's "< 2 s response" target is impossible. Under load, the thread pool exhausts.

**Do this instead:** Return `202 Accepted` immediately. Classification happens on the `classificationExecutor` thread pool via `@Async`. Client polls status via `GET /api/classifications/{id}`.

---

### Anti-Pattern 3: Storing JWT Tokens in `SecurityConfig` or Application Code

**What people do:** Hardcode the JWT secret in `application.yml` or commit it to source control.

**Why it's wrong:** PRD security constraint: "JWT secret from env vars only (never source)." Committed secrets are permanent security liabilities.

**Do this instead:**
```yaml
# application.yml
app:
  jwt:
    secret: ${JWT_SECRET}     # read from env var; fails fast if missing
    expiration: ${JWT_EXPIRATION_MS:3600000}
```

---

### Anti-Pattern 4: Bypassing the `StorageService` Interface

**What people do:** Use `S3Client` directly in `ClassificationService` instead of `StorageService`.

**Why it's wrong:** Provider is still TBD (AWS S3 vs Azure Blob vs NFS). Coupling to a concrete S3Client makes the switch expensive and breaks dev/test where LocalStack must be configured.

**Do this instead:** `ClassificationService` only knows about `StorageService`. Provider implementation is wired by Spring based on `@Profile` or `@ConditionalOnProperty`.

---

### Anti-Pattern 5: Flat `@Entity` Classes Without Inheritance for Audit Fields

**What people do:** Copy-paste `createdAt`, `updatedAt`, `createdBy`, `lastModifiedBy` fields into every entity class.

**Why it's wrong:** The PRD has 16+ entities. Copy-pasting audit fields leads to inconsistency and missed fields. One entity forgets `@CreatedDate` → audit trail breaks.

**Do this instead:** All entities extend `AuditableEntity` (`@MappedSuperclass`). Auditing is automatic via `AuditingEntityListener`.

---

### Anti-Pattern 6: Using `fetch` with Raw URLs in Every Component

**What people do:** Call `fetch('/api/classifications', { headers: { Authorization: `Bearer ${token}` } })` in every component.

**Why it's wrong:** JWT injection is scattered across 20+ components. If the token key or header format changes, it requires updating every call site.

**Do this instead:** Single Axios instance in `lib/api.ts` with a request interceptor. All components import `api` and call `api.get('/api/classifications')`.

---

### Anti-Pattern 7: No Partial Index on Soft-Delete Column

**What people do:** Add `deleted_at` for soft delete but don't add `WHERE deleted_at IS NULL` to indexes.

**Why it's wrong:** Every query (including the ones appended by `@SQLRestriction`) must scan the full index including deleted rows. Classification table grows to 100K+ rows → query performance degrades significantly.

**Do this instead:** Use partial indexes on PostgreSQL: `CREATE INDEX idx_classifications_status ON classifications(status) WHERE deleted_at IS NULL`.

---

### Anti-Pattern 8: SecurityContext Loss in @Async Threads

**What people do:** Mark `ClassificationPipeline.process()` with `@Async` but forget that the new thread doesn't inherit `SecurityContextHolder`.

**Why it's wrong:** Any `@PreAuthorize` check or `AuditorAware` call in the async pipeline thread returns null — audit fields (`lastModifiedBy`) are empty on persisted records.

**Do this instead:** Configure a `TaskDecorator` that copies the `SecurityContext` from the calling thread to the async thread:

```java
public class SecurityContextPropagatingDecorator implements TaskDecorator {
    @Override
    public Runnable decorate(Runnable runnable) {
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

---

## Sources

- Spring Security 7 — Servlet Architecture, Filter Chain, OncePerRequestFilter: https://docs.spring.io/spring-security/reference/servlet/architecture.html (verified 2026-05-20)
- Spring Security — `FilterRegistrationBean` and double-registration prevention: https://docs.spring.io/spring-security/reference/servlet/architecture.html#adding-custom-filter (verified 2026-05-20)
- Spring Framework — Task Execution, `ThreadPoolTaskExecutor`, `TaskDecorator`: https://docs.spring.io/spring-framework/reference/integration/scheduling.html (verified 2026-05-20)
- Spring Data JPA — `JpaSpecificationExecutor`, `Pageable`, `@Async` queries: https://docs.spring.io/spring-data/jpa/reference/repositories/query-methods-details.html (verified 2026-05-20)
- Next.js 16 — App Router data fetching, RSC, Suspense, streaming: https://nextjs.org/docs/app/getting-started/fetching-data (version 16.2.6, updated 2026-05-19)
- Spring Data JPA — `@SQLRestriction` (Hibernate 6 soft-delete): MEDIUM confidence (training data; official Hibernate 6 docs confirm feature; verify exact annotation name at implementation time)
- Spring Data JPA Auditing — `@CreatedDate`, `@CreatedBy`, `AuditingEntityListener`: MEDIUM confidence (training data; consistent across multiple Spring Data versions; verify `@EnableJpaAuditing` setup)

---

*Architecture research for: PCORI Research Analytics Platform — healthcare research AI classification*
*Researched: 2026-05-20*
