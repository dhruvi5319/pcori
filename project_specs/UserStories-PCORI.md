# User Stories
## PCORI Research Analytics Platform

| Field | Value |
|---|---|
| **Product Name** | PCORI Research Analytics Platform |
| **Project Acronym** | PCORI |
| **Document Version** | 1.0 |
| **Document Type** | User Stories |
| **Date** | 2026-05-20 |
| **Source PRD** | `project_specs/PRD-PCORI.md` v1.0 |
| **Source FRD** | `project_specs/FRD-PCORI.md` v1.0 |
| **Source Personas** | `project_specs/PERSONAS-PCORI.md` v1.0 |

---

## Personas Reference

| ID | Name | Role |
|---|---|---|
| PER-01 | **Maya** Okonkwo | Research Reviewer |
| PER-02 | **David** Reyes | Program Manager |
| PER-03 | **Priya** Nair | Taxonomy Administrator |
| PER-04 | **Tom** Schaefer | System Administrator |
| PER-05 | **Catherine** Wu | Executive / Stakeholder |

---

## Epic 0: Authentication & Authorization (F0)

*The security foundation. Covers registration, login, JWT validation, RBAC, password reset, email verification, and account lockout. Blocks all other epics.*

---

### US-0.1: User Registration
**As a** new user, **I want to** self-register with my username, email, and password, **so that** I can create an account and gain access to the platform after email verification.

**Acceptance Criteria:**
- [ ] Registration form accepts: username (3–50 chars, alphanumeric + underscore), email (RFC 5322), password (8–128 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit), first name, last name
- [ ] Duplicate username returns `409 USERNAME_TAKEN` with a field-level error message
- [ ] Duplicate email returns `409 EMAIL_TAKEN` with a field-level error message
- [ ] Password that fails complexity rules returns `400 VALIDATION_ERROR` with specific guidance
- [ ] Successful registration returns `201 Created` with sanitized user object (no password hash)
- [ ] A verification email is sent immediately after successful registration
- [ ] New account is created with `isActive=false` and `isEmailVerified=false` until email is confirmed

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.2: Email Verification
**As a** newly registered user, **I want to** verify my email address by clicking the link in the verification email, **so that** my account is activated and I can log in.

**Acceptance Criteria:**
- [ ] Clicking the verification link calls `GET /api/auth/verify-email?token={token}`
- [ ] Valid, unconsumed token sets `isEmailVerified=true` and clears the token from the record
- [ ] Expired or already-used token returns `400 INVALID_TOKEN` with a clear message
- [ ] Successfully verified account can proceed to log in
- [ ] Token is single-use; a second attempt with the same token fails gracefully

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.3: User Login
**As a** Maya, **I want to** log in with my username and password and receive a JWT, **so that** I can access protected platform features without re-entering credentials on every request.

**Acceptance Criteria:**
- [ ] Login form accepts username and password; submit is disabled until both fields are non-empty
- [ ] Successful login returns `200 OK` with `accessToken`, `refreshToken`, `expiresIn`, and user object (with roles)
- [ ] Invalid credentials return `401 INVALID_CREDENTIALS`; login attempt counter is incremented
- [ ] Account locked after reaching `MAX_LOGIN_ATTEMPTS` (default 5); returns `403 ACCOUNT_LOCKED` with remaining lock time
- [ ] Unverified email returns `403 EMAIL_NOT_VERIFIED` with clear guidance
- [ ] Inactive account returns `403 ACCOUNT_INACTIVE`
- [ ] Successful login resets the failed-login counter and updates `lastLoginAt`

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.4: JWT Token Refresh
**As a** Maya, **I want to** refresh my access token silently when it nears expiry, **so that** my session persists without forcing me to log in again mid-workflow.

**Acceptance Criteria:**
- [ ] Client can `POST /api/auth/refresh` with a valid refresh token to obtain a new access token
- [ ] Response contains new `accessToken` and `expiresIn`; no new login credentials required
- [ ] Expired or invalid refresh token returns `401 TOKEN_INVALID` and clears client tokens
- [ ] Refreshed token carries the same role claims as the original

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.5: Password Reset via Email
**As a** Maya, **I want to** reset my password via an emailed link when I forget it, **so that** I can regain access without contacting an administrator.

**Acceptance Criteria:**
- [ ] Submitting `POST /api/auth/forgot-password` with any email always returns `200 OK` (prevents email enumeration)
- [ ] If the email matches a user, a password reset link with a single-use token is emailed
- [ ] Reset link expires after `PASSWORD_RESET_TTL_MINUTES` (default 60 min)
- [ ] Submitting a new password via the reset token succeeds if the token is valid and the password meets complexity rules
- [ ] Token is invalidated after successful reset; reuse returns `400 INVALID_TOKEN`
- [ ] New password must pass complexity validation (8–128 chars, uppercase, lowercase, digit)

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.6: Logout
**As a** Maya, **I want to** log out of the platform, **so that** my session is terminated and the JWT is invalidated server-side.

**Acceptance Criteria:**
- [ ] `POST /api/auth/logout` (with valid JWT) invalidates the server-side refresh token
- [ ] Response is `200 OK`; client clears all tokens from storage
- [ ] Subsequent requests with the old access token are rejected with `401 TOKEN_EXPIRED` after natural JWT expiry
- [ ] Logout is accessible from every page via the navigation header

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.7: Role-Based Access Control
**As a** Tom, **I want to** enforce role-based permissions on every API call, **so that** reviewers cannot access admin features and executives cannot perform data modifications.

**Acceptance Criteria:**
- [ ] `@PreAuthorize` enforced at the service layer (not controller-only) for every protected operation
- [ ] Requests with insufficient role return `403 ACCESS_DENIED`
- [ ] JWT payload contains the user's current role claims; roles are re-evaluated on each request
- [ ] `REVIEWER` role can upload, view classifications, and submit overrides; cannot access admin endpoints
- [ ] `MANAGER` role inherits reviewer permissions plus dashboards, analytics, and report generation
- [ ] `ADMIN` role has all permissions including user management and pipeline control
- [ ] `TAXONOMY_ADMIN` role has full CRUD on taxonomy; cannot manage users or control the pipeline
- [ ] `VIEWER` role has read-only access to dashboard and reports; cannot upload or override

