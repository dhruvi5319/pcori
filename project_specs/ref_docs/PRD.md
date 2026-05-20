# Product Requirements Document (PRD)
## PCORI Research Analytics Platform

| Field | Value |
|---|---|
| **Product Name** | PCORI Research Analytics Platform |
| **Document Version** | 1.0 |
| **Document Type** | Greenfield PRD (build from scratch) |

> **Note on UI specs in this PRD:** For a project of this size with a single primary stakeholder, it is appropriate to consolidate UI/UX specifications inside the PRD (Sections 8–11). For larger projects, the UI specs are typically extracted into a separate `UX_SPEC.md` document and referenced from here.

---

## 1. Executive Summary

The PCORI Research Analytics Platform is a secure, full-stack web application that automates the classification of patient-centered medical research plans against the PCORI taxonomy (Primary Clinical Condition, taxonomy category, code, subcode). It replaces a slow, manual review process with an AI-assisted workflow that includes uploading PDFs, automated classification, manual override, analytics dashboards, and report generation.

**Tech footprint (target):** Spring Boot 3.4 (Java 21) backend + Next.js 16 (React 19, TypeScript) frontend, JWT-based authentication, JPA persistence, Docker-packaged backend.

---

## 2. Problem Statement

PCORI reviewers receive thousands of research plans annually. Each plan must be classified across multiple taxonomy dimensions before it can be tracked, reported on, or audited. Current pain points:

- **Manual classification is slow** — reviewers spend hours per plan reading PDFs and assigning categories.
- **Inconsistent classification** — different reviewers produce different labels for similar plans.
- **No visibility into accuracy or throughput** — leadership cannot easily see classification volume, accuracy trends, or override rates.
- **Reporting is ad-hoc** — Excel exports are produced by hand each cycle.
- **No central record** of who classified what, when, and why an override happened.

---

## 3. Goals & Non-Goals

### 3.1 Goals
1. Reduce average plan classification time from hours to minutes via automated PDF-driven classification.
2. Maintain an auditable trail of every classification, override, and reviewer action.
3. Provide leadership dashboards for accuracy, confidence distribution, throughput, and override rates.
4. Centralize the PCORI/ICD-10 taxonomy as a single source of truth.
5. Provide self-service report generation (Excel + ad-hoc).

### 3.2 Non-Goals (out of scope for v1)
- Cross-organization data sharing or federated analytics.
- Mobile-native apps (responsive web only).
- Real-time collaborative editing of plans.
- Direct integration with external grant management systems.
- Custom ML model training UI (the model itself is plugged in by engineering).

---

## 4. Target Users & Personas

| Persona | Role | Primary Needs |
|---|---|---|
| **Research Reviewer** | Reads plans and confirms/overrides classifications | Fast upload, clear confidence indicators, easy override with reason |
| **Program Manager** | Oversees a portfolio of plans | Dashboards, throughput metrics, accuracy trends, downloadable reports |
| **Taxonomy Administrator** | Maintains the PCORI / ICD-10 hierarchy | CRUD on categories, tree view, ability to deactivate codes |
| **System Administrator** | Manages users and access | User CRUD, role assignment, activate/deactivate accounts |
| **Executive / Stakeholder** | Consumes reports | Polished Excel / PDF reports, high-level KPIs |

---

## 5. User Stories (Representative)

- **As a Reviewer**, I want to upload a research plan PDF and see the system classify it automatically, so I can review the result instead of reading every page.
- **As a Reviewer**, I want to override an automated classification with a reason, so the audit trail captures why the human decision differed.
- **As a Program Manager**, I want to see accuracy trends over time and a confidence distribution chart, so I can trust the system and identify drift.
- **As a Taxonomy Admin**, I want to add a new ICD-10 subcategory under an existing parent, so new conditions can be classified.
- **As an Admin**, I want to lock a user account after repeated failed logins, so the system stays secure.
- **As a Stakeholder**, I want to download a one-click Excel report of all classifications in a date range, so I can present it externally.

