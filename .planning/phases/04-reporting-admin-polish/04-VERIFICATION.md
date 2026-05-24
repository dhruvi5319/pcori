---
phase: 04-reporting-admin-polish
verified: 2026-05-24T04:17:08Z
status: gaps_found
score: 3/4 must-haves verified
re_verification: false
gaps:
  - truth: "User can click one button to download a .xlsx Excel report of classification data; large exports (>1,000 rows) complete without server OOM errors"
    status: partial
    reason: "The Export to Excel button triggers async generation and shows a toast, but does NOT auto-download the file. The user must separately navigate to the My Reports tab and click the 'Download Report' button once status becomes READY. This is a two-step user flow, not a single-button download. The OOM-prevention (XSSF/SXSSF switching) is correctly implemented in ExcelGenerationService."
    artifacts:
      - path: "frontend/src/components/reports/OneClickExportButton.tsx"
        issue: "On success, shows toast 'Report downloaded — records exported' when status=READY, but never triggers the actual file download (no blob fetch, no anchor click). The comment on line 33 reads 'In a real implementation, we'd first check row count; simulate a check here' — production download path is absent."
      - path: "frontend/src/components/reports/ReportStatusCell.tsx"
        issue: "File download is functional here (blob fetch + anchor click), but requires the user to manually navigate to My Reports tab and click Download Report — this is a separate manual step, not the promised single-button experience."
    missing:
      - "OneClickExportButton.onSuccess handler must call the download API when status=READY, or poll for READY and auto-trigger blob download — a true single-click experience"
      - "Alternatively: accepted UX is to show 'Generating…' then auto-download when polling detects READY; the polling exists in useReports (5s interval) but the auto-download hook is not wired to the generate action"
human_verification:
  - test: "Navigate to /reports. Click 'Export to Excel'. Observe if a .xlsx file is downloaded to the browser."
    expected: "A single button click produces a downloaded .xlsx file (or an async flow that auto-downloads when ready, without requiring additional user action)"
    why_human: "The button behavior depends on the async report generation timing; the distinction between 'shows toast + user must manually download' vs 'auto-downloads' requires browser observation"
  - test: "On /reports Ad-hoc Builder tab, click 'Save as Template'. In the dialog, click the 'Edit' (pencil) button on a saved template in the Templates tab."
    expected: "An Edit Template dialog appears pre-populated with the template's columns and filters"
    why_human: "The Edit button in TemplatesTable.tsx has a TODO stub (line 172: '// TODO: Open edit dialog — deferred to Phase 4 edit flow') — no edit dialog is wired. Requires human to confirm if this was intentionally deferred or blocks SC-2."
---

# Phase 4: Reporting & Admin Polish Verification Report

**Phase Goal:** Program managers can generate and download Excel reports on demand; admins can manage all users and roles through the UI; every user has a browsable help center — completing the platform for all five personas
**Verified:** 2026-05-24T04:17:08Z
**Status:** gaps_found — 1 gap blocking full goal achievement, 1 warning
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | User can click one button to download a .xlsx Excel report; large exports (>1,000 rows) complete without server OOM | ⚠️ PARTIAL | Export button triggers async generation but does NOT auto-download; user must take a second manual step. XSSF/SXSSF OOM prevention is correctly wired. |
| SC-2 | User can build an ad-hoc report, preview results, download, and save as named reusable template | ⚠️ PARTIAL | Column selector, filter panel, preview, generate, and Save Template dialog all work. However, the **Edit Template** button in TemplatesTable.tsx is a TODO stub (no dialog wired) — template editing is broken. |
| SC-3 | Admin can create, edit, deactivate (not hard-delete), and assign roles to any user account; user search and filtering work across all fields | ✓ VERIFIED | UserController (8 endpoints), UserService (create/update/deactivate/reactivate/soft-delete), UserSpecification (ILIKE on username/email/firstName/lastName + role join), AddUserDialog, EditUserDialog, DeactivateUserConfirmDialog, ReactivateUserConfirmDialog all exist and are fully wired. |
| SC-4 | Any authenticated user can browse help articles and FAQs by category, search the article index, and submit documentation feedback | ✓ VERIFIED | HelpController (12 endpoints), HelpService, HelpArticleRepository (GIN full-text via plainto_tsquery), HelpCategorySidebar, HelpArticleView (react-markdown), HelpSearchBar (300ms debounce, ≥2 chars), FaqSection (Radix Accordion), FeedbackWidget (4-state machine + localStorage) all exist and are fully wired. |

