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