---

## 6. Functional Requirements

### FR-1 — Authentication & Authorization
| ID | Requirement |
|---|---|
| FR-1.1 | Users can register with username, email, password, first/last name. |
| FR-1.2 | Users can log in and receive a JWT (1-hour validity by default, configurable). |
| FR-1.3 | Failed login attempts are tracked; accounts auto-lock after a configurable threshold. |
| FR-1.4 | Users can request password reset; reset token expires after a configurable TTL. |
| FR-1.5 | Email verification flow for new accounts. |
| FR-1.6 | Logout invalidates the client session and clears local tokens. |
| FR-1.7 | All non-auth endpoints require a valid `Authorization: Bearer <jwt>` header. |
| FR-1.8 | Role-based access control (roles ↔ permissions many-to-many) gates admin features. |

### FR-2 — Research Plan Upload & Classification
| ID | Requirement |
|---|---|
| FR-2.1 | Reviewers upload PDF research plans (multipart). |
| FR-2.2 | The system extracts PDF text and runs classification. |
| FR-2.3 | A `Classification` record is created with an auto-generated `planId` (format `RP-YYYY-###`). |
| FR-2.4 | Each classification stores: PCC, taxonomy category/code/subcode, project summary, population, intervention, comparator, primary/secondary outcomes, confidence score, model version, processing time. |
| FR-2.5 | Statuses: `PENDING`, `PROCESSING`, `CLASSIFIED`, `FAILED`, `NEEDS_REVIEW`. |
| FR-2.6 | Reviewers can manually override classification fields and supply a reason; `reviewedBy` and `reviewedAt` are recorded. |
| FR-2.7 | Failed classifications can be retried. |
| FR-2.8 | Classifications can be filtered, searched, paginated, and sorted. |

### FR-3 — Taxonomy Management
| ID | Requirement |
|---|---|
| FR-3.1 | Admins CRUD PCORI/ICD-10 taxonomy categories. |
| FR-3.2 | Categories support a parent-child hierarchy (tree). |
| FR-3.3 | Categories can be activated/deactivated without deletion. |
| FR-3.4 | Search by code, name, or category text. |
| FR-3.5 | Retrieve children of a node and full tree view. |

### FR-4 — Dashboards & Analytics
| ID | Requirement |
|---|---|
| FR-4.1 | Dashboard shows totals by status (total, classified, processing, pending, failed, needs-review). |
| FR-4.2 | Average confidence score is displayed. |
| FR-4.3 | A "Recent Classifications" feed shows the latest N items. |
| FR-4.4 | Analytics page shows accuracy trend, category accuracy, confidence distribution, processing volume, recent overrides, model performance. |
| FR-4.5 | Per-user dashboard configurations (widget layouts) are persisted. |
| FR-4.6 | Metrics can be queried by date range. |

### FR-5 — Pipeline Monitoring
| ID | Requirement |
|---|---|
| FR-5.1 | View status, stages, and health of the classification pipeline. |
| FR-5.2 | Start, stop, pause, resume a pipeline run. |
| FR-5.3 | Retry an individual failed stage. |
| FR-5.4 | View pipeline logs, run history, and DB connection health. |
| FR-5.5 | Trigger a manual sync. |

### FR-6 — Reports
| ID | Requirement |
|---|---|
| FR-6.1 | Generate Excel reports from classification data. |
| FR-6.2 | Download generated reports (`Content-Disposition` exposed in CORS). |
| FR-6.3 | Save reusable report templates. |
| FR-6.4 | Build ad-hoc reports with selectable columns and filters. |

### FR-7 — User Management (Admin)
| ID | Requirement |
|---|---|
| FR-7.1 | CRUD users; assign roles. |
| FR-7.2 | Toggle active/inactive status. |
| FR-7.3 | Search and filter users. |