**Score: 2/4 truths fully verified, 2/4 partial (with specific gaps detailed below)**

---

## Required Artifacts

### Database Layer (04-01)

| Artifact | Status | Evidence |
|----------|--------|----------|
| `backend/src/main/resources/db/migration/V8__reporting_help_schema.sql` | ✓ VERIFIED | 6 tables (report_configurations, excel_reports, filter_configurations, help_articles, faqs, documentation_feedback), 1 enum (report_status), GIN full-text index (idx_help_fts), all UNIQUE constraints present, REFERENCES users(id) on all FK columns |

### Backend — User Management (04-02)

| Artifact | Status | Evidence |
|----------|--------|----------|
| `backend/.../user/UserService.java` | ✓ VERIFIED | 195 lines; createUser, updateUser, deactivateUser (self-guard), reactivateUser, deleteUser (soft), listAll, listActive, searchUsers — all implemented |
| `backend/.../user/UserController.java` | ✓ VERIFIED | 122 lines; 8 REST endpoints, ADMIN @PreAuthorize on all write endpoints |
| `backend/.../user/UserSpecification.java` | ✓ VERIFIED | ILIKE matching across username/email/firstName/lastName; byRole JOIN; byStatus filter |

### Backend — Reporting (04-03)

| Artifact | Status | Evidence |
|----------|--------|----------|
| `backend/.../report/ExcelGenerationService.java` | ✓ VERIFIED | 237 lines; STREAMING_THRESHOLD=1000, SXSSFWorkbook(500) with compressTempFiles for >1000 rows, XSSFWorkbook for ≤1000; 13 UX-spec columns; ClassificationSpecification filter parsing |
| `backend/.../report/ReportService.java` | ✓ VERIFIED | 346 lines; @Async(classificationExecutor), REQUIRES_NEW transaction, startGeneration/downloadReport/getPreview/createTemplate/listTemplates/updateTemplate/deleteTemplate/runTemplate all implemented |
| `backend/.../report/ReportController.java` | ✓ VERIFIED | 177 lines; 11 REST endpoints including Content-Disposition download header |
| `backend/.../report/FilterController.java` | ✓ VERIFIED | User-scoped filter CRUD, 404-not-403 ownership check |

### Backend — Help Center (04-04)

| Artifact | Status | Evidence |
|----------|--------|----------|
| `backend/.../help/HelpArticleRepository.java` | ✓ VERIFIED | Native SQL `searchFullText` using `@@ plainto_tsquery('english', :q)` with ts_rank ordering |
| `backend/.../help/HelpService.java` | ✓ VERIFIED | 210 lines; article CRUD, FAQ CRUD, searchArticles (≥2 char enforcement), submitFeedback (duplicate guard + DataIntegrityViolationException belt-and-suspenders) |
| `backend/.../help/HelpController.java` | ✓ VERIFIED | 145 lines; 12 REST endpoints; search before /{slug} to prevent path conflict |

### Frontend — Reports UI (04-06)

