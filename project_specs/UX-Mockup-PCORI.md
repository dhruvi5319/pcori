# UX Mockup — PCORI Research Analytics Platform

**Project:** PCORI Research Analytics Platform
**Generated:** 2026-05-20
**Based on:** UserStories-PCORI.md v1.0, PRD-PCORI.md v1.0, FRD-PCORI.md v1.0, JOURNEYS-PCORI.md v1.0
**Authoritative Design Source:** PRD §8.1–8.7

---

## Overview

The PCORI Research Analytics Platform is a secure, responsive web application for AI-assisted classification of research plan PDFs against the PCORI taxonomy. The UX is built around five distinct personas with non-overlapping core workflows, all converging on a single audit trail.

### Design Principles

1. **Speed over ceremony** — Reviewers complete a full classify-or-override cycle in ≤10 minutes. Every primary action is one click.
2. **Audit confidence** — Every significant action surfaces the acting user's name and timestamp at point of completion, not buried in a separate audit log.
3. **Status always visible** — Pipeline health, classification status, and notification counts are visible from every screen.
4. **Failure is explicit** — `FAILED` and `NEEDS_REVIEW` states are never hidden; they are highlighted and actionable.
5. **Color + text always together** — Status badges always include a text label alongside color (WCAG 2.1 AA).

### Design System (PRD §8.1)

| Aspect | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4 (CSS-first `@import "tailwindcss"`, no config file) |
| Component Primitives | Radix UI — Dialog, Dropdown, Tabs, Toast, Tooltip |
| Charts | Recharts (`isAnimationActive={false}` in production) |
| Icons | lucide-react |
| Toasts | sonner (top-right, rich colors) |
| Fonts | Geist (sans), Geist Mono (monospaced — logs, code) |
| Forms | react-hook-form + zod; inline field-level errors; submit disabled until valid |
| Theming | next-themes (light/dark; auto-swapping favicons) |
| Server State | TanStack Query v5 (explicit `staleTime` per resource; `staleTime: 0` avoided) |

### Color Tokens (PRD §8.5)

| Token | Use |
|---|---|
| `primary` | Brand color, primary CTAs |
| `secondary` | Secondary actions, links |
| `chart-1..5` | Chart series colors |
| `destructive` | Delete buttons, error states |
| `muted` | Disabled / secondary text |
| `accent` | Hover highlights |
| Status: green | `CLASSIFIED` |
| Status: blue pulsing | `PROCESSING` |
| Status: gray | `PENDING` |
| Status: red | `FAILED` |
| Status: amber | `NEEDS_REVIEW` |

### Navigation Structure (PRD §8.2)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Logo] │ Dashboard │ Classifications │ Taxonomy │ Analytics │        │
│         │ Pipeline  │ Reports         │ Users    │ Help      │        │
│                                                [🔔 N] [User ▾] Logout │
├──────────────────────────────────────────────────────────────────────┤
│  <route content>                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  Footer: branding · links · version                                   │
└──────────────────────────────────────────────────────────────────────┘
```

**Public routes** (no auth): `/`, `/login`, `/signup`
**Protected routes** (JWT required): `/dashboard`, `/classifications`, `/taxonomy`, `/data-pipeline`, `/analytics`, `/reports`, `/users`, `/help`

Role-gated nav items (rendered only when role permits):
- `Users` — ADMIN only
- `Pipeline` — ADMIN + MANAGER
- `Analytics` — MANAGER + VIEWER
- `Taxonomy` edit controls — TAXONOMY_ADMIN only

### Information Architecture Summary

| Route | Persona | Priority |
|---|---|---|
| `/` | Public | Landing |
| `/login` | All | P0 |
| `/signup` | All | P0 |
| `/dashboard` | All (role-filtered) | P1 |
| `/classifications` | REVIEWER + MANAGER | P0 |
| `/taxonomy` | TAXONOMY_ADMIN + REVIEWER (read) | P0 |
| `/data-pipeline` | ADMIN + MANAGER | P1 |
| `/analytics` | MANAGER + VIEWER | P1 |
| `/reports` | MANAGER + VIEWER | P1 |
| `/users` | ADMIN | P0 |
| `/help` | All | P2 |

---
## Flow-00: Authentication (US-0.1 – US-0.6)

**User Stories:** US-0.1 (Registration), US-0.2 (Email Verification), US-0.3 (Login), US-0.4 (Token Refresh), US-0.5 (Password Reset), US-0.6 (Logout)

---

### Flow 0-A: Self-Registration

**Trigger:** User visits `/signup` directly or clicks "Create account" from login page
**Exit:** Redirect to `/login` with success toast "Account created — check your email to verify"

```
[/signup Form]
     │
     ├── Client validation (zod) fails → inline field errors; submit stays disabled
     │
     ├── POST /api/auth/register
     │        │
     │        ├── 409 USERNAME_TAKEN  → field-level error "Username already in use"
     │        ├── 409 EMAIL_TAKEN    → field-level error "Email already registered"
     │        ├── 400 VALIDATION_ERROR → field-level error per failing field
     │        │
     │        └── 201 Created
     │                 │
     │                 └── Toast (green): "Account created — check your email"
     │                          │
     │                          └── Redirect → /login
```

**Steps:**
1. User fills form: username, email, password, first name, last name
2. Zod validates client-side on blur; submit button disabled until all fields pass
3. On submit: POST /api/auth/register
4. Success: toast + redirect to /login
5. System sends verification email automatically

---

### Flow 0-B: Email Verification

**Trigger:** User clicks link in verification email
**Exit:** Success page with "Email verified — log in now" button → `/login`

```
[Email Link: GET /api/auth/verify-email?token=...]
     │
     ├── 400 INVALID_TOKEN (expired or already used)
     │        └── Error page: "This link has expired or was already used."
     │                         [Request new verification email] button
     │
     └── 200 OK → Success: "Email verified!"
                       └── [Log In] button → /login
```

---

### Flow 0-C: Login

**Trigger:** User visits `/login` or is redirected after session expiry
**Exit:** Redirect to `/dashboard` (or original requested URL)

```
[/login Form]
     │
     ├── Submit disabled until both username + password non-empty
     │
     ├── POST /api/auth/login
     │        │
     │        ├── 401 INVALID_CREDENTIALS
     │        │        └── Toast (red): "Invalid username or password" + attempt counter message
     │        │
     │        ├── 403 ACCOUNT_LOCKED
     │        │        └── Toast (red): "Account locked. Try again after [time]."
     │        │
     │        ├── 403 EMAIL_NOT_VERIFIED
     │        │        └── Toast (amber): "Please verify your email first."
     │        │                 + [Resend verification email] link
     │        │
     │        ├── 403 ACCOUNT_INACTIVE
     │        │        └── Toast (red): "This account has been deactivated."
     │        │
     │        └── 200 OK
     │                 │
     │                 ├── Store accessToken + refreshToken
     │                 └── Redirect → /dashboard (or originally requested protected route)
```

---

### Flow 0-D: Password Reset

**Trigger:** User clicks "Forgot password?" link on `/login`
**Exit:** Password changed → redirect to `/login` with toast "Password updated"

```
Step 1: Forgot Password
[/forgot-password Form: Email field]
     │
     └── POST /api/auth/forgot-password
              │
              └── 200 OK (always — prevents email enumeration)
                       └── Message shown: "If an account with that email exists,
                                          a reset link has been sent."
                                          [Return to Login]

Step 2: Reset Password (via email link)
[/reset-password?token=... Form: New Password + Confirm Password]
     │
     ├── Client zod validation (complexity rules shown inline)
     │
     ├── POST /api/auth/reset-password
     │        │
     │        ├── 400 INVALID_TOKEN → "This reset link has expired or already been used."
     │        │                         [Request new reset email] button
     │        │
     │        └── 200 OK
     │                 └── Toast (green): "Password updated"
     │                          └── Redirect → /login
```

---

### Flow 0-E: Token Refresh (Silent)

**Trigger:** TanStack Query detects 401 on any API call; access token near expiry (client-side check)
**Exit:** Retry original request with new access token; no visible disruption to user

```
[Any protected API call returns 401 TOKEN_EXPIRED]
     │
     ├── POST /api/auth/refresh (with refresh token in request)
     │        │
     │        ├── 401 TOKEN_INVALID → clear all tokens
     │        │        └── Toast (amber): "Session expired — please log in again"
     │        │                  → Redirect /login
     │        │
     │        └── 200 OK → new accessToken stored → retry original request
```

---

### Flow 0-F: Logout

**Trigger:** User clicks "Logout" in user menu (accessible from every page in header)
**Exit:** Tokens cleared; redirect to `/login`

```
[Header User Menu → Logout]
     │
     └── POST /api/auth/logout
              │
              └── 200 OK
                       ├── Clear accessToken + refreshToken from client storage
                       └── Redirect → /login
                                Toast (muted): "You've been signed out"
```

---
## Flow-01: Research Plan Upload & Classification (US-1.1 – US-1.6)

**User Stories:** US-1.1 (Upload), US-1.2 (Monitor Status), US-1.3 (Review Results), US-1.4 (Override), US-1.5 (Retry), US-1.6 (Search & Filter)
**Journey:** JRN-01.1 (Upload → Accept or Override), JRN-01.2 (Morning Queue Triage)

---

### Flow 1-A: Upload a Research Plan PDF

**Trigger:** User clicks "Upload Plan" button on `/classifications` page
**Exit:** Dialog closes; classification list row appears with `PENDING` status; polling begins

```
[Classifications List → "Upload Plan" button]
     │
     └── UploadPlanDialog opens
              │
              ├── User drags PDF to dropzone OR clicks "Browse"
              │        │
              │        ├── Non-PDF file selected → inline error: "Only PDF files are accepted"
              │        ├── File > 50MB → inline error: "File exceeds 50MB maximum"
              │        └── Valid PDF → filename shown; file ready indicator
              │
              ├── User fills optional Title (default: filename) and Notes
              │
              └── User clicks "Upload"
                       │
                       ├── Progress bar shows upload progress (0–100%)
                       │
                       └── POST /api/classifications/upload
                                │
                                ├── 400 INVALID_FILE_TYPE
                                │        └── Toast (red): "Only PDF files are accepted"
                                │
                                ├── 413 FILE_TOO_LARGE
                                │        └── Toast (red): "File exceeds the 50MB limit"
                                │
                                ├── 503 STORAGE_UNAVAILABLE
                                │        └── Toast (red): "Storage unavailable — try again"
                                │
                                └── 202 Accepted
                                         ├── Toast (green): "Plan [RP-2026-XXX] submitted"
                                         ├── Dialog closes
                                         └── List row appears: status PENDING
                                                  └── Frontend polling begins (5–10s)
```

---

### Flow 1-B: Classification Status Polling (US-1.2)

**Trigger:** Any classification in `PROCESSING` state detected by TanStack Query
**Exit:** All plans reach terminal status; polling stops

```
[TanStack Query staleTime expires while PROCESSING records exist]
     │
     └── GET /api/classifications (every 5–10s)
              │
              ├── If any status = PROCESSING → polling continues
              │
              └── Status transitions:
                       PENDING → PROCESSING → CLASSIFIED  (green badge + text)
                                           → NEEDS_REVIEW (amber badge + text)
                                           → FAILED       (red badge + text)
```

**PROCESSING badge:** Blue pulsing animation + "Processing" text label
**Terminal states:** polling stops automatically

---

### Flow 1-C: Review AI Classification Results (US-1.3)

**Trigger:** User clicks a row with `CLASSIFIED` or `NEEDS_REVIEW` status
**Exit:** User accepts (no action needed) or proceeds to Override flow

```
[Classification List row click]
     │
     └── ViewClassificationDialog / Classification Detail opens
              │
              ├── Shows: Plan ID, Title, Status badge
              ├── AI Classification section:
              │        ├── PCC: [value]
              │        ├── Taxonomy Category: [value]
              │        ├── Taxonomy Code: [value]
              │        ├── Taxonomy Subcode: [value]
              │        └── AI Confidence: [XX%] with visual band (green/amber/red)
              │
              ├── Research Details section (extracted):
              │        ├── Project Summary
              │        ├── Population Setting
              │        ├── Intervention
              │        ├── Comparator
              │        ├── Primary Outcome
              │        └── Secondary Outcomes
              │
              ├── Pipeline Metadata:
              │        ├── Model Version
              │        ├── Processing Time: [X ms]
              │        └── Classified At: [timestamp]
              │
              ├── If extractionWarning present:
              │        └── Amber callout: "⚠ [extractionWarning message]"
              │
              ├── If status = NEEDS_REVIEW:
              │        └── Amber banner: "AI confidence below threshold — please review"
              │
              ├── [Download PDF] button → GET /api/files/{id}/download-url (15-min TTL)
              │
              ├── If reviewedBy is set (override exists):
              │        └── Override Record section:
              │                 ├── Reviewed By: [username]
              │                 ├── Reviewed At: [timestamp]
              │                 └── Override Reason: [text]
              │
              └── [Override Classification] button → Flow 1-D