**Priority:** P0 | **Feature Ref:** F0

---

## Epic 1: Research Plan Upload & Classification (F1)

*The core value proposition. Covers PDF upload, async pipeline, status polling, manual override, retry, and filtered list views.*

---

### US-1.1: Upload a Research Plan PDF
**As a** Maya, **I want to** upload a PDF research plan via drag-and-drop or file picker, **so that** the system can automatically classify it against the PCORI taxonomy without me doing it manually.

**Acceptance Criteria:**
- [ ] Upload UI supports drag-and-drop and file picker; accepts PDF files only
- [ ] Non-PDF file type is rejected with a clear error: "Only PDF files are accepted" (validated via Apache Tika, not extension only)
- [ ] Files exceeding the size limit (default 50 MB) are rejected with `413 FILE_TOO_LARGE`
- [ ] A visible upload progress bar is shown during file transfer
- [ ] System returns `202 Accepted` with `classificationId`, `planId` (format `RP-YYYY-###`), and `status: "PENDING"` within 2 seconds for a 10-page PDF
- [ ] Optional `title` (max 255 chars) and `notes` (max 2000 chars) fields are available; title defaults to filename if omitted
- [ ] Upload confirmation shows the assigned plan ID to Maya

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.2: Monitor Classification Status
**As a** Maya, **I want to** see the real-time status of my uploaded research plan as it moves through the pipeline, **so that** I know when the classification is ready for my review.

**Acceptance Criteria:**
- [ ] Classification list displays status badge for each plan: `PENDING`, `PROCESSING`, `CLASSIFIED`, `FAILED`, `NEEDS_REVIEW`
- [ ] Status badges include text labels (color is never the sole indicator — WCAG 2.1 AA)
- [ ] Frontend polls classification status every 5–10 seconds while any plan is in `PROCESSING` state
- [ ] Polling stops automatically when all plans reach a terminal state (`CLASSIFIED`, `FAILED`, `NEEDS_REVIEW`)
- [ ] A plan stuck in `PROCESSING` beyond the configurable timeout is surfaced with a warning indicator
- [ ] Startup recovery job automatically re-queues `PROCESSING` records stuck beyond `STUCK_TIMEOUT_MINUTES` on application restart

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.3: Review AI Classification Results
**As a** Maya, **I want to** view the AI-generated taxonomy classification for a research plan — including its confidence score — **so that** I can decide whether to accept or override it.

**Acceptance Criteria:**
- [ ] Classification detail shows: PCC, taxonomy category, code, subcode, confidence score (displayed as "AI Confidence", not "Accuracy"), model version, processing time
- [ ] Also shows: project summary, population setting, intervention, comparator, primary outcome, secondary outcomes extracted by the pipeline
- [ ] Confidence score is shown as a percentage with a clear visual indicator (e.g., color band or label)
- [ ] Classifications below the configurable `NEEDS_REVIEW` threshold (default 0.75) are shown with `NEEDS_REVIEW` status and a prompt to review
- [ ] Plans that failed text quality gate show an `extractionWarning` message explaining why they need review
- [ ] Uploaded PDF is downloadable from the detail view via a pre-signed URL (15-min TTL)

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.4: Override an AI Classification
**As a** Maya, **I want to** correct any of the four taxonomy dimensions (PCC, category, code, subcode) and provide a required reason, **so that** the override is documented in the audit trail and the classification reflects my expert judgment.

**Acceptance Criteria:**
- [ ] Override form allows editing: PCC, taxonomy category, taxonomy code, taxonomy subcode (all four independently editable)
- [ ] Override reason field is required; form submission is blocked if reason is blank or missing (`400 VALIDATION_ERROR`)
- [ ] Override reason accepts 1–2000 characters
- [ ] Taxonomy fields in the override form are validated against active taxonomy codes only; inactive codes are not selectable
- [ ] Submitting override sets `reviewedBy = current user`, `reviewedAt = now`, `status = CLASSIFIED`
- [ ] Successfully saved override shows a confirmation toast
- [ ] Override history is preserved and visible in the classification audit trail

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.5: Retry a Failed Classification
**As a** Maya, **I want to** retry a failed classification, **so that** I don't lose work on a plan that failed due to a transient pipeline error.

**Acceptance Criteria:**
- [ ] Retry button is visible only on classifications with `status = FAILED`
- [ ] Clicking Retry calls `POST /api/classifications/{id}/retry`; resets status to `PENDING` and re-queues in the pipeline
- [ ] Response is `202 Accepted`; status polling resumes automatically
- [ ] Attempting retry on a non-`FAILED` status returns `400 INVALID_STATUS`
- [ ] The error message from the previous failure is cleared on retry

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.6: Search and Filter the Classification Queue
**As a** Maya, **I want to** filter and search my classification queue by status, date range, PCC, and keyword, **so that** I can triage efficiently and find specific plans quickly.

**Acceptance Criteria:**
- [ ] Filter bar includes: status multi-select (`PENDING`, `PROCESSING`, `CLASSIFIED`, `FAILED`, `NEEDS_REVIEW`), date range picker (`startDate` / `endDate`), PCC dropdown
- [ ] Keyword search field matches on plan ID and title
- [ ] Default sort is `uploadedAt DESC`; column-level sort is available
- [ ] Paginated results default to 25 per page; page size adjustable up to 100
- [ ] Active filters are visually indicated; a "Clear Filters" action resets all filters
- [ ] Filter state is preserved when navigating to a classification detail and returning to the list

**Priority:** P0 | **Feature Ref:** F1

---

## Epic 2: Taxonomy Management (F2)

*Single source of truth for PCORI/ICD-10 taxonomy. Covers full CRUD, hierarchical tree view, activate/deactivate, and search.*

---

### US-2.1: Add a New Taxonomy Category
**As a** Priya, **I want to** add a new taxonomy category with its code, name, description, level, and parent assignment, **so that** the classification pipeline can target the new category immediately.