### FR-8 — Notifications
| ID | Requirement |
|---|---|
| FR-8.1 | Users receive in-app notifications for relevant events (classification done, pipeline failure, etc.). |
| FR-8.2 | Per-user notification preferences are configurable. |

### FR-9 — Help Center
| ID | Requirement |
|---|---|
| FR-9.1 | Browse help articles and FAQs. |
| FR-9.2 | Submit documentation feedback. |

### FR-10 — File Management
| ID | Requirement |
|---|---|
| FR-10.1 | Uploaded files are tracked in an `UploadedFile` entity. |
| FR-10.2 | Files are persisted to object storage (S3 or compatible). |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | JWT stateless auth; BCrypt password hashing; CORS restricted to known origins; secret material via env vars (not source); account lockout; HTTPS in production; XSS-resistant token storage (HttpOnly cookies recommended). |
| **Performance** | Classification request response < 2 s for a 10-page PDF (excluding model latency); dashboard initial load < 1.5 s; paginated lists default page size 25. |
| **Scalability** | Stateless backend horizontally scalable behind a load balancer; database connections pooled (HikariCP defaults). |
| **Reliability** | Failed classifications retryable; pipeline failures logged with stage-level retry. |
| **Auditability** | Every classification stores `uploadedBy`, `reviewedBy`, timestamps, override reason, model version. |
| **Compatibility** | Supported browsers: latest Chrome, Firefox, Edge, Safari. Responsive layout for ≥1280 px primary, graceful degradation to ≥768 px. |
| **Accessibility** | WCAG 2.1 AA target; component library must provide keyboard nav + ARIA. |
| **Internationalization** | English-only for v1; copy externalized for future i18n. |
| **Observability** | `/actuator/health` endpoint; structured logs; metric counters for classification throughput. |
| **Data retention** | Classifications retained indefinitely; soft-delete preferred over hard-delete. |

---

## 8. UI / UX Specifications

### 8.1 Design System

| Aspect | Choice |
|---|---|
| **Framework** | Next.js 16 App Router, React 19, TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Component primitives** | Radix UI (Dialog, Dropdown, Tabs, Toast, Tooltip, etc.) |
| **Charts** | Recharts |
| **Icons** | lucide-react |
| **Toasts** | sonner (top-right, rich colors) |
| **Fonts** | Geist (sans), Geist Mono |
| **Form handling** | react-hook-form + zod validation |
| **Theming** | next-themes (light/dark with respective favicons) |

### 8.2 Information Architecture (Navigation)

```
┌────────────────────────────────────────────────────────────┐
│ Header: Logo │ Dashboard │ Classifications │ Taxonomy │    │
│              │ Pipeline │ Analytics │ Reports │ Users │... │
│                                          [User menu / Logout] │
├────────────────────────────────────────────────────────────┤
│ <route content>                                            │
├────────────────────────────────────────────────────────────┤
│ Footer: branding, links                                    │
└────────────────────────────────────────────────────────────┘
```

Public routes (no auth): `/`, `/login`, `/signup`.
Protected routes: `/dashboard`, `/classifications`, `/taxonomy`, `/data-pipeline`, `/analytics`, `/reports`, `/research`, `/users`, `/help`.

### 8.3 Screen Specifications

#### 8.3.1 Landing Page (`/`)
- Hero section with product name, tagline, CTA buttons (Login / Sign Up).
- Features grid: 3–4 cards summarizing capabilities.
- Footer with org branding.

#### 8.3.2 Login (`/login`)
- Centered card.
- Inputs: Username, Password (with show/hide toggle).
- Button: "Sign In".
- Link: "Forgot password?", "Create account".
- Error toast on failure (sonner).

#### 8.3.3 Sign Up (`/signup`)
- Centered card form.
- Inputs: Username, Email, Password, First Name, Last Name, optional Department / Role.
- Client-side validation via zod.
- On success → toast + redirect to `/login`.