```

---

### Flow 1-D: Manual Override (US-1.4)

**Trigger:** User clicks "Override Classification" from classification detail
**Exit:** Dialog closes; classification shows `CLASSIFIED` status with reviewer's name

```
[Classification Detail → "Override Classification" button]
     │
     └── ManualOverrideDialog opens
              │
              ├── Side-by-side display:
              │        Left: Current AI Classification (read-only)
              │        Right: Override Form (editable)
              │
              ├── Override form fields (all independently editable, validated against active taxonomy):
              │        ├── PCC (dropdown — active taxonomy codes only)
              │        ├── Taxonomy Category (dropdown — active codes only)
              │        ├── Taxonomy Code (dropdown — active codes only)
              │        └── Taxonomy Subcode (dropdown — active codes only)
              │
              ├── Override Reason (required textarea, 1–2000 chars)
              │        └── Inline error if blank: "Override reason is required"
              │
              ├── Submit button disabled until Override Reason is non-empty
              │
              └── User clicks "Submit Override"
                       │
                       └── PUT /api/classifications/{id}/override
                                │
                                ├── 400 VALIDATION_ERROR (reason blank)
                                │        └── Inline field error: "Override reason is required"
                                │
                                ├── 400 INVALID_TAXONOMY_CODE
                                │        └── Field error: "Code [x] is not active"
                                │
                                └── 200 OK
                                         ├── Toast (green): "Override saved"
                                         ├── Dialog closes
                                         └── Classification shows:
                                                  ├── Status: CLASSIFIED (green)
                                                  ├── reviewedBy: [current user]
                                                  ├── reviewedAt: [now]
                                                  └── overrideReason: [submitted text]
```

---

### Flow 1-E: Retry a Failed Classification (US-1.5)

**Trigger:** User clicks "Retry" from the row action menu on a `FAILED` classification
**Exit:** Status resets to `PENDING`; polling resumes

```
[Classification List → row action menu → "Retry"]
     │
     └── Confirmation: "Retry this classification?"  [Cancel] [Retry]
              │
              └── POST /api/classifications/{id}/retry
                       │
                       ├── 400 INVALID_STATUS (not FAILED)
                       │        └── Toast (amber): "Only failed classifications can be retried"
                       │
                       └── 202 Accepted
                                ├── Toast (blue): "Classification requeued"
                                ├── Status → PENDING
                                └── Polling resumes automatically
```

**Note:** Retry button is only visible in the action menu when `status = FAILED`.

---

### Flow 1-F: Search and Filter Queue (US-1.6)

**Trigger:** User opens `/classifications` (the default landing after login per JRN-01.2)
**Exit:** Filtered list displayed; filter state persists when navigating to detail and back

```
[/classifications page loads]
     │
     ├── Default: all statuses, last 30 days, sorted uploadedAt DESC, page 25
     │
     ├── Filter bar:
     │        ├── Status multi-select: PENDING / PROCESSING / CLASSIFIED / FAILED / NEEDS_REVIEW
     │        ├── Date range picker: startDate – endDate
     │        ├── PCC dropdown (active PCCs only)
     │        ├── Keyword search (matches plan ID + title)
     │        └── [Clear Filters] link — visible when any filter is active
     │
     ├── Active filters shown as chips above table
     │
     ├── GET /api/classifications?status=...&startDate=...&q=...
     │        │
     │        ├── Loading: table row skeletons (3–5 rows)
     │        └── Results: paginated table
     │
     └── Urgent item alert strip (JRN-01.2 delight):
              If NEEDS_REVIEW count > 0 OR FAILED count > 0:
              └── Amber/red alert bar: "N plan(s) need review · M failed"
                       [Filter to NEEDS_REVIEW] [Filter to FAILED] quick links
```

---
## Flow-02: Taxonomy Management (US-2.1 – US-2.5)

**User Stories:** US-2.1 (Add Category), US-2.2 (Browse Hierarchy), US-2.3 (Edit Category), US-2.4 (Deactivate), US-2.5 (Search)
**Journey:** JRN-03.1 (Add New → Verify → Deactivate)

---

### Flow 2-A: Add a New Taxonomy Category (US-2.1)

**Trigger:** Taxonomy Admin clicks "Add Category" or "Add Child" button on `/taxonomy`
**Exit:** New node appears highlighted in tree; right pane shows its detail

```
[Taxonomy page → "Add Category" or "Add Child" (on selected node)]
     │
     └── AddCategoryDialog opens (or inline form in right pane)
              │
              ├── Form fields:
              │        ├── Code (required, 1–50 chars, alphanumeric + hyphens)
              │        ├── Name (required, 1–255 chars)
              │        ├── Description (textarea, max 2000 chars)
              │        ├── Level (auto-set to parent.level + 1 when parent selected)
              │        ├── Parent Category (tree picker or dropdown — shows active only)
              │        └── Display Order (integer, default 0)
              │
              ├── Hierarchy breadcrumb preview:
              │        "[Root PCC] > [Parent Category] > [New Code]"
              │        (updates live as parent is selected — JRN-03.1 delight)
              │
              └── User clicks "Save"
                       │
                       └── POST /api/taxonomy
                                │
                                ├── 409 CODE_DUPLICATE → field error: "Code already exists under this parent"
                                ├── 400 INVALID_LEVEL → field error: "Level must be parent level + 1"
                                ├── 400 INVALID_PARENT → field error: "Parent not found or inactive"
                                │
                                └── 201 Created
                                         ├── Toast (green): "Category added"
                                         ├── Tree refreshes instantly
                                         └── New node briefly highlighted in tree (JRN-03.1)
```

---

### Flow 2-B: Browse and Select Taxonomy Node (US-2.2)

**Trigger:** User navigates to `/taxonomy`
**Exit:** Node selected in left pane; detail shown in right pane

```
[GET /api/taxonomy/tree]
     │
     ├── Loading: left pane shows skeleton tree lines
     │
     └── Tree renders:
              │
              ├── Root nodes (level 0) expanded by default
              ├── Children nested with visual indentation
              ├── Sorted by displayOrder within sibling group
              ├── Inactive nodes: grayed out + "(Inactive)" suffix (still visible)
              │
              └── User clicks a node
                       │
                       └── Right pane shows:
                                ├── Code: [value]
                                ├── Name: [value]
                                ├── Description: [text]
                                ├── Level: [0–3]
                                ├── Parent: [parent name or "Root"]
                                ├── Status: Active / Inactive badge
                                ├── Last modified by [user] on [date]
                                └── Action buttons: [Edit] [Toggle Active] [Add Child]
```

---

### Flow 2-C: Edit a Taxonomy Category (US-2.3)

**Trigger:** User clicks "Edit" from right pane of selected node
**Exit:** Updated node in tree; success toast; audit trail updated

```
[Taxonomy detail pane → "Edit" button]
     │
     └── Edit form in right pane (inline, fields pre-populated)
              │
              ├── Editable: Name, Description, Display Order
              ├── Code can be changed (re-validated for uniqueness)
              │
              └── User clicks "Save"
                       │
                       └── PUT /api/taxonomy/{id}
                                │
                                ├── 409 CODE_DUPLICATE → field error
                                ├── 400 CIRCULAR_REFERENCE → "Cannot set this parent — circular reference"
                                │
                                └── 200 OK
                                         ├── Toast (green): "Category updated"
                                         ├── Tree node label updates immediately
                                         └── Detail pane shows updated values + new "Updated by" timestamp