**Acceptance Criteria:**
- [ ] Create form accepts: code (1–50 chars, alphanumeric + hyphens), name (1–255 chars), description (max 2000 chars), level (0–3), parent category (optional), display order
- [ ] `code` must be unique among siblings (same parent); duplicate returns `409 CODE_DUPLICATE`
- [ ] Level must equal `parent.level + 1` when a parent is selected; mismatch returns `400 INVALID_LEVEL`
- [ ] Invalid or inactive parent returns `400 INVALID_PARENT`
- [ ] Successful creation returns `201 Created` with the full entity; new category appears in the tree view immediately
- [ ] New categories default to `isActive=true`

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.2: Browse the Taxonomy Hierarchy
**As a** Priya, **I want to** view the full PCORI/ICD-10 taxonomy as a hierarchical tree in a two-pane UI, **so that** I can verify parent-child relationships and navigate the structure easily.

**Acceptance Criteria:**
- [ ] Tree view renders the full taxonomy hierarchy from `GET /api/taxonomy/tree`
- [ ] Root nodes (level 0) displayed at top; children nested recursively with visual indentation
- [ ] Nodes sorted by `displayOrder` within each sibling group
- [ ] Selecting a node in the left pane shows its details (code, name, description, level, status) in the right pane
- [ ] Tree refreshes automatically after any CRUD operation (create, update, activate/deactivate)
- [ ] Inactive nodes are visually distinguished (e.g., grayed out) but still visible in the tree

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.3: Edit a Taxonomy Category
**As a** Priya, **I want to** edit the name, description, or display order of an existing taxonomy category, **so that** the taxonomy stays aligned with current PCORI data standards.

**Acceptance Criteria:**
- [ ] Edit form pre-populates existing values for: name, description, display order
- [ ] Code uniqueness is re-validated if the code is changed; conflict returns `409 CODE_DUPLICATE`
- [ ] System prevents circular reference: a node cannot be reassigned as a descendant of itself; returns `400 CIRCULAR_REFERENCE`
- [ ] Successful update returns `200 OK` with the updated entity and tree view refreshes
- [ ] All edits are captured in the audit trail (`updatedAt`, `lastModifiedBy`)

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.4: Deactivate an Obsolete Taxonomy Code
**As a** Priya, **I want to** deactivate an obsolete taxonomy code without deleting it, **so that** historical classification records that reference it remain valid while the code is excluded from future classification targeting.

**Acceptance Criteria:**
- [ ] Deactivate action is available from the category detail pane (toggle or dedicated button)
- [ ] `PATCH /api/taxonomy/{id}/status` with `{isActive: false}` deactivates the category
- [ ] Deactivating a parent cascades deactivation to all descendant nodes in the same transaction
- [ ] Deactivated codes are no longer selectable in classification override dropdowns
- [ ] Deactivated codes remain visible in historical classification records
- [ ] Reactivating a node requires its parent to also be active; otherwise returns `400 INACTIVE_PARENT`
- [ ] `DELETE /api/taxonomy/{id}` behaves as deactivation (not hard delete); no row is removed

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.5: Search the Taxonomy
**As a** Priya, **I want to** search taxonomy categories by code, name, or description text, **so that** I can quickly locate a specific category without scrolling large tree lists.

**Acceptance Criteria:**
- [ ] Search input sends `GET /api/taxonomy/search?q={term}`; minimum 1 character accepted
- [ ] Results include matches across code, name, and description fields at all hierarchy levels
- [ ] `activeOnly=true` filter is on by default; toggle to include inactive categories
- [ ] Results display: code, name, level, parent name, active status
- [ ] Clicking a search result navigates to that node in the tree view
- [ ] "No results" state shown clearly when no matches are found

**Priority:** P0 | **Feature Ref:** F2

---

## Epic 3: Dashboards & Analytics (F3)

*Real-time visibility into classification program health. Covers KPI cards, recent feed, analytics charts, date-range filtering, and per-user widget configuration.*

---

### US-3.1: View Dashboard KPI Cards
**As a** David, **I want to** see a live dashboard with KPI cards showing total plans, classified, processing, pending, failed, needs review, and average AI confidence, **so that** I can assess portfolio health at a glance every morning.

**Acceptance Criteria:**
- [ ] KPI cards display: Total Plans, Classified, Processing, Pending, Failed, Needs Review, Average AI Confidence
- [ ] Each card renders independently with a loading skeleton during fetch
- [ ] Data refreshes via TanStack Query with `staleTime: 30000` (30 seconds)
- [ ] Dashboard initial load completes in under 1.5 seconds
- [ ] "AI Confidence" label is used consistently — never "Accuracy"
- [ ] Empty state shown with contextual guidance when no data exists (e.g., first-day setup)

**Priority:** P1 | **Feature Ref:** F3

---

### US-3.2: Filter Dashboard by Date Range
**As a** David, **I want to** apply a date range filter that cascades to all KPI cards and charts simultaneously, **so that** I can analyze a specific reporting period without adjusting each chart individually.

**Acceptance Criteria:**
- [ ] Date range picker is visible at the top of the dashboard; defaults to last 30 days
- [ ] Changing the date range invalidates and refetches all KPI card queries and all chart queries simultaneously
- [ ] `startDate <= endDate` is enforced; invalid range shows an error and does not submit
- [ ] Date range selection persists within the user's session
- [ ] All chart components accept `startDate` / `endDate` query params from the shared filter state

**Priority:** P1 | **Feature Ref:** F3

---

### US-3.3: View Analytics Charts
**As a** David, **I want to** view analytics charts — accuracy trend, category accuracy, confidence distribution, processing volume, recent overrides, and model performance — **so that** I can identify anomalies and track AI performance over time.

**Acceptance Criteria:**
- [ ] **Accuracy Trend (line chart):** Shows AI accuracy vs. human-corrected accuracy per time bucket (day/week/month); empty state with guidance message shown when no override data exists
- [ ] **Category Accuracy (horizontal bar chart):** Shows override count and accuracy rate per PCC/category
- [ ] **AI Confidence Distribution (histogram):** 10 buckets (0–0.1 through 0.9–1.0); labeled "AI Confidence Distribution"
- [ ] **Processing Volume (area chart):** Count of uploaded plans per time bucket
- [ ] **Recent Overrides (table):** Last N overrides with plan ID, reviewer, original classification, corrected classification, reason, date; paginated
- [ ] **Model Performance KPIs:** Precision, recall, F1; shows "Insufficient data" message when `totalEvaluated < 10`
- [ ] All charts use `isAnimationActive={false}` in production to prevent paint jank
- [ ] Charts load independently; one failing does not block others