#### 8.3.4 Dashboard (`/dashboard`)
Layout (12-col grid):
- **Row 1 — KPI cards (4 across):** Total Plans, Classified, Processing, Average Confidence.
- **Row 2 — Status breakdown (3 across):** Pending, Failed, Needs Review (badges with counts).
- **Row 3 — Quick actions (4 cards):** Upload Plan, View Classifications, Generate Reports, Manage Taxonomy.
- **Row 4 — Recent Classifications table:** Plan ID, Title, Status badge, PCC, Taxonomy Category, Confidence %, Classified At, action arrow.
- Each card supports a loading skeleton state and an empty state ("No classifications yet").

#### 8.3.5 Classifications (`/classifications`)
- Top bar: page title + primary CTA "Upload Plan" (opens `UploadPlanDialog`) and secondary CTA "Batch Upload".
- Filter bar: status dropdown, search box, date range picker.
- Table columns: Plan ID, Title, Status, PCC, Taxonomy Code, Confidence, Uploaded At, Reviewed By, Actions.
- Status badge colors: `CLASSIFIED` (green), `PROCESSING` (blue, pulsing), `PENDING` (gray), `FAILED` (red), `NEEDS_REVIEW` (amber).
- Row click → `ViewClassificationDialog`.
- Row action menu: View, Override (`ManualOverrideDialog`), Retry (if failed), Delete.
- Pagination: page size selector (10/25/50), prev/next.

#### 8.3.6 Upload Plan Dialog
- File dropzone (PDF only, max size shown).
- Inputs: Title (defaults to filename), Notes (textarea).
- Progress bar during upload.
- On completion: toast + dialog closes + list refreshes.

#### 8.3.7 Manual Override Dialog
- Shows current classification side-by-side with editable fields.
- Required: Override Reason (textarea).
- Submit calls `PUT /classifications/{id}/override`.

#### 8.3.8 Taxonomy (`/taxonomy`)
- Two-pane layout:
  - **Left:** hierarchical tree (collapsible nodes) with search.
  - **Right:** node detail with edit form.
- Buttons: Add Category, Edit, Toggle Active, Delete.
- Tree refresh on save.

#### 8.3.9 Data Pipeline (`/data-pipeline`)
- Pipeline status header (Running/Paused/Stopped with colored indicator).
- Stage list (cards) with state, last run, duration, retry button per stage.
- Health panel: DB connections, queue depth.
- Action buttons: Start, Stop, Pause, Resume, Sync Now.
- Logs panel (collapsible, monospaced).

#### 8.3.10 Analytics (`/analytics`)
- Tabs or sections:
  - **Accuracy Trend** — line chart over selectable date range.
  - **Category Accuracy** — horizontal bar chart per PCC/category.
  - **Confidence Distribution** — histogram.
  - **Processing Volume** — area chart by day.
  - **Recent Overrides** — table of last N overrides with reason.
  - **Model Performance** — KPI cards (precision/recall/F1 if available).
- Date range picker applies to all visualizations.

#### 8.3.11 Reports (`/reports`)
- Tabs: My Reports | Templates | Ad-hoc Builder.
- Builder: select columns, filters (status, date range, PCC), preview, Generate Excel (downloads `.xlsx`).
- Templates list: name, last run, run-now button.

#### 8.3.12 Users (`/users`) — Admin only
- Table: Username, Email, Full Name, Roles, Active, Last Login, Created At, Actions.
- Buttons: Add User, Edit, Toggle Active, Delete.
- Dialogs: `AddUserDialog`, `EditUserDialog`, `DeleteUserDialog`, `ViewUserDialog`.
- Role multi-select tied to backend `Role` entity.

#### 8.3.13 Help (`/help`)
- Sidebar: article categories.
- Main: article content (markdown rendered).
- FAQ accordion.
- "Was this helpful?" feedback widget.