| Artifact | Status | Evidence |
|----------|--------|----------|
| `frontend/src/app/(protected)/reports/page.tsx` | ✓ VERIFIED | Renders OneClickExportButton + ReportsTabs |
| `frontend/src/hooks/useReports.ts` | ✓ VERIFIED | All mutations (generate, createTemplate, updateTemplate, deleteTemplate, runTemplate, saveFilter); 5s polling when GENERATING |
| `frontend/src/components/reports/OneClickExportButton.tsx` | ⚠️ PARTIAL | Button exists, wired to createReport mutation, loading state correct — but onSuccess does NOT trigger file download (only shows toast). Contains comment: "In a real implementation, we'd first check row count; simulate a check here" |
| `frontend/src/components/reports/ReportStatusCell.tsx` | ✓ VERIFIED | Proper blob fetch + anchor click download for READY reports |
| `frontend/src/components/reports/AdHocBuilderTab.tsx` | ✓ VERIFIED | ColumnSelectorPanel + BuilderFilterPanel + ReportPreviewPanel wired |
| `frontend/src/components/reports/ReportPreviewPanel.tsx` | ✓ VERIFIED | Preview API call, row count display, >50k amber callout, 3-row sample table, Generate Excel + Save Template actions |
| `frontend/src/components/reports/SaveTemplateDialog.tsx` | ✓ VERIFIED | react-hook-form + zod, name field, 409 inline error, "Don't Save"/"Save Template" buttons |
| `frontend/src/components/reports/TemplatesTable.tsx` | ⚠️ PARTIAL | Run and Delete actions wired; **Edit (pencil) button is a TODO stub** (line 172: `// TODO: Open edit dialog — deferred to Phase 4 edit flow`) — no EditTemplateDialog exists |

### Frontend — Users UI (04-07)