**Priority:** P1 | **Feature Ref:** F3

---

### US-3.4: View Recent Classifications Feed
**As a** David, **I want to** see a feed of the most recently uploaded research plans on the dashboard, **so that** I can quickly spot new submissions and their classification outcomes.

**Acceptance Criteria:**
- [ ] Feed shows the last 10 classifications (configurable up to 25) sorted by `uploadedAt DESC`
- [ ] Each item shows: plan ID, title, status badge (with text label), PCC, taxonomy category, AI confidence %, `classifiedAt` timestamp
- [ ] Clicking an item navigates to the classification detail view
- [ ] Feed updates when the date range filter changes
- [ ] Status badge colors plus text labels are used (color is never sole indicator — WCAG 2.1 AA)

**Priority:** P1 | **Feature Ref:** F3

---

### US-3.5: Customize Dashboard Widget Layout
**As a** David, **I want to** configure which widgets are visible and their positions on my dashboard, **so that** the most relevant KPIs for my reporting cadence are front and center.

**Acceptance Criteria:**
- [ ] Widget layout configuration is saved per user (`DashboardConfiguration` entity)
- [ ] Layout JSON stores: widget ID, position, size (within 12-column grid), visible flag
- [ ] `GET /api/dashboard/configuration` returns the user's current layout; creates a default if none exists
- [ ] `PUT /api/dashboard/configuration/{id}` saves layout changes immediately
- [ ] `DELETE /api/dashboard/configuration/{id}` resets to the default layout
- [ ] Each user has at most one active configuration; attempting to create a duplicate returns the existing one

**Priority:** P1 | **Feature Ref:** F3

---

### US-3.6: Executive KPI Dashboard View
**As a** Catherine, **I want to** access a high-level KPI summary dashboard, **so that** I can check program status before a leadership meeting without needing to understand platform internals.

**Acceptance Criteria:**
- [ ] Catherine's `VIEWER` role grants read-only access to `GET /api/dashboard/metrics` and analytics endpoints
- [ ] Dashboard loads in under 1.5 seconds and is current within the last polling interval
- [ ] AI confidence and override rate are prominently displayed in understandable terms
- [ ] No edit or upload controls are visible for the `VIEWER` role
- [ ] Dashboard renders correctly on ≥1280 px screens with graceful degradation to ≥768 px

**Priority:** P1 | **Feature Ref:** F3

---

## Epic 4: Pipeline Monitoring (F4)

*Operational visibility into the classification pipeline. Covers status/health view, control actions, stage-level retry, event logs, and run history.*

---

### US-4.1: View Pipeline Status and Health
**As a** Tom, **I want to** see the current pipeline state, active run count, queue depth, and database connection health on a single monitoring page, **so that** I can spot issues before they impact reviewers.

**Acceptance Criteria:**
- [ ] Pipeline status header shows a colored running/paused/stopped indicator plus the pipeline state label
- [ ] Queue depth (count of `PENDING` classifications awaiting pickup) is displayed
- [ ] DB connection pool stats shown: active, idle, and max connections
- [ ] Stuck record count surfaced: classifications in `PROCESSING` beyond `STUCK_TIMEOUT_MINUTES` are highlighted with a warning indicator
- [ ] Stage cards show: stage name (EXTRACT / CLASSIFY / PERSIST), state, last run timestamp, duration (ms), error message if failed
- [ ] Frontend polls `GET /api/pipeline/status` every 10 seconds while any run is active

**Priority:** P1 | **Feature Ref:** F4

---

### US-4.2: Control Pipeline Execution
**As a** Tom, **I want to** start, stop, pause, and resume the classification pipeline from the admin UI, **so that** I can manage pipeline execution during maintenance or incident response without direct database access.

**Acceptance Criteria:**
- [ ] Start button calls `POST /api/pipeline/{id}/start`; returns `202 Accepted` if queued; returns `409 ALREADY_RUNNING` if a run is already active
- [ ] Stop button gracefully stops the current run: in-flight stage completes; subsequent stages are skipped
- [ ] Pause button pauses processing after the current stage completes; state is persisted
- [ ] Resume button resumes a paused pipeline from where it stopped; `400 INVALID_STATE` if pipeline is not in `PAUSED` state
- [ ] All control actions require `ADMIN` role; `403 ACCESS_DENIED` returned for other roles
- [ ] UI updates pipeline state indicator after each control action

**Priority:** P1 | **Feature Ref:** F4

---

### US-4.3: Retry a Failed Pipeline Stage
**As a** Tom, **I want to** retry a specific failed pipeline stage (EXTRACT, CLASSIFY, or PERSIST) individually, **so that** I can recover from partial failures without re-running the entire pipeline.

**Acceptance Criteria:**
- [ ] Stage-level Retry button is visible only on stage cards with `state = FAILED`
- [ ] Clicking Retry calls `POST /api/pipeline/{id}/stages/{stageId}/retry`
- [ ] System validates stage is in `FAILED` state; `400 INVALID_STAGE_STATE` returned otherwise
- [ ] Stage is reset to `IDLE` and re-queued for execution; response is `202 Accepted`
- [ ] Stage card updates state in real time after retry is triggered

**Priority:** P1 | **Feature Ref:** F4

---

### US-4.4: View Pipeline Logs and Run History
**As a** Tom, **I want to** view pipeline event logs and historical run records, **so that** I can diagnose issues, understand failure patterns, and confirm successful processing.

**Acceptance Criteria:**
- [ ] Pipeline event log panel shows paginated entries: timestamp, level (INFO/WARN/ERROR), message; displayed in monospaced font
- [ ] Log entries never contain extracted PDF text or PHI; messages truncated at 500 chars if oversized
- [ ] Run history view lists past pipeline runs with: runId, startedAt, completedAt, status, records processed, failed count
- [ ] `GET /api/pipeline/stats` shows aggregate stats: total runs, total processed, total failed, average duration
- [ ] Log panel is collapsible for cleaner UI when not in use

**Priority:** P1 | **Feature Ref:** F4

---