### 8.4 Interaction & Feedback Patterns

| Pattern | Specification |
|---|---|
| **Loading** | Spinner for ≤2 s; skeleton placeholders for table rows and cards. |
| **Empty state** | Icon + message + primary CTA ("No plans yet — Upload your first plan"). |
| **Error** | sonner toast (red) with retry action where applicable. |
| **Success** | sonner toast (green) for create/update/delete. |
| **Destructive actions** | Confirmation dialog with explicit "Delete" red button. |
| **Forms** | Inline field-level errors; submit disabled until valid. |
| **Long lists** | Virtualization for >100 rows (where applicable). |
| **Session expiry** | 401 from API auto-redirects to `/login` with toast "Session expired". |

### 8.5 Visual & Color Tokens (Tailwind)

| Token | Use |
|---|---|
| `primary` | Brand color, primary CTAs |
| `secondary` | Secondary actions, links |
| `chart-1..5` | Chart series colors |
| `destructive` | Delete buttons, error states |
| `muted` | Disabled / secondary text |
| `accent` | Hover highlights |

Dark mode supported via `next-themes`; icons swap automatically (light/dark favicons).

### 8.6 Accessibility

- All interactive components use Radix primitives (focus management, ARIA, keyboard nav for free).
- Color is never the sole indicator (status badges include text labels).
- Form labels are explicit (`htmlFor` / `aria-label`).
- Target WCAG 2.1 AA contrast (4.5:1 for text).
- All dialogs trap focus and close on Escape.

### 8.7 Responsive Behavior

- **≥1280 px (primary):** full multi-column layouts.
- **768–1279 px:** sidebar collapses to top tabs; KPI grids reflow 4→2.
- **<768 px:** mobile drawer navigation; tables become stacked cards; charts stretch to full width.

---

## 9. Data Model (High-Level)

```
User ──< user_roles >── Role ──< role_permissions >── Permission
  │
  └──< Classification >── (uploadedBy / reviewedBy)
                   │
                   └── references TaxonomyCategory (by code)

TaxonomyCategory ──┐ self-referential (parent/child)
                   └── tree

UploadedFile ── linked to Classification

DashboardConfiguration ── per User
DashboardMetric ── time-series records

ReportConfiguration → ExcelReport (generated artifacts)
FilterConfiguration ── saved filter sets

Notification ── per User
NotificationPreference ── per User per channel

HelpArticle, FAQ, DocumentationFeedback ── help center content
```

### 9.1 Required Entities

| Entity | Key Fields |
|---|---|
| **User** | id (UUID), username, email, password (BCrypt), firstName, lastName, phoneNumber, isActive, isEmailVerified, emailVerificationToken, passwordResetToken, passwordResetExpiresAt, lastLoginAt, loginAttempts, lockedUntil, createdAt, updatedAt, roles (M:N) |
| **Role** | id, name, description, permissions (M:N) |
| **Permission** | id, name, resource, action |
| **Classification** | id (UUID), planId (`RP-YYYY-###`), title, status (enum), pcc, taxonomyCategory, taxonomyCode, taxonomySubcode, primaryCondition, secondaryConditions, icdCodes, projectSummary, populationSetting, intervention, comparator, primaryOutcome, secondaryOutcomes, confidenceScore, fileName, fileSize, filePath, notes, uploadedBy (FK User), uploadedAt, classifiedAt, reviewedBy (FK User), reviewedAt, overrideReason, processingTime (ms), modelVersion, createdAt, updatedAt |
| **TaxonomyCategory** | id, code, name, description, parentId (self-FK), isActive, level, displayOrder |
| **UploadedFile** | id, filename, originalName, contentType, size, path, uploadedBy, uploadedAt |
| **DashboardConfiguration** | id, userId, layout (JSON), widgets, createdAt, updatedAt |
| **DashboardMetric** | id, name, value, category, recordedAt |
| **ReportConfiguration** | id, name, ownerId, columns (JSON), filters (JSON), createdAt |
| **ExcelReport** | id, configurationId, generatedAt, filePath, status |
| **FilterConfiguration** | id, userId, name, criteria (JSON) |
| **Notification** | id, userId, type, title, message, isRead, createdAt |
| **NotificationPreference** | id, userId, channel, enabled |
| **HelpArticle** | id, title, slug, category, content (markdown), publishedAt |
| **FAQ** | id, question, answer, category, displayOrder |
| **DocumentationFeedback** | id, articleId, userId, helpful (boolean), comment, submittedAt |