| Artifact | Status | Evidence |
|----------|--------|----------|
| `frontend/src/app/(protected)/users/page.tsx` | ✓ VERIFIED | 130 lines; useUsers hook wired, filter bar, table, all 4 dialogs wired |
| `frontend/src/hooks/useUsers.ts` | ✓ VERIFIED | useCreateUser, useUpdateUser, useToggleUserStatus (with 400 self-deactivation error handling), useDeleteUser |
| `frontend/src/components/users/UsersTable.tsx` | ✓ VERIFIED | E1 elevation, opacity-75 for inactive rows |
| `frontend/src/components/users/AddUserDialog.tsx` | ✓ VERIFIED | 315 lines; 6 fields, RoleCheckboxGroup, 409 inline errors for username/email |
| `frontend/src/components/users/EditUserDialog.tsx` | ✓ VERIFIED | Editable firstName/lastName/phone/roles; read-only username/email (not shown in form) |
| `frontend/src/components/users/DeactivateUserConfirmDialog.tsx` | ✓ VERIFIED | bg-[#DC2626] destructive button, auto-focused dismiss via onOpenAutoFocus |
| `frontend/src/components/users/ReactivateUserConfirmDialog.tsx` | ✓ VERIFIED | Secondary (non-destructive) buttons |
| `frontend/src/components/users/UserFilterBar.tsx` | ✓ EXISTS | File exists |
| `frontend/src/components/users/UserSpecification.java` | ✓ VERIFIED | 4-field ILIKE + role JOIN + status |

### Frontend — Help Center UI (04-08)

| Artifact | Status | Evidence |
|----------|--------|----------|
| `frontend/src/app/(protected)/help/page.tsx` | ✓ VERIFIED | Two-pane layout (240px sidebar + fluid), auto-selects first article |
| `frontend/src/hooks/useHelp.ts` | ✓ VERIFIED | useArticles, useArticle, useSearchArticles (enabled ≥2 chars), useFaqs, useArticleFeedback, useSubmitFeedback (409 silent) |
| `frontend/src/components/help/HelpCategorySidebar.tsx` | ✓ VERIFIED | Groups articles by category, selected-state styling |
| `frontend/src/components/help/HelpArticleView.tsx` | ✓ VERIFIED | ReactMarkdown with custom component overrides, max-w-[720px], FeedbackWidget wired |
| `frontend/src/components/help/HelpSearchBar.tsx` | ✓ VERIFIED | 300ms debounce, ≥2 char minimum, overlay results |
| `frontend/src/components/help/FaqSection.tsx` | ✓ VERIFIED | Groups by category, sort by displayOrder, delegates to FaqCategoryGroup |
| `frontend/src/components/help/FaqCategoryGroup.tsx` | ✓ VERIFIED | Radix Accordion.Root type="single" collapsible |
| `frontend/src/components/help/FeedbackWidget.tsx` | ✓ VERIFIED | 4-state machine (default→helpful-selected/not-helpful-selected→submitted), localStorage persistence, calls useSubmitFeedback |

### Navigation (04-09)

| Route | Roles | Status | Evidence |
|-------|-------|--------|----------|
| `/reports` | MANAGER, VIEWER | ✓ VERIFIED | AppSidebar.tsx line 27 |
| `/users` | ADMIN | ✓ VERIFIED | AppSidebar.tsx line 28 |
| `/help` | (unrestricted) | ✓ VERIFIED | AppSidebar.tsx line 29 |

---

## Key Link Verification

| From | To | Via | Status | Notes |
|------|----|-----|--------|-------|
| `OneClickExportButton` → `POST /api/excel/generate` | `useCreateReport` | `createReport.mutate` | ✓ WIRED | Generation triggered |
| `OneClickExportButton` → file download | blob fetch + anchor | `onSuccess` handler | ✗ NOT_WIRED | onSuccess shows toast only; no `URL.createObjectURL` or anchor click |
| `ReportStatusCell` → `GET /api/reports/{id}/download` | blob fetch | `handleDownload` | ✓ WIRED | Proper blob+anchor click download |
| `ReportPreviewPanel` → `GET /api/reports/preview` | `api.get` | `handlePreview` | ✓ WIRED | Fetches preview, renders count + sample table |
| `SaveTemplateDialog` → `POST /api/reports` | `useCreateTemplate` | `createTemplate.mutate` | ✓ WIRED | 409 inline error handled |
| `TemplatesTable Edit button` → Edit dialog | (none) | TODO stub | ✗ NOT_WIRED | `onClick={() => { /* TODO */ }}` — no EditTemplateDialog |
| `TemplatesTable Delete button` → `DELETE /api/reports/templates/{id}` | `useDeleteTemplate` | `setDeleteTarget` → confirm dialog | ✓ WIRED | Soft-delete confirmed |
| `TemplatesTable Run button` → `POST /api/reports/templates/{id}/run` | `useRunTemplate` | `handleRun` | ✓ WIRED | |
| `UsersPage` → `GET /api/users` / `GET /api/users/search` | `useUsers` | `api.get` | ✓ WIRED | Filter routing works |
| `AddUserDialog` → `POST /api/users` | `useCreateUser` | `createUser.mutate` | ✓ WIRED | 409 inline error |
| `DeactivateUserConfirmDialog` → `PATCH /api/users/{id}/status` | `useToggleUserStatus` | `toggleStatus.mutate` | ✓ WIRED | Self-deactivation error handled |
| `HelpSearchBar` → `GET /api/help/articles/search` | `useSearchArticles` | debounce → hook | ✓ WIRED | 300ms debounce, ≥2 chars |
| `FeedbackWidget` → `POST /api/help/feedback` | `useSubmitFeedback` | `submitFeedback.mutate` | ✓ WIRED | 409 silenced, localStorage set |
| `HelpArticleView` → article content | `ReactMarkdown` | `useArticle` | ✓ WIRED | |
| `ExcelGenerationService` → SXSSF for >1000 rows | `SXSSFWorkbook(500)` | `rowCount > STREAMING_THRESHOLD` | ✓ WIRED | OOM prevention confirmed |
| `V8 migration` → `users(id)` | `REFERENCES users(id)` | FK constraints | ✓ WIRED | All owner_id/user_id FKs reference users(id) |
| `HelpArticleRepository.searchFullText` → GIN index | `plainto_tsquery` | `@@ search_vector` | ✓ WIRED | Native SQL query confirmed |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `frontend/src/components/reports/TemplatesTable.tsx` | 172 | `onClick={() => { // TODO: Open edit dialog — deferred to Phase 4 edit flow }}` | 🛑 Blocker | SC-2 requires templates "can be saved as named reusable templates" — editing is part of the template management workflow. The edit button is a visible UI element that does nothing on click. |
| `frontend/src/components/reports/OneClickExportButton.tsx` | 33 | `// In a real implementation, we'd first check row count; simulate a check here` | ⚠️ Warning | Row-count pre-check is simulated, meaning the Large Report Warning Dialog is never shown by the one-click button. The download file itself is never triggered on success either. |

---

## Requirements Coverage

| Feature Requirement | Status | Notes |
|--------------------|--------|-------|
| FR-6.1: Excel report generation | ✓ SATISFIED | Async generation with 202 response, XSSF/SXSSF OOM prevention |
| FR-6.2: Report download | ⚠️ PARTIAL | Download works via ReportStatusCell; OneClickExportButton does not auto-download |
| FR-6.3: Report templates (save/list/delete) | ✓ SATISFIED | Create, list, delete all wired end-to-end |
| FR-6.3: Report templates (edit) | ✗ BLOCKED | Edit button is a TODO stub |
| FR-6.4: Ad-hoc builder with preview | ✓ SATISFIED | Column selector, filter panel, preview with row count + sample table |
| FR-7.1: User CRUD | ✓ SATISFIED | Create, read, update, soft-delete all wired |
| FR-7.2: User active/inactive toggle | ✓ SATISFIED | Deactivate (with self-guard) and reactivate wired |
| FR-7.3: User search/filter | ✓ SATISFIED | ILIKE on all user fields + role + status filter |
| FR-9.1: Help articles/FAQs | ✓ SATISFIED | Browse by category (sidebar), full-text search, FAQ accordion |
| FR-9.2: Documentation feedback | ✓ SATISFIED | Submit feedback with thumbs + comment, duplicate-safe, localStorage persistence |

---

## Human Verification Required

### 1. Single-Click Excel Download UX

**Test:** Navigate to `/reports`. Click the gradient "Export to Excel" button once.
**Expected:** Either: (a) A .xlsx file is immediately downloaded to your browser downloads, or (b) A "generating" state begins and automatically downloads the file when generation completes — without requiring any additional user action.
**Current behavior (from code):** The button posts to `/api/excel/generate`, receives a 202 response with `status: GENERATING`, shows a toast ("Report generating — you'll be notified when ready"), but no download is ever triggered. The user must separately navigate to the My Reports tab and click "Download Report" manually.
**Why human:** Confirms whether the current two-step flow satisfies SC-1 or whether auto-download needs to be added to `OneClickExportButton.onSuccess`.

### 2. Template Edit Functionality

**Test:** On `/reports`, navigate to the Templates tab. Create a template via Ad-hoc Builder → "Save as Template". Then click the pencil (Edit) icon on the saved template.
**Expected:** An "Edit Template" dialog opens, pre-populated with the template's current column selection and filters.
**Current behavior (from code):** The pencil button's `onClick` handler contains only a TODO comment with no implementation. Clicking it does nothing.
**Why human:** Confirms whether template editing is required for SC-2 ("reports can be saved as named reusable templates" could mean just save+run, not edit), or whether the TODO stub blocks the acceptance criterion.

---

## Gaps Summary

Two gaps were found that prevent full goal achievement:

**Gap 1 — One-click download not auto-triggering (SC-1/SC-2):**
The `OneClickExportButton` starts async report generation but its `onSuccess` handler never fetches the generated file and triggers a browser download. The download capability *exists* in `ReportStatusCell` (correct blob fetch → anchor click implementation), but it requires the user to navigate to My Reports and click manually — a two-step flow, not a one-button download. Additionally, the "simulate a check here" comment on line 33 indicates the large-report row-count pre-check was deferred and never implemented.

**Gap 2 — Template Edit button is a TODO stub (SC-2):**
The Edit (pencil) button in `TemplatesTable.tsx` contains only a comment (`// TODO: Open edit dialog — deferred to Phase 4 edit flow`) with no dialog wired. While Run and Delete work, editing an existing template is non-functional. No `EditTemplateDialog` component exists in the codebase.

**What works well:**
- Backend report generation pipeline: complete, streaming OOM-prevention, async architecture all correct
- User management: full CRUD, soft-delete, self-deactivation guard, role assignment, multi-field search — all verified
- Help center: article browsing, full-text search, FAQ accordion, feedback widget — all verified
- Template Save, Run, Delete: all correctly wired
- Navigation: /reports, /users, /help all wired in AppSidebar with correct role guards
- TypeScript: frontend builds clean (tsc --noEmit passes)

---

*Verified: 2026-05-24T04:17:08Z*
*Verifier: Claude (pivota_spec-verifier)*