### US-4.5: Trigger a Manual Sync
**As a** Tom, **I want to** manually trigger a sync to pick up any `PENDING` classifications that haven't been picked up by the active pipeline run, **so that** I can recover orphaned records without restarting the full pipeline.

**Acceptance Criteria:**
- [ ] "Sync Now" button calls `POST /api/pipeline/sync`; requires `ADMIN` role
- [ ] Response is `202 Accepted` with `{queued: N}` count of records queued
- [ ] A success toast shows how many records were synced
- [ ] If no pending records exist, response returns `{queued: 0}` without error

**Priority:** P1 | **Feature Ref:** F4

---

## Epic 5: Reports (F5)

*Self-service Excel report generation. Covers one-click export, ad-hoc builder, saved templates, and saved filter configurations.*

---

### US-5.1: One-Click Excel Export
**As a** David, **I want to** generate and download an Excel report of classification data in one click, **so that** I can produce the weekly status report in minutes instead of hours.

**Acceptance Criteria:**
- [ ] "Export to Excel" button triggers `POST /api/excel/generate` with current filter state
- [ ] Response is a downloadable `.xlsx` file delivered via `Content-Disposition: attachment; filename="pcori-report-{timestamp}.xlsx"`
- [ ] Report includes columns: plan ID, title, status, PCC, taxonomy category, code, subcode, AI confidence, uploaded by, classified at, reviewed by, override reason
- [ ] Reports ≤1,000 rows generate using XSSF (in-memory); reports >1,000 rows auto-switch to `SXSSFWorkbook` streaming
- [ ] Generation completes in under 10 seconds for a 1,000-row export
- [ ] `SXSSFWorkbook` is properly closed in a `finally` block after streaming to prevent temp file leaks

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.2: Download a Large Report Asynchronously
**As a** David, **I want to** generate large reports asynchronously and download them when ready, **so that** the UI remains responsive and I'm not blocked waiting for a long-running export.

**Acceptance Criteria:**
- [ ] `POST /api/reports` creates an `ExcelReport` record with `status=GENERATING` and returns `202 Accepted` with `reportId`
- [ ] Background job generates the file, uploads it to S3, and sets `status=READY`
- [ ] Client can poll `GET /api/reports/{id}` to check status
- [ ] Once `READY`, `GET /api/reports/{id}/download` returns a pre-signed S3 URL with 15-min TTL
- [ ] Report not yet ready returns `409 REPORT_NOT_READY`
- [ ] Failed generation sets `status=FAILED` and shows a descriptive error message

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.3: Build an Ad-Hoc Report
**As a** David, **I want to** build a custom report by selecting specific columns and applying filters, **so that** I can satisfy ad-hoc executive requests without analyst support.

**Acceptance Criteria:**
- [ ] Ad-hoc builder UI shows column checkboxes for all available fields: planId, title, status, pcc, taxonomyCategory, taxonomyCode, taxonomySubcode, confidenceScore, uploadedBy, uploadedAt, classifiedAt, reviewedBy, reviewedAt, overrideReason, processingTimeMs, modelVersion
- [ ] Filter builder supports: status multi-select, date range picker, PCC multi-select
- [ ] "Preview" button fetches `GET /api/reports/preview` and shows row count and 3 sample rows
- [ ] Row count > 50,000 shows a warning before generation (no hard block in v1)
- [ ] "Generate Excel" button triggers report generation with selected columns and filters applied
- [ ] Invalid column names return `400 INVALID_COLUMN`

**Priority:** P2 | **Feature Ref:** F5

---

### US-5.4: Save and Reuse Report Templates
**As a** David, **I want to** save a named report template with my column selection and filter presets, **so that** I can regenerate the same report format every reporting cycle without reconfiguring it.

**Acceptance Criteria:**
- [ ] "Save as Template" action creates a `ReportConfiguration` with name (1–100 chars), column list, and filter presets
- [ ] Template name must be unique per user; duplicate name returns `409 DUPLICATE_NAME`
- [ ] Templates list shows all saved templates with name, created date, and actions (Run, Edit, Delete)
- [ ] "Run" action on a template generates a report using the saved columns and filters
- [ ] Edit updates the template's column/filter settings (PUT)
- [ ] Delete soft-deletes the template; it no longer appears in the templates list

**Priority:** P2 | **Feature Ref:** F5

---

### US-5.5: Save and Reuse Filter Configurations
**As a** David, **I want to** save named filter sets that I can reuse across the report builder and classification list, **so that** I can apply consistent filter presets without re-entering the same criteria each time.

**Acceptance Criteria:**
- [ ] "Save Filter" action creates a `FilterConfiguration` with name (1–100 chars) and criteria (status, date range, PCC)
- [ ] Saved filters appear in a dropdown in the report builder and classification list filter bar
- [ ] Selecting a saved filter pre-populates all filter fields with the saved values
- [ ] Filters can be updated (PUT) or deleted (soft-delete) from the filter management UI

**Priority:** P2 | **Feature Ref:** F5

---

### US-5.6: Executive Report Download
**As a** Catherine, **I want to** download a well-formatted Excel report that is ready to present to PCORI leadership, **so that** I can use it directly without manual reformatting.

**Acceptance Criteria:**
- [ ] Catherine's `VIEWER` role can access `GET /api/reports` to list available reports and download completed ones
- [ ] Downloaded Excel file includes headers, formatted columns, and a timestamp in the filename
- [ ] All classification figures are traceable to individual records (reviewer name, timestamp, override reason visible in report)
- [ ] Report reflects data as of generation time; stale data is clearly timestamped

**Priority:** P1 | **Feature Ref:** F5

---

## Epic 6: User Management (Admin) (F6)

*System Administrator provisions and manages user accounts. Covers CRUD, role assignment, activate/deactivate, and search.*

---

### US-6.1: Provision a New User Account
**As a** Tom, **I want to** create a new user account with username, email, initial password, roles, and personal details through the admin UI, **so that** I can onboard a new reviewer in under 3 minutes without an IT ticket.