---

## 10. API Surface (Required Endpoints)

All endpoints under `/api/*`. Stateless JWT auth via `Authorization: Bearer <token>`.

### 10.1 `/api/auth`
- `POST /login` — authenticate, return JWT
- `POST /register` — create new user
- `POST /logout` — invalidate session
- `POST /refresh` — refresh JWT
- `GET  /verify-email` — confirm email via token
- `POST /forgot-password` — initiate reset

### 10.2 `/api/users`
- `GET /`, `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}`
- `PATCH /{id}/status`, `GET /search`, `GET /active`

### 10.3 `/api/dashboard`
- `GET /metrics`, `GET /metrics/range`
- `GET /configuration`, `GET /configuration/{id}`
- `POST /configuration`, `PUT /configuration/{id}`, `DELETE /configuration/{id}`

### 10.4 `/api/taxonomy`
- `GET /`, `GET /tree`, `GET /{id}`, `GET /code/{code}`
- `POST /`, `PUT /{id}`, `DELETE /{id}`
- `GET /{id}/children`, `GET /search`, `GET /active`, `PATCH /{id}/status`

### 10.5 `/api/classifications`
- `GET /`, `GET /{id}`, `GET /{id}/results`
- `POST /upload` — multipart PDF
- `PUT /{id}/override`, `DELETE /{id}`
- `GET /search`, `GET /status/{status}`, `POST /{id}/retry`
- `GET /statistics`, `GET /recent`

### 10.6 `/api/pipeline`
- `GET /status`, `GET /{id}`, `GET /{id}/stages`, `GET /health`, `GET /stats`
- `GET /connections`, `POST /connections/{id}/check`
- `POST /{id}/start`, `POST /{id}/stop`, `POST /{id}/pause`, `POST /{id}/resume`
- `POST /{id}/stages/{stageId}/retry`
- `GET /{id}/logs`, `GET /{id}/history`, `POST /sync`

### 10.7 `/api/analytics`
- `GET /overview`, `GET /accuracy-trend`, `GET /category-accuracy`
- `GET /confidence-distribution`, `GET /processing-volume`
- `GET /overrides`, `GET /report`, `GET /model-performance`

### 10.8 `/api/excel`, `/api/reports`, `/api/files`, `/api/filters`, `/api/help`, `/api/notifications`
Standard CRUD + domain actions per their respective entities.

**Target:** ~16 controllers, ~80+ endpoints total.

---

## 11. Success Metrics (KPIs)

| KPI | Target |
|---|---|
| **Avg. classification turn-around** | ≤ 5 minutes per plan (vs. ~1 hour manual) |
| **Auto-classification accuracy** | ≥ 85% agreement with human reviewer (no override needed) |
| **Override rate** | < 15% of classified plans |
| **Average confidence score** | ≥ 0.80 |
| **System uptime** | ≥ 99.5% during business hours |
| **P95 API response time** | < 500 ms (excluding model inference) |
| **Active reviewers / week** | ≥ 80% of provisioned reviewer accounts |
| **Report generation time** | < 10 s for a 1,000-row Excel export |

---

## 12. Assumptions

- An ML model (third-party API or self-hosted) will be integrated for classification; a keyword fallback is acceptable for early iterations.
- Object storage (S3 or equivalent) will be used for uploaded PDFs.
- An SMTP service will be wired in for email verification + password reset.
- Production database will be PostgreSQL or MySQL.
- Single tenant for v1; multi-tenant out of scope.