```

---

### Flow 2-D: Deactivate an Obsolete Taxonomy Code (US-2.4)

**Trigger:** User selects a node and clicks "Deactivate" in the right pane
**Exit:** Node grayed in tree; code excluded from classification overrides

```
[Taxonomy detail pane → "Deactivate" button]
     │
     └── ConfirmationDialog:
              "Deactivate [Code Name]?"
              ──────────────────────────────────────────────
              "This code will be hidden from future
              classifications. Existing records that use
              it will not be affected."
              [If parent of children: "N child code(s) will
              also be deactivated."]
              ──────────────────────────────────────────────
              [Cancel]  [Deactivate]
              │
              └── PATCH /api/taxonomy/{id}/status  { isActive: false }
                       │
                       ├── 400 INACTIVE_PARENT → shown only on reactivation path
                       │
                       └── 200 OK
                                ├── Toast (green): "Code deactivated"
                                ├── Node grayed in tree + "(Inactive)" label
                                ├── All descendant nodes also grayed
                                └── Detail pane shows "Inactive" status badge
                                         + "Deactivated by [user] on [date]"
```

**Reactivation path (toggle Active):**
- Same PATCH endpoint with `{ isActive: true }`
- If parent is inactive → 400 INACTIVE_PARENT → Toast (amber): "Cannot activate — parent is inactive. Activate the parent first."

---

### Flow 2-E: Search the Taxonomy (US-2.5)

**Trigger:** User types in the taxonomy search input (left pane or search bar)
**Exit:** Results list; clicking a result navigates to that node in the tree

```
[Taxonomy search input]
     │
     ├── Debounced GET /api/taxonomy/search?q={term}&activeOnly=true
     │
     ├── Loading: spinner in search results area
     │
     ├── Results: flat list showing
     │        Code │ Name │ Level │ Parent │ Status
     │
     ├── "Active only" toggle to include inactive codes
     │
     ├── Empty state: "No taxonomy codes match '[term]'"
     │
     └── User clicks result
              └── Tree expands + scrolls to highlight the matched node
                  Right pane shows the node's details
```

---
## Flow-03: Dashboard & Analytics (US-3.1 – US-3.6)

**User Stories:** US-3.1 (KPI Cards), US-3.2 (Date Filter), US-3.3 (Analytics Charts), US-3.4 (Recent Feed), US-3.5 (Widget Config), US-3.6 (Executive View)
**Journey:** JRN-02.1 (Health Check → Anomaly → Report), JRN-05.1 (Executive KPI Check)

---

### Flow 3-A: Dashboard Initial Load (US-3.1, US-3.4)

**Trigger:** User navigates to `/dashboard`
**Exit:** All KPI cards populated; recent feed visible; date range applied

```
[GET /api/dashboard/metrics?startDate=&endDate=]  ← last 30 days default
     │
     ├── KPI cards render independently via separate useQuery hooks:
     │        ├── Total Plans    → skeleton → number
     │        ├── Classified     → skeleton → number
     │        ├── Processing     → skeleton → number
     │        ├── Pending        → skeleton → number
     │        ├── Failed         → skeleton → number
     │        ├── Needs Review   → skeleton → number
     │        └── Avg AI Confidence → skeleton → XX.X%
     │
     ├── [GET /api/classifications/recent?limit=10]
     │        └── Recent Classifications feed renders
     │
     ├── "Data current as of [timestamp]" label under KPI cards
     │
     └── Empty state (no data yet):
              Icon + "No classification data yet"
              [Upload your first plan →] CTA button
```

**TanStack Query config:** `staleTime: 30000` (30s) — NOT `staleTime: 0`
**Conditional polling:** Poll only while any `PROCESSING` records exist

---

### Flow 3-B: Apply Date Range Filter (US-3.2)

**Trigger:** User changes date range picker at top of dashboard
**Exit:** All cards and charts simultaneously refresh with new date range

```
[Date Range Picker → user selects new range]
     │
     ├── Client-side validation: startDate ≤ endDate
     │        └── If invalid: inline error; no API call made
     │
     └── On valid selection:
              ├── All useQuery hooks with date params invalidated simultaneously
              ├── ALL of these refetch in parallel:
              │        ├── /api/dashboard/metrics?startDate=...&endDate=...
              │        ├── /api/classifications/recent
              │        ├── /api/analytics/accuracy-trend
              │        ├── /api/analytics/category-accuracy
              │        ├── /api/analytics/confidence-distribution
              │        ├── /api/analytics/processing-volume
              │        └── /api/analytics/overrides
              │
              ├── "Filter applied: [date range]" persistent label shown
              │
              └── Each card/chart shows its own skeleton while loading
                       (one failing chart does NOT block others)
```

---

### Flow 3-C: Analytics Charts (US-3.3)

**Trigger:** User navigates to `/analytics`
**Exit:** All six chart sections populated or showing appropriate empty/insufficient-data states

```
[/analytics page]
     │
     ├── Date range picker (same as dashboard; defaults to last 30 days)
     │
     ├── Charts rendered in tabs or sections:
     │
     ├── 1. Accuracy Trend (line chart)
     │        GET /api/analytics/accuracy-trend
     │        ├── Has data: line chart (aiAccuracy + humanCorrectedAccuracy series)
     │        └── No overrides yet: "Accuracy trend will appear as override data accumulates"
     │
     ├── 2. Category Accuracy (horizontal bar chart)
     │        GET /api/analytics/category-accuracy
     │        ├── Override rate > 15%: bar highlighted red (with text label "Above threshold")
     │        └── Click bar: filter Recent Overrides table to that category (JRN-02.1 drill-down)
     │
     ├── 3. AI Confidence Distribution (histogram)
     │        GET /api/analytics/confidence-distribution
     │        Label: "AI Confidence Distribution" (NEVER "Accuracy Distribution")
     │        10 buckets: 0.0–0.1, 0.1–0.2, ..., 0.9–1.0
     │
     ├── 4. Processing Volume (area chart)
     │        GET /api/analytics/processing-volume
     │        Granularity selector: Day / Week / Month
     │
     ├── 5. Recent Overrides (table)
     │        GET /api/analytics/overrides
     │        Columns: Plan ID │ Reviewer │ Original │ Override │ Reason │ Date
     │        Paginated; filterable by PCC category
     │
     └── 6. Model Performance (KPI cards)
              GET /api/analytics/model-performance
              ├── totalEvaluated ≥ 10: shows Precision / Recall / F1
              └── totalEvaluated < 10: "Insufficient data — model performance metrics
                                        require at least 10 evaluated records"
```

**Recharts config:** `isAnimationActive={false}` in production build (all charts)

---

### Flow 3-D: Widget Layout Configuration (US-3.5)

**Trigger:** User clicks "Customize Dashboard" button on dashboard
**Exit:** Layout saved; dashboard reloads with new widget arrangement

```
[Dashboard → "Customize" button]
     │
     └── Widget configuration mode:
              ├── Drag handles visible on each card
              ├── Toggle visibility per widget (checkbox)
              ├── 12-column grid positions
              │
              ├── [Reset to Default] → DELETE /api/dashboard/configuration/{id}
              │        └── Toast: "Layout reset to default"
              │
              └── [Save Layout]
                       └── PUT /api/dashboard/configuration/{id}
                                └── Toast (green): "Layout saved"
```

**GET /api/dashboard/configuration** on load — creates default if none exists

---
## Flow-04: Pipeline Monitoring (US-4.1 – US-4.5)

**User Stories:** US-4.1 (Status/Health), US-4.2 (Control Execution), US-4.3 (Stage Retry), US-4.4 (Logs/History), US-4.5 (Manual Sync)
**Journey:** JRN-02.1 Stage 2 (Pipeline status check)

---

### Flow 4-A: View Pipeline Status and Health (US-4.1)

**Trigger:** User navigates to `/data-pipeline`
**Exit:** Status visible; polling active while pipeline running

```
[GET /api/pipeline/status]  [GET /api/pipeline/health]
     │
     ├── Loading: skeleton cards
     │
     └── Page renders:
              ├── Pipeline Status Header
              │        ├── State indicator: [● RUNNING] / [● PAUSED] / [● STOPPED]
              │        │   (colored dot + text label — never color alone)
              │        ├── Active runs: N
              │        ├── Queue depth: N pending records
              │        └── Last sync: [timestamp]
              │
              ├── Stuck Records Warning (if any):
              │        └── Amber callout: "⚠ N record(s) stuck in PROCESSING
              │                            (beyond [timeout] minutes)"
              │
              ├── Stage Cards (3 cards: EXTRACT | CLASSIFY | PERSIST)
              │        Each card shows:
              │        ├── Stage name + state (IDLE/RUNNING/PAUSED/FAILED/COMPLETED)
              │        ├── Last run: [timestamp]
              │        ├── Duration: [Nms]
              │        ├── Error: [message if FAILED]
              │        └── [Retry] button — visible ONLY when state = FAILED
              │
              ├── DB Health Panel
              │        ├── Active connections: N / Max: N
              │        ├── Idle connections: N
              │        └── Queue depth: N
              │
              └── Frontend polls GET /api/pipeline/status every 10s while any run is active
```

---

### Flow 4-B: Pipeline Control Actions (US-4.2)

**Trigger:** Admin clicks control button (Start / Stop / Pause / Resume)
**Exit:** Pipeline state indicator updates; action buttons update to reflect new state

```
Control Buttons row:
[Start]  [Stop]  [Pause]  [Resume]  [Sync Now]

Button visibility rules:
  STOPPED:  [Start] enabled; [Stop/Pause/Resume] disabled
  RUNNING:  [Stop] [Pause] enabled; [Start/Resume] disabled
  PAUSED:   [Resume] enabled; [Start/Stop/Pause] disabled

Flow per button:

[Start]
  └── POST /api/pipeline/{id}/start
           ├── 409 ALREADY_RUNNING → Toast (amber): "Pipeline already running"
           └── 202 Accepted → State: RUNNING; Toast (blue): "Pipeline started"

[Stop]
  └── Confirmation: "Stop the pipeline? In-flight stage will complete."
       [Cancel] [Stop]
           └── POST /api/pipeline/{id}/stop
                    └── 200 OK → State: STOPPED; Toast (amber): "Pipeline stopped"

[Pause]
  └── POST /api/pipeline/{id}/pause
           └── 200 OK → State: PAUSED after current stage completes
                         Toast (blue): "Pipeline will pause after current stage"

[Resume]
  └── POST /api/pipeline/{id}/resume
           ├── 400 INVALID_STATE → Toast (red): "Pipeline is not paused"
           └── 200 OK → State: RUNNING; Toast (green): "Pipeline resumed"

[All control actions require ADMIN role — button group hidden for MANAGER/VIEWER]
```

---

### Flow 4-C: Stage-Level Retry (US-4.3)

**Trigger:** Admin clicks "Retry" on a FAILED stage card
**Exit:** Stage resets to IDLE and re-queues; card updates in real time

```
[Stage Card with state = FAILED → "Retry" button]
     │
     └── Confirmation: "Retry [EXTRACT | CLASSIFY | PERSIST] stage?"
              [Cancel] [Retry]
                       │
                       └── POST /api/pipeline/{id}/stages/{stageId}/retry
                                │
                                ├── 400 INVALID_STAGE_STATE (not FAILED)
                                │        └── Toast (amber): "Stage is not in a failed state"
                                │
                                └── 202 Accepted
                                         ├── Toast (green): "Stage requeued"
                                         └── Stage card: state → IDLE (then RUNNING)
```

---

### Flow 4-D: View Pipeline Logs and Run History (US-4.4)

**Trigger:** User expands the Logs panel or clicks "Run History" tab
**Exit:** Logs visible; history entries displayed

```
Logs Panel (collapsible):
[▼ Pipeline Event Log]  [▲ Collapse]
┌──────────────────────────────────────────────────────────┐
│ [monospaced font — Geist Mono]                            │
│ 2026-05-20T09:32:15Z  INFO   Pipeline started: run-uuid  │
│ 2026-05-20T09:32:16Z  INFO   EXTRACT stage: processing   │
│ 2026-05-20T09:32:18Z  WARN   Text extraction: 82 chars   │
│ 2026-05-20T09:32:20Z  ERROR  CLASSIFY stage failed: ...  │
└──────────────────────────────────────────────────────────┘
GET /api/pipeline/{id}/logs  (paginated, 50/page)
Level color: INFO (gray) | WARN (amber) | ERROR (red)
Log entries capped at 500 chars each

Run History tab:
GET /api/pipeline/{id}/history
Table: Run ID │ Started │ Completed │ Status │ Processed │ Failed

Pipeline Stats (GET /api/pipeline/stats):
Total Runs: N  │  Total Processed: N  │  Total Failed: N  │  Avg Duration: Nms
```

---

### Flow 4-E: Manual Sync (US-4.5)

**Trigger:** Admin clicks "Sync Now" button
**Exit:** Toast shows count of queued records

```
[Control Buttons → "Sync Now"]
     │
     └── Confirmation: "Trigger manual sync to pick up pending records?"
              [Cancel] [Sync Now]
                       │
                       └── POST /api/pipeline/sync
                                │
                                ├── {queued: 0} → Toast (muted): "No pending records to sync"
                                └── {queued: N} → Toast (green): "Sync queued N record(s)"
```

---
## Flow-05: Reports (US-5.1 – US-5.6)

**User Stories:** US-5.1 (One-Click Export), US-5.2 (Async Large Report), US-5.3 (Ad-Hoc Builder), US-5.4 (Save Templates), US-5.5 (Save Filters), US-5.6 (Executive Download)
**Journey:** JRN-02.1 Stage 6 (Generate Excel), JRN-05.1 Stage 3 (Catherine Downloads Report)

---

### Flow 5-A: One-Click Excel Export (US-5.1)

**Trigger:** User clicks "Export to Excel" (quick-export button) on `/reports` or `/classifications`
**Exit:** `.xlsx` file downloaded; toast confirms

```
[Reports page → "One-Click Export" button / "Export to Excel" from classifications]
     │
     ├── Current filter state passed as params (startDate, endDate, status, PCC)
     │
     └── POST /api/excel/generate
              │
              ├── Loading indicator: "Generating report..." (spinner on button)
              │
              ├── System checks row count:
              │        ├── ≤1,000 rows: XSSF (in-memory)
              │        └── >1,000 rows: SXSSFWorkbook (streaming)
              │
              ├── 200 OK → binary .xlsx stream
              │        ├── Browser triggers download:
              │        │        filename: pcori-report-[timestamp].xlsx
              │        └── Toast (green): "Report downloaded — [N] records"
              │
              ├── >50,000 rows:
              │        └── Warning dialog: "This report has N rows — generation may take
              │                             a moment. Continue?"
              │                             [Cancel] [Generate]
              │
              └── Error: Toast (red): "Report generation failed — try again"
```

**Excel output format (pre-formatted — JRN-05.1 requirement):**
- Human-readable headers (not system field names)
- Confidence Score as percentage (e.g., 82%)
- Columns in presentation order: Plan ID | Title | Status | Primary Clinical Condition | Taxonomy Category | Code | Subcode | AI Confidence | Uploaded By | Upload Date | Classified Date | Reviewed By | Override Reason

---

### Flow 5-B: Async Large Report Download (US-5.2)

**Trigger:** System routes large report to async path, or user explicitly requests async
**Exit:** User notified when report ready; downloads via pre-signed URL

```
POST /api/reports  → 202 Accepted  {reportId, status: "GENERATING"}
     │
     ├── Toast (blue): "Report generating — you'll be notified when ready"
     │
     ├── Client polls GET /api/reports/{id} every 5s
     │        ├── status = GENERATING → spinner in reports list row
     │        └── status = READY → row shows download button
     │                 └── GET /api/reports/{id}/download
     │                          → {downloadUrl: "<pre-signed S3 URL>"}
     │                          → browser triggers download
     │                          Toast (green): "Report ready — downloading"
     │
     └── status = FAILED → row shows error; Toast (red): "Report generation failed"
```

---

### Flow 5-C: Ad-Hoc Report Builder (US-5.3)

**Trigger:** User clicks "Ad-hoc Builder" tab on `/reports`
**Exit:** Report generated and downloaded

```
[Reports page → "Ad-hoc Builder" tab]
     │
     ├── Step 1: Column Selection
     │        Checklist of all available columns (all selected by default):
     │        ☑ Plan ID  ☑ Title  ☑ Status  ☑ PCC  ☑ Category
     │        ☑ Code  ☑ Subcode  ☑ AI Confidence  ☑ Uploaded By
     │        ☑ Upload Date  ☑ Classified Date  ☑ Reviewed By
     │        ☑ Reviewed Date  ☑ Override Reason  ☐ Processing Time  ☐ Model Version
     │
     ├── Step 2: Filters
     │        ├── Status multi-select
     │        ├── Date range picker
     │        ├── PCC multi-select
     │        └── [Load Saved Filter ▾] dropdown (saved FilterConfigurations)
     │
     ├── Step 3: Preview
     │        [Preview] button → GET /api/reports/preview
     │        Shows: "N matching rows" + 3 sample rows
     │        Warning if N > 50,000: amber callout
     │
     ├── Step 4: Generate
     │        [Generate Excel] button
     │        └── POST /api/excel/generate with selected columns + filters
     │                 └── Same as Flow 5-A
     │
     └── [Save as Template] button → Flow 5-D
```

---

### Flow 5-D: Save and Manage Report Templates (US-5.4)

**Trigger:** User clicks "Save as Template" in Ad-hoc Builder, or opens "Templates" tab
**Exit:** Template saved; appears in Templates list

```
[Ad-hoc Builder → "Save as Template"]
     │
     └── SaveTemplateDialog:
              ├── Template Name (required, 1–100 chars)
              └── [Save]
                       └── POST /api/reports/templates
                                ├── 409 DUPLICATE_NAME → field error: "Name already exists"
                                └── 201 Created → Toast (green): "Template saved"

[Reports → "Templates" tab]
     │
     └── GET /api/reports/templates
              │
              └── Table: Name │ Created │ Last Run │ [Run] [Edit] [Delete]

              [Run] → POST /api/reports/templates/{id}/run → Flow 5-A/5-B
              [Edit] → EditTemplateDialog (update columns/filters)
              [Delete] → ConfirmationDialog → soft-delete → Toast (muted): "Template deleted"
```

---

### Flow 5-E: Save and Reuse Filter Configurations (US-5.5)

**Trigger:** User clicks "Save Filter" after configuring filters in builder or classification list
**Exit:** Filter saved; available in "Load Saved Filter" dropdown

```
[Filter bar → "Save Filter" link]
     │
     └── SaveFilterDialog:
              ├── Filter Name (1–100 chars)
              └── [Save]
                       └── POST /api/filters
                                └── 201 Created → Toast (green): "Filter saved as '[name]'"

Applying a saved filter:
[Load Saved Filter dropdown → select filter name]
     └── Pre-populates all filter fields with saved values
              └── User can modify and re-save or proceed
```

---
## Flow-06: User Management (US-6.1 – US-6.4)

**User Stories:** US-6.1 (Provision User), US-6.2 (View/Search), US-6.3 (Edit), US-6.4 (Deactivate)
**Journey:** JRN-04.1 (Provision New User), JRN-04.2 (Deactivate Departing User)

---

### Flow 6-A: Provision a New User Account (US-6.1)

**Trigger:** Admin clicks "Add User" on `/users`
**Exit:** User created; verification email sent; user visible in list with "Email Unverified" badge

```
[/users → "Add User" button]
     │
     └── AddUserDialog opens
              │
              ├── Form fields:
              │        ├── Username (3–50 chars, alphanumeric + underscore)
              │        ├── Email (RFC 5322)
              │        ├── Password (8–128 chars, complexity rules shown)
              │        ├── First Name
              │        ├── Last Name
              │        └── Roles (multi-select with descriptions):
              │                 ☑ Reviewer — can upload plans and submit classifications
              │                 ☐ Manager — dashboard, analytics, and reports
              │                 ☐ Taxonomy Admin — taxonomy CRUD
              │                 ☐ Admin — full access including user management
              │                 ☐ Viewer — read-only dashboard and reports
              │
              └── [Create User] button (disabled until all required fields valid)
                       │
                       └── POST /api/users
                                │
                                ├── 409 USERNAME_TAKEN → field error
                                ├── 409 EMAIL_TAKEN → field error
                                ├── 400 INVALID_ROLE → field error
                                │
                                └── 201 Created
                                         ├── Toast (green): "Account created —
                                         │                   Verification email sent
                                         │                   to [email]"
                                         ├── Dialog closes
                                         └── User appears in list:
                                                  Status: Active
                                                  Badge: "Email Unverified" (amber)
```

---

### Flow 6-B: View and Search Users (US-6.2)

**Trigger:** Admin navigates to `/users`
**Exit:** Filtered user list displayed; admin can take action on any row

```
[/users page loads]
     │
     ├── GET /api/users (default: all, sorted createdAt DESC, 25/page)
     │
     ├── Search / Filter bar:
     │        ├── Keyword search (username, email, full name)
     │        ├── Role filter dropdown
     │        └── Status filter: All | Active | Inactive
     │
     ├── Loading: table row skeletons
     │
     └── Table columns:
              Username | Email | Full Name | Roles | Status | Last Login | Created | Actions
              │
              ├── Active user: green dot + "Active"
              ├── Inactive user: gray row + "Inactive" badge
              └── Email Unverified: amber "Email Unverified" badge
```

---

### Flow 6-C: Edit User Details and Roles (US-6.3)

**Trigger:** Admin clicks "Edit" from user row action menu
**Exit:** Updated user; toast confirmation; audit trail updated

```
[User row → action menu → Edit]
     │
     └── EditUserDialog (pre-populated):
              ├── First Name (editable)
              ├── Last Name (editable)
              ├── Phone Number (editable, optional)
              ├── Roles (multi-select — replaces current role set)
              ├── Username: [read-only, shown for reference]
              ├── Email: [read-only, shown for reference]
              │
              └── [Save Changes]
                       └── PUT /api/users/{id}
                                └── 200 OK → Toast (green): "User updated"
```

---

### Flow 6-D: Deactivate a User Account (US-6.4)

**Trigger:** Admin clicks "Deactivate" from user row action menu or from user detail
**Exit:** User status → Inactive; row grayed; access immediately revoked

```
[User row → action menu → Deactivate]
     │
     └── ConfirmationDialog:
              "Deactivate [username]'s account?"
              ──────────────────────────────────────────────────────
              "[Full Name]'s account will be deactivated.
              They will no longer be able to log in.
              All classification records associated with
              their account will remain intact."
              ──────────────────────────────────────────────────────
              [Cancel]  [Deactivate]
              │
              └── PATCH /api/users/{id}/status  { isActive: false }
                       │
                       ├── 400 SELF_DEACTIVATION
                       │        └── Toast (amber): "You cannot deactivate your own account"
                       │
                       └── 200 OK
                                ├── Toast (amber): "[username] deactivated"
                                ├── Row grayed out + "Inactive" badge
                                ├── Active sessions invalidated immediately
                                └── Detail pane shows:
                                         "Deactivated by [admin] on [date/time]"

Reactivation:
[Inactive user → action menu → Reactivate]
     └── PATCH /api/users/{id}/status  { isActive: true }
              └── 200 OK → Toast (green): "[username] reactivated"
                           Row returns to active state
```

---
## Flow-07: Notifications (US-7.1 – US-7.4)

**User Stories:** US-7.1 (In-App Notifications), US-7.2 (Mark as Read), US-7.3 (Preferences), US-7.4 (Email Alerts)
**Journey:** JRN-01.2 Stage 2 (Spot Notifications)

---

### Flow 7-A: Receive In-App Notifications (US-7.1)

**Trigger:** System generates a notification event (classification complete/failed/needs review, pipeline failure, override submitted)
**Exit:** Notification appears in bell panel; unread badge count incremented

```
[System event fires → NotificationService.create()]
     │
     └── Notification record created (isRead=false)
              │
              └── Frontend polls GET /api/notifications/unread-count every 30s
                       (staleTime: 30000 — NOT on every render)
                       │
                       └── Badge count updates on header bell icon: 🔔 [N]
```

**Notification Bell interaction:**

```
[Header → 🔔 [N] Bell click]
     │
     └── Notification dropdown panel opens
              │
              ├── GET /api/notifications?page=0&size=20
              │
              ├── List (sorted createdAt DESC):
              │        ┌────────────────────────────────────────┐
              │        │ ✓ [type icon] Classification Complete   │
              │        │   Plan RP-2026-017 classified          │
              │        │   2 hours ago                         ● │ ← unread dot
              │        ├────────────────────────────────────────┤
              │        │ ✓ [type icon] Classification Failed     │
              │        │   Plan RP-2026-016 failed              │
              │        │   3 hours ago                         ● │
              │        └────────────────────────────────────────┘
              │
              ├── [Mark all as read] link at top of panel
              │
              └── Clicking a notification item:
                       ├── PATCH /api/notifications/{id}/read
                       ├── Unread dot removed; badge count decrements
                       └── If notification links to a plan: navigate to that classification
```

**Notification type icons (lucide-react):**
- `CLASSIFICATION_COMPLETED`: CheckCircle (green)
- `CLASSIFICATION_FAILED`: XCircle (red)
- `CLASSIFICATION_NEEDS_REVIEW`: AlertTriangle (amber)
- `PIPELINE_FAILURE`: AlertOctagon (red)
- `OVERRIDE_SUBMITTED`: Edit (blue)

---

### Flow 7-B: Mark Notifications as Read (US-7.2)

**Trigger:** User clicks individual notification OR clicks "Mark all as read"
**Exit:** Unread indicators cleared; badge count decrements

```
Individual:
[Click notification item]
     └── PATCH /api/notifications/{id}/read
              └── 200 OK → unread dot removed; badge count --

All:
[Mark all as read link]
     └── POST /api/notifications/read-all
              └── 200 OK → all dots removed; badge → 0 (disappears)
```

---

### Flow 7-C: Configure Notification Preferences (US-7.3)

**Trigger:** User navigates to profile settings → Notifications tab
**Exit:** Preferences saved; future notifications follow new rules

```
[User menu → Settings → Notifications]
     │
     └── GET /api/notifications/preferences
              │
              └── Preference grid:
                       ┌─────────────────────────────┬─────────┬─────────┐
                       │ Event Type                  │ In-App  │  Email  │
                       ├─────────────────────────────┼─────────┼─────────┤
                       │ Classification Completed    │   ✓     │   ☐     │
                       │ Classification Failed       │   ✓     │   ✓     │ ← critical
                       │ Classification Needs Review │   ✓     │   ☐     │
                       │ Pipeline Failure            │   ✓     │   ✓     │ ← critical
                       │ Override Submitted          │   ✓     │   ☐     │
                       └─────────────────────────────┴─────────┴─────────┘
                       Email column note: "Email only sent when SMTP is configured"
                       │
                       └── [Save Preferences]
                                └── PUT /api/notifications/preferences
                                         └── 200 OK → Toast (green): "Preferences saved"
```

---
## Flow-08: Help Center (US-8.1 – US-8.4)

**User Stories:** US-8.1 (Browse Articles), US-8.2 (Search Articles), US-8.3 (FAQ Accordion), US-8.4 (Feedback)

---

### Flow 8-A: Browse Help Articles (US-8.1)

**Trigger:** User navigates to `/help`
**Exit:** Article content rendered; user's question answered

```
[/help page]
     │
     ├── GET /api/help/articles
     │
     └── Two-pane layout:
              │
              ├── Left sidebar: Article categories
              │        ├── Getting Started
              │        │        ├── How to upload a plan
              │        │        └── Understanding classification results
              │        ├── Classification
              │        │        └── ...
              │        ├── Reports
              │        └── ...
              │
              └── Main area (default): first article in first category
                       │
                       └── User clicks article link
                                └── GET /api/help/articles/{slug}
                                         └── Renders: Title | Category | Published date
                                                       [Markdown content]
                                                       [Feedback widget]
```

---

### Flow 8-B: Search Help Articles (US-8.2)

**Trigger:** User types in the help search box
**Exit:** Matching articles shown; user clicks to read full article

```
[Help page → Search input]
     │
     ├── Minimum 2 characters required (inline: "Type at least 2 characters")
     │
     ├── GET /api/help/articles/search?q={term}
     │
     ├── Loading: spinner in results area
     │
     ├── Results: Title | Category | Content snippet with match highlighted
     │
     ├── Empty state: "No articles found for '[term]'"
     │                 [Contact Support ↗] link
     │
     └── User clicks result → full article renders in main area
```

---

### Flow 8-C: FAQ Accordion (US-8.3)

**Trigger:** User scrolls to FAQ section on `/help` or clicks "FAQ" in sidebar
**Exit:** User finds answer; accordion item collapses when new one opens

```
[Help page → FAQs section]
     │
     └── GET /api/help/faqs
              │
              └── Accordion (Radix UI Accordion primitive — keyboard accessible):
                       │
                       ├── Category: "Getting Started"
                       │        ├── ▶ [Q1 text]
                       │        ├── ▼ [Q2 text — expanded]  ← only one open per category
                       │        │        [Answer rendered as text]
                       │        └── ▶ [Q3 text]
                       │
                       └── Category: "Classification"
                                └── ...
              │
              └── Category filter: [All ▾] dropdown narrows to one category
```

---

### Flow 8-D: Article Feedback (US-8.4)

**Trigger:** User reaches bottom of an article
**Exit:** Feedback recorded; confirmation shown

```
[Article bottom → "Was this helpful?" widget]
     │
     ├── Default state: [👍 Yes]  [👎 No]
     │
     ├── User clicks Yes or No:
     │        └── Optional comment textarea expands (max 1000 chars)
     │
     └── User clicks [Submit Feedback] (or automatic on click without comment):
              └── POST /api/help/feedback  {articleId, helpful: boolean, comment?}
                       │
                       └── 201 Created / 200 OK (upsert)
                                └── Widget replaced by:
                                         "✓ Thank you for your feedback!"
                                         (upsert: re-submitting overwrites previous response)
```

---
## Screen-00: Landing Page (`/`)

**Purpose:** First impression for new and returning visitors; directs to login or signup
**User Stories:** US-0.1 (Registration CTA), US-0.3 (Login CTA)

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo — PCORI Research Analytics]                 [Login] [Sign Up] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                    HERO SECTION                                       │
│                                                                       │
│         Automate Research Plan Classification                         │
│         Upload a PDF. Get AI-powered taxonomy                         │
│         classification in minutes.                                    │
│                                                                       │
│              [Get Started →]    [Sign In]                             │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  FEATURES GRID (3–4 cards)                                            │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐              │
│  │ AI Classification│ Audit Trail  │ │ Analytics &   │              │
│  │ Upload PDF →  │ │ Every decision│ │ Reporting     │              │
│  │ classified in │ │ logged with   │ │ Real-time KPIs│              │
│  │ minutes       │ │ reviewer name │ │ & Excel export│              │
│  └───────────────┘ └───────────────┘ └───────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│  Footer: © PCORI Research Analytics Platform · Privacy · Terms       │
└─────────────────────────────────────────────────────────────────────┘
```

### States

| State | Appearance |
|---|---|
| Default | Full hero + features grid |
| Loading (first paint) | Hero text skeleton (minimal; landing is mostly static) |

---

## Screen-01: Login (`/login`)

**Purpose:** Authenticate returning users
**User Stories:** US-0.3 (Login), US-0.5 (Password Reset link)

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo]                                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                  ┌─────────────────────────────┐                     │
│                  │  Sign In to PCORI Analytics  │                     │
│                  │                             │                     │
│                  │  Username                   │                     │
│                  │  ┌───────────────────────┐  │                     │
│                  │  │                       │  │                     │
│                  │  └───────────────────────┘  │                     │
│                  │                             │                     │
│                  │  Password              [👁] │                     │
│                  │  ┌───────────────────────┐  │                     │
│                  │  │                       │  │                     │
│                  │  └───────────────────────┘  │                     │
│                  │                             │                     │
│                  │  [          Sign In        ] │                     │
│                  │  (disabled until both filled)│                     │
│                  │                             │                     │
│                  │  Forgot password? · Sign up │                     │
│                  └─────────────────────────────┘                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Sign In button | Center CTA |
| Secondary | Username + Password fields | Form inputs |
| Tertiary | Forgot password / Sign up links | Below CTA |