**Acceptance Criteria:**
- [ ] Admin create user form accepts: username (3–50 chars), email (RFC 5322), password (8–128 chars with complexity rules), first name, last name, role multi-select (at least one role required)
- [ ] Duplicate username returns `409 USERNAME_TAKEN`; duplicate email returns `409 EMAIL_TAKEN`
- [ ] Invalid role ID returns `400 INVALID_ROLE`
- [ ] Successful creation returns `201 Created` with sanitized user object (no password hash)
- [ ] A verification email is sent to the new user immediately after account creation
- [ ] New account is created with `isEmailVerified=false`; user must verify before logging in

**Priority:** P0 | **Feature Ref:** F6

---

### US-6.2: View and Search Users
**As a** Tom, **I want to** search and filter the user list by username, email, role, and status, **so that** I can quickly locate a specific account to manage it.

**Acceptance Criteria:**
- [ ] User list is paginated (default 25 per page) and sorted by `createdAt DESC`
- [ ] Search field (`q`) matches on username, email, and full name
- [ ] Role filter dropdown narrows list to users with a specific role
- [ ] Status filter shows: All, Active, Inactive
- [ ] Each user row shows: username, email, roles, status, last login, created date
- [ ] `GET /api/users/active` returns only active users for use in dropdowns (e.g., reviewer assignment)

**Priority:** P0 | **Feature Ref:** F6

---

### US-6.3: Edit User Details and Roles
**As a** Tom, **I want to** update a user's name, phone number, and role assignments, **so that** I can keep accounts accurate when team members change responsibilities.

**Acceptance Criteria:**
- [ ] Edit dialog pre-populates: first name, last name, phone number (max 20 chars), role multi-select
- [ ] Role update replaces the user's full role set with the new selection
- [ ] `username` and `email` cannot be changed via this endpoint
- [ ] Successful update returns `200 OK` with the updated user object
- [ ] All edits captured in audit trail (`updatedAt`, `lastModifiedBy`)

**Priority:** P0 | **Feature Ref:** F6

---

### US-6.4: Deactivate a User Account
**As a** Tom, **I want to** deactivate a departing user's account immediately without deleting it, **so that** the audit trail referencing that user remains intact and the account can be reactivated if needed.

**Acceptance Criteria:**
- [ ] Deactivate action is available from the user list and user detail view; requires confirmation dialog
- [ ] `PATCH /api/users/{id}/status` with `{isActive: false}` deactivates the account; any active refresh tokens are immediately invalidated
- [ ] `DELETE /api/users/{id}` also deactivates (not hard-deletes) the account
- [ ] Deactivated user cannot log in (`403 ACCOUNT_INACTIVE`)
- [ ] Historical classification records referencing the deactivated user remain intact
- [ ] An admin cannot deactivate their own account; `400 SELF_DEACTIVATION` returned
- [ ] Reactivation (`isActive: true`) restores login access immediately

**Priority:** P0 | **Feature Ref:** F6

---

## Epic 7: Notifications (F7)

*Keeps reviewers and administrators informed of key events. Covers in-app notification bell, unread badge, mark-read, and per-user notification preferences.*

---

### US-7.1: Receive In-App Notifications
**As a** Maya, **I want to** receive in-app notifications when a classification completes, fails, or needs my review, **so that** I don't have to poll the classification list manually to find out when my uploads are ready.

**Acceptance Criteria:**
- [ ] Notification bell in the header shows an unread count badge when notifications exist
- [ ] Badge count updates every 30 seconds via polling (`staleTime: 30000`); not on every render
- [ ] Notification list (opened via bell) shows: type icon, title, message, timestamp, read/unread indicator
- [ ] Notification types generated by the system: `CLASSIFICATION_COMPLETED`, `CLASSIFICATION_FAILED`, `CLASSIFICATION_NEEDS_REVIEW`, `PIPELINE_FAILURE`, `OVERRIDE_SUBMITTED`
- [ ] Each notification is ordered by `createdAt DESC`
- [ ] Maximum 500 notifications stored per user; oldest are deleted on overflow

**Priority:** P2 | **Feature Ref:** F7

---

### US-7.2: Mark Notifications as Read
**As a** Maya, **I want to** mark individual or all notifications as read, **so that** the unread badge count stays accurate and I can track what still needs my attention.

**Acceptance Criteria:**
- [ ] Clicking a notification marks it read (`PATCH /api/notifications/{id}/read`) and updates the badge count
- [ ] "Mark all as read" action marks all current user's notifications as read (`POST /api/notifications/read-all`)
- [ ] Both actions return `200 OK`
- [ ] A user cannot mark another user's notification as read; `403 ACCESS_DENIED` returned
- [ ] Unread count badge disappears when all notifications are marked read

**Priority:** P2 | **Feature Ref:** F7

---

### US-7.3: Configure Notification Preferences
**As a** Maya, **I want to** configure which event types send me in-app or email notifications, **so that** I receive critical alerts without being overwhelmed by low-priority events.

**Acceptance Criteria:**
- [ ] Notification preferences page lists all event types × channels (in-app, email) as a toggle grid
- [ ] Default preferences: all event types enabled for in-app; email enabled only for `CLASSIFICATION_FAILED` and `PIPELINE_FAILURE`
- [ ] `PUT /api/notifications/preferences` saves the complete preferences array (full replace, not partial update)
- [ ] Email notifications are sent only when `NotificationPreference.emailEnabled=true` AND SMTP is configured (silently skipped in dev mode)
- [ ] Invalid event type or channel enum values return `400 VALIDATION_ERROR`

**Priority:** P2 | **Feature Ref:** F7

---

### US-7.4: Receive Critical Event Email Alerts
**As a** Tom, **I want to** receive email alerts for critical system events (pipeline failure, classification failure), **so that** I'm informed of serious issues even when I'm not actively monitoring the platform UI.

**Acceptance Criteria:**
- [ ] `CLASSIFICATION_FAILED` event triggers an email to the plan's uploader when their email preference is enabled
- [ ] `PIPELINE_FAILURE` event triggers an email to all users with email enabled for that event type
- [ ] Email content includes: event type, plan ID (if applicable), timestamp, and a link to the affected record
- [ ] Email is not sent if SMTP is not configured (silently skipped; in-app notification still created)
- [ ] Notifications are per-user; a user never receives another user's notification emails

**Priority:** P2 | **Feature Ref:** F7

---

## Epic 8: Help Center (F8)