---

## 13. Dependencies & Constraints

### 13.1 Technical dependencies
- Java 21 runtime
- Node.js 20+ (frontend build)
- Postgres or MySQL (production)
- ML model API endpoint
- S3-compatible object storage
- SMTP relay

### 13.2 Constraints
- JWT secret must come from environment, never source control.
- CORS must restrict to known production origins.
- All PHI/PII handling must satisfy applicable healthcare data regulations (HIPAA-aligned controls — to be reviewed by compliance).
- All `/api/**` endpoints (except public auth routes) must require authentication.

---

## 14. Open Questions

| # | Question | Owner |
|---|---|---|
| 1 | Which ML model will back classification (in-house vs. OpenAI / Anthropic / Bedrock)? | Engineering + PCORI |
| 2 | What is the canonical source for the PCORI taxonomy seed data? | Taxonomy Admin |
| 3 | Will file storage be S3 (AWS), Azure Blob, or local NFS? | DevOps |
| 4 | What is the email service of record (SES, SendGrid, Mailgun)? | DevOps |
| 5 | Is HIPAA compliance required at launch, or can we ship with a non-PHI dataset first? | Compliance |
| 6 | Do we need SSO (SAML / OIDC) for v1? | Product |

---

## 15. Release Plan

### Phase 1 — Foundation
- Project scaffolding (Spring Boot backend, Next.js frontend, Docker).
- Database schema for User, Role, Permission, TaxonomyCategory.
- JWT authentication: register, login, logout, refresh.
- CORS configured for frontend origin.
- Landing, Login, Signup pages.

### Phase 2 — Core Domain
- Classification entity, repository, service, controller.
- PDF upload + text extraction.
- Initial keyword-based classification engine.
- Classifications list / detail / override dialog UI.
- Taxonomy CRUD + tree view UI.

### Phase 3 — Insights
- Dashboard KPIs + recent classifications feed.
- Analytics charts (accuracy trend, confidence distribution, processing volume, overrides, model performance).
- Pipeline monitoring screens.

### Phase 4 — Reporting & Admin
- Excel report generation + download.
- Ad-hoc report builder.
- Saved templates + filter configurations.
- User management (admin) screens.
- Notifications + preferences.
- Help center.

### Phase 5 — Productionization
- Swap dev DB (H2) for PostgreSQL/MySQL.
- Plug real ML model into classification service.
- Wire object storage for PDFs.
- Wire SMTP for email.
- Externalize all secrets, restrict CORS.
- Seed production taxonomy + initial roles/permissions.
- End-to-end + integration test coverage.
- Observability: structured logs, metrics, health checks.

### Phase 6 — v2 Enhancements (post-launch)
- WebSocket-based real-time pipeline updates.
- SSO (SAML/OIDC) integration.
- Advanced analytics: drift detection, model A/B testing.
- Bulk batch upload via SFTP drop.
- API access for external grant management systems.

---

## 16. Glossary

| Term | Meaning |
|---|---|
| **PCORI** | Patient-Centered Outcomes Research Institute |
| **PCC** | Primary Clinical Condition (e.g., Type 2 Diabetes, Heart Failure) |
| **Taxonomy Category** | High-level grouping (e.g., Shared Decision Making, Telehealth) |
| **Taxonomy Code / Subcode** | Short codes describing intervention type (e.g., SDM, Telemonitoring → DigitalTool, NurseLed) |
| **Classification** | A processed research plan with assigned taxonomy fields |
| **Override** | Manual correction of an automated classification by a reviewer |
| **Pipeline** | The end-to-end automated processing flow from upload → classified |
| **ICD-10** | International Classification of Diseases, 10th Revision — used for clinical condition coding |

---

*End of PRD — version 1.0*