### States

| State | Appearance | User Feedback |
|---|---|---|
| Default | Form empty; Sign In disabled | N/A |
| Filling | Sign In enabled when both fields non-empty | N/A |
| Loading | Sign In button: spinner, disabled | "Signing in..." |
| Error: invalid credentials | Toast (red): "Invalid username or password" | Attempt counter if near lockout |
| Error: locked | Toast (red): "Account locked. Try again after [X] min" | — |
| Error: unverified | Toast (amber): "Verify your email first" + Resend link | — |
| Error: inactive | Toast (red): "This account has been deactivated" | — |
| Success | Redirect to /dashboard | — |

### Interactive Elements

| Element | Type | Behavior |
|---|---|---|
| Username | Text input | Required; no auto-submit |
| Password | Password input + show/hide toggle | Required; 👁 icon toggles visibility |
| Sign In | Primary button | Disabled until both fields non-empty |
| Forgot password? | Link | → /forgot-password |
| Sign up | Link | → /signup |

---

## Screen-02: Sign Up (`/signup`)

**Purpose:** Self-registration for new users
**User Stories:** US-0.1 (Registration), US-0.2 (Email Verification triggered)

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo]                                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                  ┌─────────────────────────────┐                     │
│                  │  Create your account         │                     │
│                  │                             │                     │
│                  │  Username *                 │                     │
│                  │  ┌─────────────────────┐   │                     │
│                  │  │                     │   │                     │
│                  │  └─────────────────────┘   │                     │
│                  │  3–50 chars, a–z, 0–9, _   │                     │
│                  │                             │                     │
│                  │  Email *                    │                     │
│                  │  First Name *  Last Name *  │                     │
│                  │                             │                     │
│                  │  Password *                 │                     │
│                  │  ┌─────────────────────┐   │                     │
│                  │  │                     │   │                     │
│                  │  └─────────────────────┘   │                     │
│                  │  Requires: uppercase, lowercase, digit            │
│                  │                             │                     │
│                  │  [       Create Account    ] │                     │
│                  │                             │                     │
│                  │  Already have an account? Sign in                 │
│                  └─────────────────────────────┘                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### States