*In-platform self-service documentation. Covers article browsing, FAQ accordion, article search, and documentation feedback.*

---

### US-8.1: Browse Help Articles by Category
**As a** Maya, **I want to** browse help articles organized by category in a sidebar navigation, **so that** I can self-serve answers to common questions without contacting support.

**Acceptance Criteria:**
- [ ] Sidebar shows article categories (e.g., "Getting Started", "Classification", "Reports")
- [ ] Selecting a category shows the list of articles in that category, sorted by `publishedAt DESC`
- [ ] Clicking an article renders its full Markdown content in the main content area
- [ ] Markdown is sanitized before rendering to prevent XSS (e.g., via `rehype-sanitize`)
- [ ] Article detail page shows: title, category, publication date, and full content

**Priority:** P2 | **Feature Ref:** F8

---

### US-8.2: Search Help Articles
**As a** Maya, **I want to** search for help articles by keyword, **so that** I can find relevant documentation quickly without browsing category by category.

**Acceptance Criteria:**
- [ ] Search input sends `GET /api/help/articles/search?q={term}`; minimum 2 characters required
- [ ] Query shorter than 2 characters returns `400 QUERY_TOO_SHORT` with a clear message
- [ ] Results display: article title, category, and a content snippet/highlight showing where the match occurred
- [ ] "No articles found for '{query}'" empty state shown with a contact support link
- [ ] Clicking a result navigates to the full article detail page

**Priority:** P2 | **Feature Ref:** F8

---

### US-8.3: View FAQ Accordion
**As a** Maya, **I want to** view frequently asked questions organized in an accordion grouped by category, **so that** I can quickly scan common answers without reading full articles.

**Acceptance Criteria:**
- [ ] FAQ section renders all FAQ items from `GET /api/help/faqs` as an accordion grouped by category
- [ ] FAQs are sorted by `displayOrder` within each category
- [ ] Accordion items expand to show the answer on click; only one item open at a time per category (or multiple — consistent behavior)
- [ ] Category filter (`?category=`) narrows to FAQs in a specific category
- [ ] FAQ section is accessible via keyboard navigation (Radix UI Accordion primitive)

**Priority:** P2 | **Feature Ref:** F8

---

### US-8.4: Submit Article Feedback
**As a** Maya, **I want to** submit "Was this helpful?" feedback on a help article, **so that** documentation quality can be continuously improved based on real user responses.

**Acceptance Criteria:**
- [ ] Each article detail page shows a "Was this helpful? Yes / No" widget at the bottom
- [ ] Clicking Yes or No calls `POST /api/help/feedback` with `{articleId, helpful: boolean}`
- [ ] Optional comment field (max 1000 chars) is available after selecting Yes or No
- [ ] Feedback is upserted per user per article (submitting again overwrites the previous response)
- [ ] Success state shows a "Thank you for your feedback!" confirmation
- [ ] Admin can view feedback summary (`GET /api/help/articles/{id}/feedback`) with helpfulCount, unhelpfulCount, and comments

**Priority:** P2 | **Feature Ref:** F8

---

## Epic 9: File Management — S3 Storage (F9)

*Secure PDF storage and retrieval. Covers UploadedFile tracking, MIME validation, pre-signed URLs, and PHI safeguards.*

---

### US-9.1: Securely Store an Uploaded PDF
**As a** Maya, **I want to** have my uploaded research plan PDF securely stored in object storage with a unique key, **so that** I can retrieve it for reference and the pipeline can access it for text extraction.

**Acceptance Criteria:**
- [ ] File is validated via Apache Tika byte-level MIME detection before storage (not extension only); non-PDF returns `400 INVALID_FILE_TYPE`
- [ ] File size is checked before storage; files > `MAX_UPLOAD_SIZE_MB` (default 50 MB) return `413 FILE_TOO_LARGE`
- [ ] Storage key follows the format `pdfs/{year}/{month}/{uuid}-{sanitizedFilename}.pdf`; original filename sanitized (no path traversal characters)
- [ ] `UploadedFile` entity created with: filename (storage key), originalName, contentType, size (bytes), storagePath, uploadedBy, uploadedAt
- [ ] `UploadedFile.id` is linked to the corresponding `Classification.uploadedFileId`
- [ ] S3 bucket has public access blocked (`BlockPublicAcls: true`, `RestrictPublicBuckets: true`); no permanent public object URLs are ever issued

**Priority:** P0 | **Feature Ref:** F9

---

### US-9.2: Download a Research Plan PDF via Pre-Signed URL
**As a** Maya, **I want to** download the original PDF for a research plan using a time-limited link, **so that** I can reference the source document when reviewing a borderline classification.

**Acceptance Criteria:**
- [ ] `GET /api/files/{id}/download-url` returns `{url: "<pre-signed-url>", expiresAt: "<ISO-8601>"}`
- [ ] Pre-signed URL TTL defaults to 15 minutes (`PRE_SIGNED_URL_TTL_SECONDS=900`); configurable up to 3600 seconds
- [ ] Only the file uploader or a user with `ADMIN` role can request a download URL; `403 ACCESS_DENIED` returned otherwise
- [ ] Pre-signed URL is never logged or stored in the database; it is ephemeral by design
- [ ] Clicking the download link in the classification detail view uses this pre-signed URL mechanism
- [ ] S3 storage failure returns `503 STORAGE_UNAVAILABLE` with a user-friendly message

**Priority:** P0 | **Feature Ref:** F9

---

### US-9.3: PHI-Safe Storage and Logging
**As a** Tom, **I want to** confirm that the platform never stores full extracted PDF text in the database or logs it at INFO/DEBUG level, **so that** HIPAA-aligned controls are maintained and PHI exposure risk is minimized.

**Acceptance Criteria:**
- [ ] Extracted PDF text is never written to application logs at INFO, DEBUG, or WARN level (TRACE level only)
- [ ] `Classification.textPreview` stores at most 500 characters of extracted text; full text is never persisted in any database column
- [ ] S3 object keys are UUID-based and never include patient names or plan titles
- [ ] Server-side encryption is enabled on the S3 bucket (SSE-S3 or SSE-KMS)
- [ ] Pre-signed URLs are not stored in the database or logged
- [ ] A compliance review is completed before the platform processes real PHI-containing research plan PDFs through the ML provider