| State | Appearance | User Feedback |
|---|---|---|
| Default | All fields empty; button disabled | N/A |
| Validation (blur) | Field-level inline errors | Red error text below field |
| Error: username taken | Field error: "Username already in use" | — |
| Error: email taken | Field error: "Email already registered" | — |
| Error: password complexity | Field error: lists failing requirements | — |
| Success | Toast (green): "Account created — check your email" → redirect /login | — |

---
## Screen-03: Dashboard (`/dashboard`)

**Purpose:** At-a-glance portfolio health for Program Managers and Executives
**User Stories:** US-3.1 (KPI Cards), US-3.2 (Date Filter), US-3.4 (Recent Feed), US-3.5 (Widget Config), US-3.6 (Executive View)
**Journey:** JRN-02.1 Stage 1–2, JRN-05.1 Stage 1–2

### Layout (12-column grid)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard│Classifications│Taxonomy│Pipeline│Analytics│...    │
│                                              [🔔 3] [David ▾] Logout │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Dashboard                                    [Date Range ▾] [Customize] │
│  Data current as of 09:45 AM                  Apr 21 – May 20, 2026  │
│                                                                       │
│  ROW 1 — KPI Cards (4 across)                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ Total Plans  │ │  Classified  │ │  Processing  │ │ Avg AI Conf. │ │
│  │    143       │ │    128       │ │      3       │ │    81.2%     │ │
│  │              │ │   [+5 today] │ │ [pulsing]    │ │              │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                                       │
│  ROW 2 — Status Breakdown (3 across)                                 │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────┐   │
│  │ Pending          │ │ Failed           │ │ Needs Review       │   │
│  │ ● 8              │ │ ● 2 [red]        │ │ ● 4 [amber]        │   │
│  └──────────────────┘ └──────────────────┘ └────────────────────┘   │
│                                                                       │
│  ─ ─ ─ ─ ─ ─ ─ If FAILED or NEEDS_REVIEW > 0 ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  [⚠ 4 plans need review · 2 failed] [Filter to NEEDS_REVIEW] [Filter to FAILED] │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                                       │
│  ROW 3 — Quick Actions (4 cards)                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌─────────────┐  │
│  │ [↑] Upload  │ │ [☰] View    │ │ [📊] Generate│ │ [🌿] Manage │  │
│  │ Plan        │ │ Classifications│ Reports    │ Taxonomy    │  │
│  └─────────────┘ └─────────────┘ └──────────────┘ └─────────────┘  │
│                                                                       │
│  ROW 4 — Recent Classifications                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Plan ID     │ Title          │ Status    │ PCC    │ Conf │ Date  │ │
│  │ RP-2026-043 │ Telehealth...  │ ● CLASSIFIED│ T2D │ 82% │ Today │ │
│  │ RP-2026-042 │ Shared Dec...  │ ● NEEDS_REVIEW│SDM│ 71% │ Today │ │
│  │ RP-2026-041 │ Remote Pat...  │ ● PROCESSING│ ---│ ---  │ Today │ │
│  │ RP-2026-040 │ Cancer Scr...  │ ● FAILED   │ --- │ ---  │ Yest. │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  [View all Classifications →]                                         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Total classified count, Avg AI Confidence | Row 1 KPI cards |
| Secondary | Failed + Needs Review counts with alert strip | Row 2 |
| Secondary | Quick action shortcuts | Row 3 |
| Tertiary | Recent activity feed | Row 4 |

### States

| State | Appearance | User Feedback |
|---|---|---|
| Loading | Each KPI card shows skeleton independently | N/A |
| Empty (no data) | Icon + "No classification data yet" + [Upload your first plan] CTA | Empty state per card |
| Error (one card fails) | Individual card: error icon + [Retry] | Does not block other cards |
| Active PROCESSING | Processing card: pulsing blue + polling active | N/A |
| VIEWER role | No Quick Actions row; no Upload button | Read-only view |

### Interactive Elements

| Element | Type | Behavior |
|---|---|---|
| Date Range picker | Dropdown | Cascades to all cards + charts simultaneously |
| Customize | Button | Opens widget layout configuration mode |
| KPI cards | Informational | No click action (stat only) |
| Recent feed row | Clickable | → classification detail |
| Alert strip filter links | Quick filter | → /classifications?status=NEEDS_REVIEW etc |
| Quick Action cards | Navigation | → respective routes |

---
## Screen-04: Classifications (`/classifications`)

**Purpose:** The primary workspace for Research Reviewers — upload, triage, review, override
**User Stories:** US-1.1 (Upload), US-1.2 (Monitor), US-1.3 (Review), US-1.4 (Override), US-1.5 (Retry), US-1.6 (Filter)
**Journey:** JRN-01.1, JRN-01.2

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard │ Classifications │ ...              [🔔] [Maya ▾] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Classifications          [↑ Upload Plan]  [⬡ Batch Upload]          │
│                                                                       │
│  ─ ─ ─ URGENT ALERT STRIP (shown when FAILED or NEEDS_REVIEW > 0) ─ │
│  [⚠ 2 plans need review · 1 failed → Filter to NEEDS_REVIEW | FAILED]│
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                                       │
│  FILTER BAR                                                          │
│  Status: [All ▾]  Search: [                ] Date: [Apr 21─May 20]  │
│  PCC: [All ▾]  Saved Filters: [Load ▾]         [Clear Filters]      │
│  Active filters: Status: NEEDS_REVIEW, FAILED  [✕]                  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Plan ID     │ Title           │ Status       │ PCC    │ Code  │  │ │
│  │             │                 │              │        │       │  │ │
│  │ RP-2026-043 │ Telehealth Inte │ ● CLASSIFIED │ T2D    │ DT-01 │ ▸│ │
│  │ RP-2026-042 │ Shared Decision │ ● NEEDS_REVIEW│ SDM  │ BH-03 │ ▸│ │
│  │ RP-2026-041 │ Remote Patient  │ ● PROCESSING │ ---    │ ---   │ ▸│ │
│  │             │                 │ (pulsing)    │        │       │  │ │
│  │ RP-2026-040 │ Cancer Screening│ ● FAILED     │ ---    │ ---   │ ▸│ │
│  │ RP-2026-039 │ Cardiac Rehab   │ ● PENDING    │ ---    │ ---   │ ▸│ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  TABLE COLUMNS (full set):                                            │
│  Plan ID │ Title │ Status │ PCC │ Taxonomy Code │ Confidence │        │
│  Uploaded At │ Reviewed By │ [Actions ▾]                              │
│                                                                       │
│  Action menu per row (▸):  View │ Override │ Retry (FAILED only)│Delete│
│                                                                       │
│  Pagination: [← Prev]  Page 1 of 4  [Next →]   [25 ▾] per page     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Status Badge Reference

| Status | Color | Text Label | Animation |
|---|---|---|---|
| `CLASSIFIED` | Green | "Classified" | None |
| `PROCESSING` | Blue | "Processing" | Pulsing dot |
| `PENDING` | Gray | "Pending" | None |
| `FAILED` | Red | "Failed" | None |
| `NEEDS_REVIEW` | Amber | "Needs Review" | None |

**Color + text label always together — color is never the sole indicator (WCAG 2.1 AA)**

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Upload Plan CTA, urgent alert strip | Page top |
| Primary | Status badges, NEEDS_REVIEW + FAILED plans | Table |
| Secondary | Filter bar with active filter chips | Below header |
| Tertiary | Taxonomy code, reviewed-by columns | Table columns |

### States

| State | Appearance | User Feedback |
|---|---|---|
| Loading | 5–8 skeleton table rows | N/A |
| Empty (no results) | Icon + "No plans match your filters" + [Clear Filters] | — |
| Empty (first use) | Icon + "No plans yet — upload your first plan" + [↑ Upload Plan] | — |
| Active PROCESSING | Blue pulsing badge; polling every 5–10s | N/A |
| Filter applied | Active filter chips shown; [Clear Filters] visible | — |

---

## Screen-04a: Upload Plan Dialog

**Purpose:** Accept PDF uploads with metadata
**User Stories:** US-1.1, US-9.1

### Layout

```
┌──────────────────────────────────────────────┐
│  Upload Research Plan                    [✕] │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │    [↑]                               │   │
│  │    Drag & drop PDF here              │   │
│  │    or click to browse                │   │
│  │    Max size: 50MB                    │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│  ─ ─ ─ After file selected ─ ─ ─ ─ ─ ─ ─   │
│  ✓ research-plan-diabetes-2026.pdf (2.4MB)  │
│                                              │
│  Title (optional)                            │
│  ┌──────────────────────────────────────┐   │
│  │ research-plan-diabetes-2026          │   │
│  └──────────────────────────────────────┘   │
│  (defaults to filename if left blank)        │
│                                              │
│  Notes (optional, max 2000 chars)            │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [Cancel]                     [Upload Plan]  │
│                                              │
└──────────────────────────────────────────────┘
```

### States

| State | Appearance | Feedback |
|---|---|---|
| Default | Empty dropzone with dashed border | N/A |
| Drag over | Dropzone highlighted (accent color) | "Drop to upload" |
| File selected | Filename + size shown; Upload button enabled | — |
| Wrong type | Inline error: "Only PDF files are accepted" | — |
| Too large | Inline error: "File exceeds 50MB maximum" | — |
| Uploading | Progress bar 0–100%; button disabled + spinner | "Uploading..." |
| Success | Dialog closes; toast: "Plan [RP-XXXX] submitted" | — |
| Error | Toast (red) + error message | [Retry] option |

---

## Screen-04b: Manual Override Dialog

**Purpose:** Allow reviewer to correct AI classification with required reason
**User Stories:** US-1.4

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Override Classification: RP-2026-042                        [✕] │
│                                                                  │
│  ┌───────────────────────────┬────────────────────────────────┐  │
│  │ Current AI Classification │ Override to                    │  │
│  │                           │                                │  │
│  │ PCC:                      │ PCC: [Select active PCC ▾]     │  │
│  │  Type 2 Diabetes          │                                │  │
│  │                           │ Category: [Select ▾]           │  │
│  │ Category:                 │                                │  │
│  │  BehavioralCoaching       │ Code: [Select ▾]               │  │
│  │                           │                                │  │
│  │ Code: BC-02               │ Subcode: [Select ▾]            │  │
│  │                           │                                │  │
│  │ Subcode: ---              │ (inactive codes not shown)     │  │
│  │                           │                                │  │
│  │ AI Confidence: 71%        │                                │  │
│  └───────────────────────────┴────────────────────────────────┘  │
│                                                                  │
│  Override Reason *                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│  Required. This is recorded in the audit trail. (1–2000 chars)   │
│  [✕ "Override reason is required" — shown if submitted blank]    │
│                                                                  │
│  [Cancel]                              [Submit Override]         │
│  (Submit disabled until Override Reason is non-empty)            │
└──────────────────────────────────────────────────────────────────┘
```

### States

| State | Appearance | Feedback |
|---|---|---|
| Default | Left: current values; Right: dropdowns empty | N/A |
| Reason missing | Inline error: "Override reason is required" | Submit stays disabled |
| Invalid taxonomy code | Field error: "Code [x] is not active" | — |
| Submitting | Submit button spinner | "Saving..." |
| Success | Dialog closes; toast: "Override saved"; record shows CLASSIFIED + reviewer name | — |

---
## Screen-05: Taxonomy (`/taxonomy`)

**Purpose:** Browse, search, and manage the PCORI/ICD-10 taxonomy hierarchy
**User Stories:** US-2.1 (Add), US-2.2 (Browse), US-2.3 (Edit), US-2.4 (Deactivate), US-2.5 (Search)
**Journey:** JRN-03.1

### Layout (Two-Pane)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard │ Classifications │ Taxonomy │ ...   [🔔] [Priya ▾]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Taxonomy Management        [+ Add Category]  [Search: __________ ]  │
│                                                                       │
│  ┌───────────────────────────────┬─────────────────────────────────┐ │
│  │  TAXONOMY TREE (Left Pane)    │  NODE DETAIL (Right Pane)       │ │
│  │                               │                                 │ │
│  │  ▼ Primary Clinical Cond.     │  Code:     T2D-01               │ │
│  │     ▼ Type 2 Diabetes (T2D)   │  Name:     Type 2 Diabetes      │ │
│  │        ▶ Telehealth (TH)      │  Level:    1 (Category)         │ │
│  │        ▶ Shared Dec. (SDM)    │  Parent:   Primary Clinical Cond│ │
│  │        ▼ Digital Tools (DT)   │  Status:   ● Active             │ │
│  │           ● DT-01             │  Desc:     Interventions for... │ │
│  │           ● DT-02             │  Display Order: 2               │ │
│  │        ── TelehealthGen ──    │                                 │ │
│  │           (inactive, grayed)  │  Last modified by Priya Nair    │ │
│  │     ▶ Heart Failure (HF)      │  on May 20, 2026                │ │
│  │     ▶ Cancer (CA)             │                                 │ │
│  │                               │  ─────────────────────────────  │ │
│  │                               │  [Edit]  [Add Child]            │ │
│  │                               │  [Deactivate]                   │ │
│  │                               │  (shown as [Reactivate] when    │ │
│  │                               │   node is inactive)             │ │
│  │                               │                                 │ │
│  │  [Legend: ● Active ── Inactive│                                 │ │
│  └───────────────────────────────┴─────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Tree hierarchy with active/inactive distinction | Left pane |
| Primary | Add Category CTA, Search | Page header |
| Secondary | Selected node detail and actions | Right pane |
| Tertiary | Audit trail (last modified by) | Right pane footer |

### States

| State | Appearance | Feedback |
|---|---|---|
| Loading | Left: skeleton tree lines; Right: skeleton form | N/A |
| Empty tree (no seed data) | "No taxonomy categories found. Seed data required." | — |
| Node selected | Node highlighted; right pane populated | — |
| Inactive node | Grayed text + "(Inactive)" suffix | — |
| After save | Tree refreshes; new/updated node highlighted briefly | Toast (green) |
| REVIEWER role | [Add Category] / [Edit] / [Deactivate] hidden | Read-only tree + detail |

### Search Results (Left Pane Overlay)

```
Search: [telehealth              ]
─────────────────────────────────
Code     │ Name             │ Level  │ Status
TH-01    │ Telehealth       │ Code   │ Active
TH-GEN   │ TelehealthGeneral│ Code   │ Inactive ──
DT-RPM   │ Remote Patient M │ Subcode│ Active
─────────────────────────────────
[☑ Active only]   "3 results"
─────────────────────────────────
[Clicking result → expands tree + scrolls to node]
```

---

## Screen-05a: Add/Edit Taxonomy Category Dialog

**Purpose:** Create or update a taxonomy node
**User Stories:** US-2.1, US-2.3

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Add Taxonomy Category                           [✕] │
│                                                      │
│  Hierarchy Preview:                                  │
│  Primary Clinical Conditions > Type 2 Diabetes > [?] │
│  (updates live as parent is selected)                │
│                                                      │
│  Code *                                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ RPM-01                                       │   │
│  └──────────────────────────────────────────────┘   │
│  1–50 chars, alphanumeric + hyphens                  │
│                                                      │
│  Name *                                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ Remote Patient Monitoring                    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Parent Category                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Type 2 Diabetes (T2D) — Level 1             ▾│   │
│  └──────────────────────────────────────────────┘   │
│  Level: 2 (auto-set = parent.level + 1)              │
│                                                      │
│  Description (optional, max 2000 chars)              │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Display Order  [0     ]                             │
│                                                      │
│  [Cancel]                     [Save Category]        │
└──────────────────────────────────────────────────────┘
```

### States

| State | Feedback |
|---|---|
| Invalid code (duplicate) | Field error: "Code already exists under this parent" |
| Invalid parent | Field error: "Parent not found or is inactive" |
| Level mismatch | Field error: "Level must be parent level + 1" |
| Circular reference | Field error: "Cannot set this parent — circular reference" |
| Success (create) | Toast: "Category added"; tree refreshes with new node highlighted |
| Success (edit) | Toast: "Category updated"; tree node label updates |

---
## Screen-06: Data Pipeline (`/data-pipeline`)

**Purpose:** Operational monitoring and control of the classification pipeline
**User Stories:** US-4.1 (Status/Health), US-4.2 (Control), US-4.3 (Stage Retry), US-4.4 (Logs/History), US-4.5 (Manual Sync)
**Journey:** JRN-02.1 Stage 2

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard │ Classifications │ Pipeline │ ...  [🔔] [Tom ▾]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Data Pipeline                                                        │
│                                                                       │
│  ── PIPELINE STATUS HEADER ────────────────────────────────────────  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  ● RUNNING              Active Runs: 1    Queue Depth: 8       │  │
│  │  Last sync: 4 min ago   Stuck Records: 0                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ─ ─ STUCK RECORDS WARNING (shown when stuckCount > 0) ─ ─ ─ ─ ─   │
│  [⚠ 2 records stuck in PROCESSING beyond 15 minutes]                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                                       │
│  ── CONTROL ACTIONS (ADMIN role only) ─────────────────────────────  │
│  [Start]  [Stop]  [Pause]  [Resume]  [Sync Now]                      │
│   (buttons contextually enabled/disabled per pipeline state)          │
│                                                                       │
│  ── STAGE CARDS ────────────────────────────────────────────────────  │
│  ┌────────────────────┐ ┌────────────────────┐ ┌──────────────────┐  │
│  │  EXTRACT           │ │  CLASSIFY          │ │  PERSIST         │  │
│  │  ● RUNNING         │ │  ● IDLE            │ │  ● IDLE          │  │
│  │  Last run: 09:41   │ │  Last run: 09:38   │ │  Last run: 09:35 │  │
│  │  Duration: 1,243ms │ │  Duration: 4,821ms │ │  Duration: 312ms │  │
│  └────────────────────┘ └────────────────────┘ └──────────────────┘  │
│                                                                       │
│  ─ ─ FAILED STAGE CARD example ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  CLASSIFY                                                       │  │
│  │  ● FAILED            Last run: 09:25   Duration: 320ms          │  │
│  │  Error: "Connection timeout to ML provider after 30s"           │  │
│  │                                                  [Retry Stage]  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ── DB HEALTH PANEL ────────────────────────────────────────────────  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Connections:  Active: 5 / Max: 20    Idle: 15                 │  │
│  │  Queue Depth:  8 pending records                               │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ── PIPELINE EVENT LOG ────────────────────────  [▼ Expand / ▲ Collapse] │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ [Geist Mono font]                                              │  │
│  │ 09:42:15  INFO   Pipeline run started: run-a1b2c3              │  │
│  │ 09:42:16  INFO   EXTRACT stage: processing RP-2026-043         │  │
│  │ 09:41:55  WARN   Text quality gate: low char count (92)        │  │
│  │ 09:41:12  ERROR  CLASSIFY stage failed: timeout                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  [Load more logs]   Page 1 / 8                                        │
│                                                                       │
│  ── RUN HISTORY TAB ────────────────────────────────────────────────  │
│  Run ID      │ Started    │ Completed  │ Status  │ Processed │ Failed │
│  run-a1b2c3  │ 09:42      │ ---        │ RUNNING │ 3         │ 0      │
│  run-a1b2c2  │ 08:31      │ 08:47      │ DONE    │ 12        │ 1      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Pipeline state indicator + stuck records warning | Status header |
| Primary | Stage cards (state + retry if FAILED) | Center |
| Secondary | Control actions (ADMIN only) | Below header |
| Secondary | DB health panel | Below stages |
| Tertiary | Event log (collapsible) + run history | Bottom |

### States

| State | Appearance | Feedback |
|---|---|---|
| Loading | Skeleton cards for stages + status | N/A |
| RUNNING | Green indicator dot + "RUNNING" text; polling 10s | N/A |
| PAUSED | Amber indicator + "PAUSED"; [Resume] enabled | — |
| STOPPED | Gray indicator + "STOPPED"; [Start] enabled | — |
| FAILED stage | Red card + error message + [Retry Stage] button | — |
| Stuck records | Amber warning callout above control bar | — |
| MANAGER role | Control buttons hidden; Retry buttons hidden | Read-only view |

### Log Level Color Coding

| Level | Color | Text |
|---|---|---|
| INFO | Gray/muted | Standard |
| WARN | Amber | Warning |
| ERROR | Red | Error |

---
## Screen-07: Analytics (`/analytics`)