**Priority:** P0 | **Feature Ref:** F9

---

### US-9.4: Local and Cloud Storage Configuration
**As a** Tom, **I want to** configure the storage provider via environment variables, **so that** the platform can use LocalStack or MinIO in development and switch to AWS S3 in production without code changes.

**Acceptance Criteria:**
- [ ] `StorageService` bean is selected via `@ConditionalOnProperty("storage.provider")`; supported values: `s3`, `local`
- [ ] LocalStack endpoint configured via `AWS_ENDPOINT_OVERRIDE` env var (e.g., `http://localhost:4566`)
- [ ] MinIO follows the same `endpointOverride` pattern
- [ ] Switching storage providers requires only a configuration change (environment variable), not code modification
- [ ] Storage failure in any environment returns `503 STORAGE_UNAVAILABLE` with a consistent error message

**Priority:** P0 | **Feature Ref:** F9

---

## Story Index

| Story ID | Title | Persona | Priority | Feature Ref |
|---|---|---|---|---|
| US-0.1 | User Registration | All | P0 | F0 |
| US-0.2 | Email Verification | All | P0 | F0 |
| US-0.3 | User Login | Maya | P0 | F0 |
| US-0.4 | JWT Token Refresh | Maya | P0 | F0 |
| US-0.5 | Password Reset via Email | Maya | P0 | F0 |
| US-0.6 | Logout | Maya | P0 | F0 |
| US-0.7 | Role-Based Access Control | Tom | P0 | F0 |
| US-1.1 | Upload a Research Plan PDF | Maya | P0 | F1 |
| US-1.2 | Monitor Classification Status | Maya | P0 | F1 |
| US-1.3 | Review AI Classification Results | Maya | P0 | F1 |
| US-1.4 | Override an AI Classification | Maya | P0 | F1 |
| US-1.5 | Retry a Failed Classification | Maya | P0 | F1 |
| US-1.6 | Search and Filter the Classification Queue | Maya | P0 | F1 |
| US-2.1 | Add a New Taxonomy Category | Priya | P0 | F2 |
| US-2.2 | Browse the Taxonomy Hierarchy | Priya | P0 | F2 |
| US-2.3 | Edit a Taxonomy Category | Priya | P0 | F2 |
| US-2.4 | Deactivate an Obsolete Taxonomy Code | Priya | P0 | F2 |
| US-2.5 | Search the Taxonomy | Priya | P0 | F2 |
| US-3.1 | View Dashboard KPI Cards | David | P1 | F3 |
| US-3.2 | Filter Dashboard by Date Range | David | P1 | F3 |
| US-3.3 | View Analytics Charts | David | P1 | F3 |
| US-3.4 | View Recent Classifications Feed | David | P1 | F3 |
| US-3.5 | Customize Dashboard Widget Layout | David | P1 | F3 |
| US-3.6 | Executive KPI Dashboard View | Catherine | P1 | F3 |
| US-4.1 | View Pipeline Status and Health | Tom | P1 | F4 |
| US-4.2 | Control Pipeline Execution | Tom | P1 | F4 |
| US-4.3 | Retry a Failed Pipeline Stage | Tom | P1 | F4 |
| US-4.4 | View Pipeline Logs and Run History | Tom | P1 | F4 |
| US-4.5 | Trigger a Manual Sync | Tom | P1 | F4 |
| US-5.1 | One-Click Excel Export | David | P1 | F5 |
| US-5.2 | Download a Large Report Asynchronously | David | P1 | F5 |
| US-5.3 | Build an Ad-Hoc Report | David | P2 | F5 |
| US-5.4 | Save and Reuse Report Templates | David | P2 | F5 |
| US-5.5 | Save and Reuse Filter Configurations | David | P2 | F5 |
| US-5.6 | Executive Report Download | Catherine | P1 | F5 |
| US-6.1 | Provision a New User Account | Tom | P0 | F6 |
| US-6.2 | View and Search Users | Tom | P0 | F6 |
| US-6.3 | Edit User Details and Roles | Tom | P0 | F6 |
| US-6.4 | Deactivate a User Account | Tom | P0 | F6 |
| US-7.1 | Receive In-App Notifications | Maya | P2 | F7 |
| US-7.2 | Mark Notifications as Read | Maya | P2 | F7 |
| US-7.3 | Configure Notification Preferences | Maya | P2 | F7 |
| US-7.4 | Receive Critical Event Email Alerts | Tom | P2 | F7 |
| US-8.1 | Browse Help Articles by Category | Maya | P2 | F8 |
| US-8.2 | Search Help Articles | Maya | P2 | F8 |
| US-8.3 | View FAQ Accordion | Maya | P2 | F8 |
| US-8.4 | Submit Article Feedback | Maya | P2 | F8 |
| US-9.1 | Securely Store an Uploaded PDF | Maya | P0 | F9 |
| US-9.2 | Download a Research Plan PDF via Pre-Signed URL | Maya | P0 | F9 |
| US-9.3 | PHI-Safe Storage and Logging | Tom | P0 | F9 |
| US-9.4 | Local and Cloud Storage Configuration | Tom | P0 | F9 |

**Total Stories: 51** across 10 Epics (F0–F9)

---

## Priority Breakdown

| Priority | Count | Definition |
|---|---|---|
| **P0** | 29 stories | Critical — MVP blocker; system cannot function without it |
| **P1** | 14 stories | High — Core differentiator; ships in first release after MVP core is validated |
| **P2** | 8 stories | Medium — Valuable addition; ships after P1 features are stable |
| **P3** | 0 stories | Low — Nice to have; deferred to v2 or backlog |

---

## Priority Definitions

| Priority | Definition |
|---|---|
| **P0** | Critical — MVP blocker; system cannot function without it |
| **P1** | High — Core differentiator; ships in first release after MVP core is validated |
| **P2** | Medium — Valuable addition; ships after P1 features are stable |
| **P3** | Low — Nice to have; deferred to v2 or backlog |

---

*UserStories v1.0 — PCORI Research Analytics Platform*
*Generated: 2026-05-20 | Source: PRD-PCORI.md v1.0 + FRD-PCORI.md v1.0 + PERSONAS-PCORI.md v1.0*