**Purpose:** Deep-dive analytics for Program Managers — accuracy trends, confidence distribution, override analysis
**User Stories:** US-3.2 (Date Filter), US-3.3 (Analytics Charts)
**Journey:** JRN-02.1 Stage 3–4

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard │ Classifications │ Analytics │ ...  [🔔] [David ▾]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Analytics                          [Date Range: Apr 21 – May 20 ▾] │
│  Filter applied: Apr 21 – May 20, 2026  [Reset to default]           │
│                                                                       │
│  ── ROW 1: ACCURACY TREND + CATEGORY ACCURACY ──────────────────── │
│  ┌─────────────────────────────────┐ ┌──────────────────────────────┐│
│  │  Accuracy Trend                 │ │  Category Accuracy           ││
│  │  [Line chart]                   │ │  [Horizontal bar chart]      ││
│  │   AI ─── Human Corrected ───    │ │                              ││
│  │  100%|                          │ │  Type 2 Diabetes   ████ 94%  ││
│  │   80%|  ⌒⌒⌒⌒⌒                  │ │  Telehealth        ████ 78%  ││
│  │   60%|    ╲  /                  │ │  Shared Dec. Making████ [!]78%││
│  │       Apr  May                  │ │  ← 22% override: above 15%   ││
│  │  Granularity: [Day▾]            │ │  threshold (bar shows red)   ││
│  │                                 │ │  Heart Failure     ███  92%  ││
│  │  Empty: "Accuracy trend will    │ │                              ││
│  │  appear as override data        │ │  [Click bar → filter overrides│
│  │  accumulates"                   │ │   table to that category]    ││
│  └─────────────────────────────────┘ └──────────────────────────────┘│
│                                                                       │
│  ── ROW 2: CONFIDENCE DISTRIBUTION + PROCESSING VOLUME ───────────── │
│  ┌─────────────────────────────────┐ ┌──────────────────────────────┐│
│  │  AI Confidence Distribution     │ │  Processing Volume           ││
│  │  [Histogram — 10 buckets]       │ │  [Area chart]                ││
│  │  (NEVER "Accuracy Distribution")│ │                              ││
│  │      ██                         │ │   80|  ╱╲                   ││
│  │   ████████                      │ │   40| ╱  ╲  ╱              ││
│  │  ████████████                   │ │    0└─────────              ││
│  │  0.0  0.5  1.0                  │ │   Apr    May                ││
│  └─────────────────────────────────┘ └──────────────────────────────┘│
│                                                                       │
│  ── ROW 3: RECENT OVERRIDES TABLE ──────────────────────────────────  │
│  Recent Overrides                     [Filter by PCC ▾]              │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Plan ID     │ Reviewer │ Original         │ Override     │ Date│  │
│  │ RP-2026-042 │ M. Okonkwo│ BehavioralCoach │ DigitalTool  │ Today│ │
│  │ RP-2026-037 │ M. Okonkwo│ Telehealth      │ DigitalTool  │ Yest │ │
│  └────────────────────────────────────────────────────────────────┘  │
│  [Load more]   Page 1                                                 │
│                                                                       │
│  ── ROW 4: MODEL PERFORMANCE ────────────────────────────────────── │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐           │
│  │  Precision     │ │  Recall        │ │  F1 Score      │           │
│  │    0.87        │ │    0.84        │ │    0.85        │           │
│  └────────────────┘ └────────────────┘ └────────────────┘           │
│  Based on 47 evaluated records  OR                                    │
│  "Insufficient data — model performance requires ≥10 evaluated records"│
└─────────────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Date range filter (cascades everywhere) | Page header |
| Primary | Category accuracy + threshold violations | Row 1 right |
| Secondary | Accuracy trend over time | Row 1 left |
| Secondary | Recent overrides table (drill-down) | Row 3 |
| Tertiary | Confidence distribution + volume | Row 2 |
| Tertiary | Model performance KPIs | Row 4 |

### States Per Chart

| Chart | Loading | Empty/Insufficient | Error |
|---|---|---|---|
| Accuracy Trend | Skeleton | "Trend appears as override data accumulates" | Individual error icon + retry |
| Category Accuracy | Skeleton | "No category data for this period" | Individual error |
| Confidence Distribution | Skeleton | "No confidence data yet" | Individual error |
| Processing Volume | Skeleton | "No plans uploaded in this range" | Individual error |
| Recent Overrides | Skeleton rows | "No overrides in this period" | Individual error |
| Model Performance | Skeleton KPIs | "Insufficient data (< 10 records)" | Individual error |

**One chart failing does NOT block other charts from loading.**
**`isAnimationActive={false}` on all Recharts components in production.**

---
## Screen-08: Reports (`/reports`)

**Purpose:** Excel report generation, ad-hoc builder, and template management
**User Stories:** US-5.1 (One-Click Export), US-5.2 (Async Download), US-5.3 (Ad-Hoc Builder), US-5.4 (Templates), US-5.5 (Saved Filters), US-5.6 (Executive Download)
**Journey:** JRN-02.1 Stage 6, JRN-05.1 Stage 3

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard │ Classifications │ Reports │ ...   [🔔] [David ▾] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Reports                                                              │
│                                                                       │
│  [My Reports] [Templates] [Ad-hoc Builder]  ← Tabs                   │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                       │
│  ── TAB: MY REPORTS ────────────────────────────────────────────────  │
│                                                                       │
│  Quick Export:                                                        │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  Date Range: [Apr 21 – May 20 ▾]  Status: [All ▾]  PCC: [All▾]│  │
│  │  Saved filter: [Load ▾]                                       │   │
│  │                            [↓ Export to Excel]  [Save Filter] │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Previous Reports:                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Report                    │ Status     │ Generated    │ Actions  │  │
│  │ pcori-report-2026-05-19   │ ● READY    │ May 19 09:22 │ [↓] [✕] │  │
│  │ pcori-report-2026-05-12   │ ● READY    │ May 12 08:44 │ [↓] [✕] │  │
│  │ pcori-report-large-q2     │ ⏳ GENERATING│ ---         │ [Cancel]│  │
│  │ pcori-report-2026-05-05   │ ● FAILED   │ May 5  11:30 │ [Retry] │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ── TAB: TEMPLATES ─────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Template Name         │ Columns │ Created    │ Actions          │  │
│  │ Weekly Status Report  │ 10 cols │ May 1      │ [▶ Run] [✏] [✕] │  │
│  │ Q2 Executive Summary  │ 7 cols  │ Apr 15     │ [▶ Run] [✏] [✕] │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│  [+ New Template]                                                      │
│                                                                        │
│  ── TAB: AD-HOC BUILDER ────────────────────────────────────────────  │
│  ┌───────────────────────────────┬─────────────────────────────────┐  │
│  │  COLUMN SELECTOR              │  FILTERS                        │  │
│  │                               │                                 │  │
│  │  ☑ Plan ID                    │  Status: [CLASSIFIED ✕][NEEDS.. │  │
│  │  ☑ Title                      │  Date Range: [Apr 21 – May 20]  │  │
│  │  ☑ Status                     │  PCC: [All ▾]                   │  │
│  │  ☑ PCC                        │  Saved filter: [Load ▾]         │  │
│  │  ☑ Category                   │                                 │  │
│  │  ☑ Code                       │  [Preview]                      │  │
│  │  ☑ Subcode                    │  → "143 rows match"             │  │
│  │  ☑ AI Confidence              │     Sample:                     │  │
│  │  ☑ Uploaded By                │     RP-2026-043 | Telehealth... │  │
│  │  ☑ Upload Date                │     RP-2026-042 | Shared Dec... │  │
│  │  ☑ Classified Date            │     RP-2026-041 | Remote...     │  │
│  │  ☑ Reviewed By                │                                 │  │
│  │  ☑ Override Reason            │  [Save as Template]             │  │
│  │  ☐ Processing Time (ms)       │  [Generate Excel]               │  │
│  │  ☐ Model Version              │                                 │  │
│  └───────────────────────────────┴─────────────────────────────────┘  │
│                                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Quick Export (one-click) | My Reports tab top |
| Primary | Generate Excel button in Ad-hoc Builder | Builder bottom |
| Secondary | Previous reports list with download links | My Reports tab |
| Secondary | Templates list with Run action | Templates tab |
| Tertiary | Column selector checkboxes | Ad-hoc Builder |

### States

| State | Appearance | Feedback |
|---|---|---|
| Exporting (sync) | Button spinner, disabled | "Generating report..." |
| GENERATING (async) | Row shows spinner + "Generating" | Poll until READY |
| READY | Green badge + [↓ Download] button | — |
| FAILED | Red badge + [Retry] button | — |
| > 50,000 rows preview | Amber warning: "This report has N rows" | [Cancel] [Generate anyway] |
| Empty templates | "No templates yet" + [Create your first template] | — |

### Excel Output Format (pre-formatted — JRN-05.1 requirement)

| Column Header | Source Field | Format |
|---|---|---|
| Plan ID | planId | Text (e.g., RP-2026-043) |
| Title | title | Text |
| Status | status | Human-readable (e.g., "Classified") |
| Primary Clinical Condition | pcc | Text |
| Taxonomy Category | taxonomyCategory | Text |
| Code | taxonomyCode | Text |
| Subcode | taxonomySubcode | Text |
| AI Confidence | confidenceScore | Percentage (e.g., 82%) |
| Uploaded By | uploadedBy username | Text |
| Upload Date | uploadedAt | Date (YYYY-MM-DD) |
| Classified Date | classifiedAt | Date |
| Reviewed By | reviewedBy username | Text |
| Override Reason | overrideReason | Text |

---
## Screen-09: Users (`/users`) — Admin Only

**Purpose:** Provision, manage, and deactivate user accounts and roles
**User Stories:** US-6.1 (Provision), US-6.2 (Search/View), US-6.3 (Edit), US-6.4 (Deactivate)
**Journey:** JRN-04.1, JRN-04.2

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard │ Classifications │ Users │ ...       [🔔] [Tom ▾] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User Management                                [+ Add User]         │
│                                                                       │
│  SEARCH & FILTER BAR                                                  │
│  Search: [                          ]  Role: [All ▾]  Status: [All ▾]│
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Username    │ Email              │ Full Name   │ Roles    │ Status │
│  │ (+ badges)  │                    │             │          │        │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ m.okonkwo   │ maya@pcori.org     │ Maya Okonkwo│ Reviewer │ ● Active│
│  │             │                    │             │          │ [Email Unverified]│
│  │ d.reyes     │ david@pcori.org    │ David Reyes │ Manager  │ ● Active│
│  │ p.nair      │ priya@pcori.org    │ Priya Nair  │ Tax.Admin│ ● Active│
│  │ t.schaefer  │ tom@pcori.org      │ Tom Schaefer│ Admin    │ ● Active│
│  │ marcus_b    │ marcus@pcori.org   │ Marcus Brown│ Reviewer │ ── Inactive│
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Additional columns (horizontal scroll): Last Login │ Created │ Actions│
│  Actions per row: [View] [Edit] [Deactivate / Reactivate]            │
│                                                                        │
│  Pagination: [← Prev]  Page 1 of 2  [Next →]   [25 ▾] per page      │
│                                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Status Visual Treatment

| Status | Row Appearance | Badge |
|---|---|---|
| Active + Verified | Normal weight text; green dot | "Active" |
| Active + Unverified | Normal text; amber badge | "Email Unverified" |
| Inactive | Grayed out row text; gray | "Inactive" |

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Add User CTA, Search | Page header |
| Primary | Username, email, roles, status | Table core columns |
| Secondary | Last login, created date | Table (secondary columns) |
| Tertiary | Action buttons | Row-level |

### States

| State | Appearance | Feedback |
|---|---|---|
| Loading | Skeleton table rows | N/A |
| Empty (no users) | "No users found" | — |
| No search results | "No users match '[query]'" | — |
| Inactive user row | Grayed text + "Inactive" badge | — |

---

## Screen-09a: Add User Dialog

**Purpose:** Provision a new user account with roles
**User Stories:** US-6.1

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Add User                                                [✕] │
│                                                              │
│  Username *                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  └──────────────────────────────────────────────────────┘   │
│  3–50 characters, letters, numbers, and underscores          │
│                                                              │
│  Email *                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  First Name *         Last Name *                            │
│  ┌───────────────┐    ┌───────────────────────────────┐     │
│  └───────────────┘    └───────────────────────────────┘     │
│                                                              │
│  Password *                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  └──────────────────────────────────────────────────────┘   │
│  8–128 chars · Must include uppercase, lowercase, digit      │
│                                                              │
│  Roles * (select at least one)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ☑ Reviewer — can upload plans and submit classif.    │   │
│  │ ☐ Manager — dashboard, analytics, and reports        │   │
│  │ ☐ Taxonomy Admin — taxonomy CRUD                     │   │
│  │ ☐ Admin — full access including user management      │   │
│  │ ☐ Viewer — read-only: dashboard and reports          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Cancel]                             [Create User]          │
│  A verification email will be sent immediately               │
└──────────────────────────────────────────────────────────────┘
```

---

## Screen-09b: Deactivate User Confirmation Dialog

**Purpose:** Confirm deactivation with clear explanation of consequences
**User Stories:** US-6.4

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Deactivate Account: marcus_b                        [✕] │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Marcus Brown's account will be deactivated.      │   │
│  │                                                  │   │
│  │ He will no longer be able to log in.             │   │
│  │                                                  │   │
│  │ All classification records associated with       │   │
│  │ this account will remain intact.                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Cancel]                          [Deactivate]          │
│                                    (destructive: red btn) │
└──────────────────────────────────────────────────────────┘
```

---
## Screen-10: Help Center (`/help`)

**Purpose:** In-platform self-service documentation and FAQs
**User Stories:** US-8.1 (Browse), US-8.2 (Search), US-8.3 (FAQ), US-8.4 (Feedback)

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard │ Classifications │ ... │ Help   [🔔] [Maya ▾]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Help Center                  [Search articles...              🔍]   │
│                                                                       │
│  ┌─────────────────────────┬─────────────────────────────────────┐   │
│  │  SIDEBAR — Categories   │  MAIN CONTENT AREA                  │   │
│  │                         │                                     │   │
│  │  Getting Started        │  How to Upload a Research Plan      │   │
│  │  ▶ How to upload a plan │  Category: Getting Started          │   │
│  │  ▶ Understanding results│  Published: May 1, 2026             │   │
│  │  ▶ User roles guide     │  ─────────────────────────────────  │   │
│  │                         │                                     │   │
│  │  Classification         │  [Rendered Markdown content]        │   │
│  │  ▶ AI confidence guide  │                                     │   │
│  │  ▶ Override how-to      │  Uploading your first PDF research  │   │
│  │  ▶ Status reference     │  plan is straightforward. Navigate  │   │
│  │                         │  to Classifications and click...    │   │
│  │  Reports                │                                     │   │
│  │  ▶ Excel export guide   │  [Full article content continues]   │   │
│  │  ▶ Ad-hoc builder       │                                     │   │
│  │                         │  ─────────────────────────────────  │   │
│  │  Taxonomy               │  Was this helpful?                  │   │
│  │  ▶ Managing taxonomy    │  [👍 Yes]   [👎 No]                 │   │
│  │  ▶ Deactivating codes   │                                     │   │
│  │                         │  ─────────────────────────────────  │   │
│  │  ─────────────────────  │                                     │   │
│  │  FAQ                    │  FAQ                                │   │
│  │  ─────────────────────  │                                     │   │
│  │  (scrolls to FAQ section│  Getting Started ▼                  │   │
│  │   in main area)         │  ▼ How long does classification take?   │
│  │                         │     Classifications typically       │   │
│  │                         │     complete within 2–5 minutes... │   │
│  │                         │  ▶ What file types are supported?  │   │
│  │                         │  ▶ What does NEEDS_REVIEW mean?    │   │
│  │                         │                                     │   │
│  │                         │  Classification ▶                   │   │
│  └─────────────────────────┴─────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Search bar (fastest path to answer) | Page header |
| Primary | Article content | Main area |
| Secondary | Category sidebar navigation | Left pane |
| Secondary | FAQ accordion | Main area (below articles) |
| Tertiary | Feedback widget | Article footer |

### States

| State | Appearance | Feedback |
|---|---|---|
| Loading (article list) | Skeleton sidebar links | N/A |
| Loading (article content) | Skeleton paragraphs in main area | N/A |
| Article not found | "Article not found" + [Browse all articles] | — |
| Search < 2 chars | Inline: "Type at least 2 characters" | — |
| Search: no results | "No articles found for '[query]'" + [Contact Support] link | — |
| Feedback submitted | "✓ Thank you for your feedback!" replaces widget | — |
| FAQ loading | Skeleton accordion items | N/A |

### Search Results Overlay

```
Search: [telehealth management        ]
─────────────────────────────────────────
Telehealth & Digital Interventions — Classification
  Category: Classification
  "...for telehealth interventions, the system maps..."

Managing Taxonomy Codes — Taxonomy
  Category: Taxonomy
  "...telehealth codes are organized under the..."
─────────────────────────────────────────
2 results for "telehealth management"
```

### Feedback Widget States

```
Default:
  Was this helpful?  [👍 Yes]  [👎 No]

After clicking Yes or No:
  Was this helpful?  [👍 Yes ✓]  [👎 No]
  Optional: Add a comment (max 1000 chars)
  [                                    ]
  [Submit Feedback]  ← optional; auto-submits on click if no comment

After submission:
  ✓ Thank you for your feedback!
```

---
## Interaction Patterns

### Pattern: Loading States (PRD §8.4)

**Specification:** Spinner for ≤2s waits; skeleton placeholders for table rows and cards

| Component | Loading Behavior |
|---|---|
| KPI cards | Individual skeleton per card (independent `useQuery`) |
| Table rows | 5–8 skeleton rows with animated shimmer |
| Charts | Skeleton chart area (fixed height, animated shimmer) |
| Dialog content | Skeleton form fields |
| Two-pane tree | Skeleton tree lines (left) + skeleton form (right) |
| Button (submitting) | Spinner icon + disabled state + descriptive label |

**Implementation:** Tailwind CSS `animate-pulse` on skeleton containers; `opacity-50 cursor-not-allowed` on disabled buttons

---

### Pattern: Empty States (PRD §8.4)

**Specification:** Icon + message + primary CTA

| Screen | Empty Condition | Icon | Message | CTA |
|---|---|---|---|---|
| Dashboard | No classifications | Chart icon | "No classification data yet" | [Upload your first plan] |
| Classifications | No results for filter | Search icon | "No plans match your filters" | [Clear Filters] |
| Classifications | No plans at all | Upload icon | "No plans yet" | [↑ Upload Plan] |
| Taxonomy | No seed data | Tree icon | "No taxonomy categories found. Seed data required." | None |
| Analytics | No override data | TrendingUp icon | "Accuracy trend will appear as override data accumulates" | None |
| Model Performance | < 10 records | BarChart icon | "Insufficient data — requires ≥10 evaluated records" | None |
| Reports | No templates | FileText icon | "No templates yet" | [Create Template] |
| Users | No users | Users icon | "No users found" | [Add User] |
| Help | No search results | HelpCircle icon | "No articles found for '[query]'" | [Contact Support] |
| Notifications | No notifications | Bell icon | "No notifications" | None |

---

### Pattern: Error Communication (PRD §8.4)

**sonner toast configuration:** Top-right, rich colors, 4s default duration

| Error Type | Toast Color | Content | Action |
|---|---|---|---|
| API error (generic) | Red | "Something went wrong — try again" | [Retry] button |
| Validation error | Red | Specific field-level message | None |
| File type rejection | Red | "Only PDF files are accepted" | None |
| File too large | Red | "File exceeds 50MB maximum" | None |
| Session expired | Amber | "Session expired — please log in again" | Auto-redirect /login |
| Permission denied | Red | "You don't have permission for this action" | None |
| Network offline | Amber | "Connection lost — working offline" | None |
| Storage unavailable | Red | "Storage service unavailable — try again" | [Retry] |

**Inline field errors:** Red text below field on blur; form submit blocked until resolved

---

### Pattern: Success Communication (PRD §8.4)

| Action | Toast Content |
|---|---|
| Upload accepted | "Plan [RP-XXXX] submitted — classification in progress" |
| Override saved | "Override saved — classification updated" |
| Taxonomy category added | "Category added" |
| Taxonomy category updated | "Category updated" |
| Taxonomy deactivated | "Code deactivated" |
| User created | "Account created — verification email sent to [email]" |
| User deactivated | "[username] deactivated" |
| Report downloaded | "Report downloaded — [N] records" |
| Template saved | "Template saved" |
| Pipeline started | "Pipeline started" |
| Preferences saved | "Preferences saved" |
| Override submitted | "Override saved" |
| Retry queued | "Classification requeued" |

---

### Pattern: Destructive Action Confirmation (PRD §8.4)

**Specification:** Confirmation dialog with explicit red "Confirm" button

All dialogs:
- Focus trapped inside dialog (Radix UI Dialog primitive)
- ESC key closes without action
- Backdrop click closes without action (for safety)
- Red destructive button is the rightmost button
- [Cancel] is always the leftmost option

Applies to: Delete taxonomy (deactivate), Deactivate user, Delete report template, Delete classification, Pipeline Stop

---

### Pattern: Form Validation (PRD §8.4, §8.6)

**Library:** react-hook-form + zod
**Behavior:**
- Validation triggered on field blur
- Error messages appear below the field inline (red text)
- Submit button disabled until all required fields pass validation
- On server error: field-level errors mapped to specific fields when possible; general toast for unattributable errors
- Password fields: show/hide toggle (👁 icon)
- Explicit `htmlFor` / `aria-label` on all form fields (WCAG 2.1 AA)

---

### Pattern: Session Expiry Redirect (PRD §8.4)

**Trigger:** Any protected API call returns 401

```
Any protected API call returns 401 TOKEN_EXPIRED
     │
     ├── TanStack Query's onError handler detects 401
     ├── Toast (amber): "Session expired — please log in again"
     └── Redirect → /login?redirect=[current-path]
              │
              └── After login: redirect back to [current-path]
```

---

### Pattern: Notification Bell Badge

**Location:** Header, right side, always visible on authenticated pages
**Update frequency:** Polls `GET /api/notifications/unread-count` every 30s (`staleTime: 30000`)
**Badge:** Red dot with count; hidden when count = 0

```
[🔔]      ← no notifications
[🔔 3]    ← 3 unread (badge count)
[🔔 99+]  ← 99+ unread (capped display)
```

---

### Pattern: Status Badge Component

**Used everywhere status is displayed:** Classifications list, detail view, dashboard feed, notification items, reports list

**Implementation:** Single reusable `StatusBadge` component

```
<StatusBadge status="CLASSIFIED" />
  → <span class="badge badge-green">Classified</span>

<StatusBadge status="PROCESSING" />
  → <span class="badge badge-blue animate-pulse">Processing</span>

<StatusBadge status="NEEDS_REVIEW" />
  → <span class="badge badge-amber">Needs Review</span>

<StatusBadge status="FAILED" />
  → <span class="badge badge-red">Failed</span>

<StatusBadge status="PENDING" />
  → <span class="badge badge-gray">Pending</span>
```

**WCAG requirement:** Color alone is NEVER used — always color + text label together.

---

### Pattern: Date Range Filter (Shared)

**Used on:** Dashboard, Analytics, Reports, Classification list
**Default range:** Last 30 days
**Constraint:** `startDate <= endDate` enforced client-side before any API call
**Persistence:** Within session (TanStack Query cache); not persisted across sessions

```
[Date Range ▾]  Apr 21 – May 20, 2026
     │
     └── Popover calendar picker:
              ├── Quick presets: Today | Last 7 days | Last 30 days | This quarter | Custom
              └── Custom: startDate calendar + endDate calendar
```

**On Dashboard/Analytics:** Filter cascades simultaneously to ALL KPI cards and charts via React context + TanStack Query `invalidateQueries`

---
## Responsive Considerations (PRD §8.7)

### Breakpoint Definitions

| Breakpoint | Width | Mode | Navigation |
|---|---|---|---|
| Desktop (primary) | ≥1280px | Full multi-column layout | Horizontal top nav bar |
| Tablet | 768–1279px | Reduced columns, tab nav | Top tabs replacing sidebar |
| Mobile | <768px | Single-column, stacked cards | Drawer navigation (hamburger) |

---

### Desktop (≥1280px) — Primary Target

All screens render at full capacity:
- **Dashboard:** 4-column KPI row; 3-column status row; full 4-column quick-actions; full table
- **Classifications:** Full filter bar + table with all columns visible
- **Taxonomy:** Two-pane layout (tree left, detail right) — both panes visible simultaneously
- **Analytics:** Two charts side-by-side per row
- **Pipeline:** Stage cards in a 3-column row
- **Users:** Full table with all columns
- **Navigation:** Full horizontal top nav; all links visible; no overflow menu

---

### Tablet (768–1279px)

| Element | Change |
|---|---|
| Header navigation | Collapses secondary links into overflow `...` menu or tabs |
| Dashboard KPI row | 4 → 2 columns (2 rows of 2 cards) |
| Dashboard quick actions | 4 → 2 columns |
| Taxonomy two-pane | Right pane slides over left (overlay or full-width detail on node select) |
| Analytics charts | Single chart per row (stacked vertically) |
| Pipeline stage cards | 3 → 1 or 2 columns |
| Classification table | Some columns hidden; "Actions" column always visible |

---

### Mobile (<768px)

| Element | Change |
|---|---|
| Navigation | Hamburger icon → drawer slides in from left |
| All tables | Transform to stacked card list (each row becomes a card) |
| All charts | Full viewport width; legend repositioned below chart |
| KPI cards | Single column stack |
| Taxonomy | Tree view becomes full-page list (no two-pane); selecting a node navigates to detail page |
| Dialog/modals | Full-screen overlay on mobile |
| Filter bar | Collapsed behind "Filters" button; expands as a bottom sheet |
| Upload dialog | Full-screen; drag-and-drop works on supported browsers; tap-to-browse primary |
| Override dialog | Full-screen; scrollable |
| Pipeline controls | Stacked button group |
| Date range picker | Full-width; vertical calendar layout |

---

### Classification Table — Column Priority by Breakpoint

| Column | Desktop | Tablet | Mobile |
|---|---|---|---|
| Plan ID | ✓ | ✓ | ✓ |
| Title | ✓ | ✓ | ✓ |
| Status | ✓ | ✓ | ✓ |
| PCC | ✓ | ✓ | ✗ (in card detail) |
| Taxonomy Code | ✓ | ✗ | ✗ |
| Confidence | ✓ | ✓ | ✗ |
| Uploaded At | ✓ | ✗ | ✗ |
| Reviewed By | ✓ | ✗ | ✗ |
| Actions | ✓ | ✓ | ✓ |

On mobile, hidden columns are visible inside the expanded card view.

---

### Toast Notifications (responsive)

| Breakpoint | Position | Width |
|---|---|---|
| Desktop | Top-right | 380px max |
| Tablet | Top-right | 320px max |
| Mobile | Top (full width) | 100% viewport - 16px padding |

---

### Chart Responsive Behavior

All Recharts charts use `ResponsiveContainer width="100%" height={chartHeight}`:
- Desktop: fixed heights (300px for line/bar/area; 250px for histogram)
- Tablet: heights reduced (220px)
- Mobile: heights reduced further (180px); X-axis labels rotated 45° if needed
- `isAnimationActive={false}` in production on ALL breakpoints

---
## Accessibility Notes (PRD §8.6)

**Target:** WCAG 2.1 AA

---

### Color Contrast

| Context | Requirement | Implementation |
|---|---|---|
| Body text on background | 4.5:1 minimum ratio | Tailwind `text-foreground` on `background` |
| Large text / icons | 3:1 minimum ratio | Headings + icon labels |
| Status badge text on badge background | 4.5:1 | Each badge color pair validated |
| Chart lines on chart background | 3:1 | `chart-1..5` tokens designed for contrast |
| Error text (red) | 4.5:1 | `destructive` token |
| Disabled element text | Exempt from contrast requirement when clearly disabled | `muted` token + `aria-disabled` |

**Status badge contrast pairs (verified):**
- CLASSIFIED: white text on green-700 ✓
- FAILED: white text on red-700 ✓
- NEEDS_REVIEW: black text on amber-400 ✓
- PROCESSING: white text on blue-600 ✓
- PENDING: black text on gray-300 ✓

**Dark mode:** All tokens swap via next-themes; contrast maintained in both light and dark modes.

---

### Status Indicators

**Rule:** Color is NEVER the sole indicator. Every status communicates through color + text label.

Examples:
- Classification status: `● CLASSIFIED` (green dot + "Classified" text)
- Pipeline state: `● RUNNING` (green dot + "RUNNING" text)
- Log level: amber "WARN" text label + color; never just color
- User status: green "Active" / gray "Inactive" — both include text
- Error toasts: red background + explicit error message text

---

### Keyboard Navigation

All interactive elements are keyboard-accessible:

| Component | Keyboard Behavior |
|---|---|
| Navigation links | Tab to focus; Enter to activate |
| Dropdown menus | Tab to open trigger; Arrow keys to navigate; Enter to select; Esc to close |
| Table rows (clickable) | Tab to row; Enter to open detail |
| Dialogs / Modals | Focus trapped inside; Esc closes; Tab cycles through interactive elements |
| Radix UI Accordion (FAQ) | Arrow keys navigate items; Enter/Space toggles; Tab moves between accordions |
| Checkboxes (column selector) | Space toggles; Tab moves between checkboxes |
| Date range picker | Tab/Arrow to navigate calendar; Enter to select date |
| Taxonomy tree | Arrow keys to expand/collapse nodes; Enter to select node |
| Form fields | Standard browser keyboard behavior; explicit label association |

---

### ARIA Labels and Roles

| Element | ARIA Usage |
|---|---|
| Status badges | `role="status"` + `aria-label="[Status: Classified]"` |
| Notification bell | `aria-label="Notifications (3 unread)"` |
| Loading skeletons | `aria-busy="true"` on container; `aria-label="Loading..."` |
| Upload dropzone | `role="button"` + `aria-label="Upload PDF file"` + keyboard-activatable |
| Progress bar (upload) | `role="progressbar"` + `aria-valuenow` + `aria-valuemax` |
| Pipeline state indicator | `aria-live="polite"` for dynamic state changes |
| Charts (Recharts) | `role="img"` + `aria-label="[Chart description]"` on chart container |
| Icon-only buttons | `aria-label` always present (e.g., `aria-label="Close dialog"`) |
| Form fields | `htmlFor` matching `id` on every label; `aria-describedby` for helper text |
| Error messages | `aria-live="assertive"` for inline validation errors |
| Required fields | `aria-required="true"` + visible `*` indicator with legend |

---

### Dialog Behavior

All Radix UI Dialog primitives enforce:
- Focus moves to dialog on open (first focusable element or dialog heading)
- Focus trapped within dialog while open
- ESC closes without action
- Background content inert (`aria-modal="true"`)
- On close: focus returns to the element that triggered the dialog

---

### Screen Reader Considerations

| Feature | Screen Reader Behavior |
|---|---|
| Classification status polling | `aria-live="polite"` on status cell; announces changes without interrupting user |
| Toast notifications (sonner) | `role="alert"` with appropriate `aria-live` level (assertive for errors, polite for success) |
| Pipeline state changes | `aria-live="polite"` on status header; announces new state text |
| Async report generation | Status table row updates; `aria-live` region for "Report ready" announcement |
| Upload progress | `aria-valuenow` updated during upload; percentage announced periodically |
| Unread notification badge | `aria-label` on bell reflects count: "Notifications (3 unread)" |

---

### Form Accessibility

| Rule | Implementation |
|---|---|
| All inputs have explicit labels | `<label htmlFor="field-id">Label</label>` or `aria-label` on input |
| Required fields marked | `aria-required="true"` + visible `*` with `<span aria-hidden="true">*</span>` |
| Field descriptions | `aria-describedby` linking to helper text element |
| Validation errors | `aria-invalid="true"` on field; `aria-describedby` linking to error message |
| Submit disabled state | `disabled` attribute + `aria-disabled="true"` |
| Password complexity | Requirements listed as static text below field; announced when field gains focus |

---

### Focus Management Checklist

- [ ] All modals/dialogs trap focus
- [ ] Escape closes without action on all dialogs
- [ ] After dialog closes, focus returns to trigger element
- [ ] Notification bell panel: focus moves to first notification on open; Esc closes panel
- [ ] Taxonomy tree: arrow key navigation between nodes
- [ ] After successful form submit + page update: focus moves to confirmation area or toast

---
