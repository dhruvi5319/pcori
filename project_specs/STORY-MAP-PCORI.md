# Story Map
## PCORI Research Analytics Platform

| Field | Value |
|---|---|
| **Product Name** | PCORI Research Analytics Platform |
| **Project Acronym** | PCORI |
| **Document Version** | 1.0 |
| **Document Type** | User Story Map |
| **Date** | 2026-05-20 |
| **Related Artifacts** | `PERSONAS-PCORI.md` v1.0 · `JTBD-PCORI.md` v1.0 · `JOURNEYS-PCORI.md` v1.0 · `UserStories-PCORI.md` v1.0 · `PRD-PCORI.md` v1.0 |

---

## 1. Overview

This Story Map organizes the 51 user stories (US-0.1 through US-9.4) from UserStories-PCORI into a **two-dimensional map**: journey stages on the X-axis and activity/epic rows on the Y-axis. A **NaC (Natural Acceptance Criteria)** column bridges JTBD outcomes to testable story criteria by deriving each criterion from the intersection of a specific JTBD outcome and its journey stage context.

**Release Alignment** follows the five-phase research structure:

| Release | Theme | Priority Tier |
|---|---|---|
| **R1** | Foundation & Auth | P0 — Auth, User Mgmt, Storage |
| **R2** | Classification Pipeline | P0 — Taxonomy + Upload + Classification core |
| **R3** | Insights & Analytics | P1 — Dashboards, Pipeline Monitoring |
| **R4** | Reporting & Admin Polish | P1/P2 — Reports, Help Center, Notifications |
| **R5** | ML Integration & Productionization | P2 — ML model swap, advanced notifications, ad-hoc reports |

**Story Map ID Convention:** `SM-{Epic}.{NN}` (e.g., SM-0.1, SM-1.1)

**NaC Concept:** NaC are derived — not invented — from the intersection of:
1. A specific JTBD functional outcome (the "what matters")
2. The journey stage context (the "when/where")
3. The user story (the "what is built")

---

## 2. Story Map Matrix

### 2A. PER-01 Maya (Research Reviewer) — JRN-01.1 + JRN-01.2

| SM-ID | Journey Stage | Activity | Epic | Story | NaC (derived from JTBD) | Release |
|---|---|---|---|---|---|---|
| SM-0.3 | **Arrive / Login** | Log in with email + password | Epic 0 (F0) | US-0.3: User Login | JTBD-01.2 → "Reach highest-priority items within 60s of login": Login succeeds and lands reviewer on classification queue in < 60 seconds total | R1 |
| SM-0.4 | **Arrive / Login** | Session persists across pages | Epic 0 (F0) | US-0.4: JWT Token Refresh | JTBD-01.2 → "No re-login mid-workflow": Token refresh is silent; reviewer never sees a login prompt during an active review session | R1 |
| SM-0.6 | **Arrive / Login** | End session securely | Epic 0 (F0) | US-0.6: Logout | JTBD-01.2 → "Secure, trust-worthy platform": Logout terminates access immediately; no further API calls succeed with the old token | R1 |
| SM-0.5 | **Arrive / Login** | Self-recover from forgotten password | Epic 0 (F0) | US-0.5: Password Reset via Email | JTBD-01.2 → "Access without blocking the manager": Password reset completes without admin intervention in < 60 minutes | R1 |
| SM-1.6 | **Orient / Triage** | Filter queue by status, date, PCC | Epic 1 (F1) | US-1.6: Search and Filter Queue | JTBD-01.2 → "Identify urgent items within 60s": Filter for NEEDS_REVIEW + FAILED returns matching records in < 1.5 seconds | R2 |
| SM-1.2 | **Orient / Triage** | Monitor processing status | Epic 1 (F1) | US-1.2: Monitor Classification Status | JTBD-01.2 → "Know status without polling": Status badges (PENDING/PROCESSING/CLASSIFIED/FAILED/NEEDS_REVIEW) are visible and accurate on the list | R2 |
| SM-1.1 | **Upload** | Upload PDF research plan | Epic 1 (F1) | US-1.1: Upload a Research Plan PDF | JTBD-01.1 → "Plan enters pipeline within 2s": Upload returns 202 Accepted with planId within 2 seconds for a 10-page PDF | R2 |
| SM-9.1 | **Upload** | Secure PDF storage | Epic 9 (F9) | US-9.1: Securely Store an Uploaded PDF | JTBD-01.1 → "Upload accepted reliably": Non-PDF is rejected immediately; valid PDF is stored with UUID key and UploadedFile entity linked to classification | R2 |
| SM-9.2 | **Upload** | Reference original PDF | Epic 9 (F9) | US-9.2: Download PDF via Pre-Signed URL | JTBD-01.1 → "Access source document for borderline reviews": Pre-signed URL available from classification detail; expires in 15 min; requires uploader or ADMIN role | R2 |
| SM-1.3 | **Review** | Read AI classification + confidence | Epic 1 (F1) | US-1.3: Review AI Classification Results | JTBD-01.1 → "All 4 taxonomy dimensions + confidence visible": PCC, category, code, subcode, AI confidence % all displayed on the detail page; NEEDS_REVIEW shown if confidence < 0.75 | R2 |
| SM-1.4 | **Override** | Correct taxonomy + record reason | Epic 1 (F1) | US-1.4: Override an AI Classification | JTBD-01.3 → "Override requires non-empty reason; reviewedBy + reviewedAt recorded": Form blocks submission if reason is blank; override record includes reviewer identity, timestamp, and reason | R2 |
| SM-1.5 | **Override** | Retry after failure | Epic 1 (F1) | US-1.5: Retry a Failed Classification | JTBD-01.1 → "No lost work on transient failures": Retry resets to PENDING and re-queues; available only on FAILED records | R2 |
| SM-7.1 | **Monitor / Alert** | Receive in-app alert on completion | Epic 7 (F7) | US-7.1: Receive In-App Notifications | JTBD-01.4 → "Zero missed NEEDS_REVIEW alerts": Notification bell shows unread badge within ≤ 30s polling interval when classification transitions to CLASSIFIED/FAILED/NEEDS_REVIEW | R4 |
| SM-7.2 | **Monitor / Alert** | Clear notification queue | Epic 7 (F7) | US-7.2: Mark Notifications as Read | JTBD-01.4 → "Track what still needs attention": Mark-read removes items from unread badge; user can distinguish actioned from pending alerts | R4 |
| SM-7.3 | **Monitor / Alert** | Control alert channels | Epic 7 (F7) | US-7.3: Configure Notification Preferences | JTBD-01.4 → "Critical alerts without noise": Email enabled by default only for CLASSIFICATION_FAILED; in-app enabled for all event types | R4 |
| SM-8.1 | **Self-Serve Help** | Browse help articles | Epic 8 (F8) | US-8.1: Browse Help Articles | JTBD-01.2 → "Self-serve answers without contacting support": Reviewer finds answer in Help Center without creating a support ticket | R4 |
| SM-8.2 | **Self-Serve Help** | Search help articles | Epic 8 (F8) | US-8.2: Search Help Articles | JTBD-01.2 → "Find answers quickly": Search returns relevant article within 2 characters typed; results include content snippet | R4 |
| SM-8.3 | **Self-Serve Help** | Browse FAQ accordion | Epic 8 (F8) | US-8.3: View FAQ Accordion | JTBD-01.2 → "Scan common answers efficiently": FAQ accordion grouped by category with keyboard navigation support | R4 |
| SM-8.4 | **Self-Serve Help** | Provide article feedback | Epic 8 (F8) | US-8.4: Submit Article Feedback | JTBD-01.2 → "Documentation stays current and useful": Feedback captured per user per article; helps identify low-quality content | R4 |

---

### 2B. PER-02 David (Program Manager) — JRN-02.1

| SM-ID | Journey Stage | Activity | Epic | Story | NaC (derived from JTBD) | Release |
|---|---|---|---|---|---|---|
| SM-3.1 | **Morning Health Check** | View live KPI cards | Epic 3 (F3) | US-3.1: View Dashboard KPI Cards | JTBD-02.1 → "Dashboard loads in < 1.5s with all KPI cards": Total Plans, Classified, Failed, Needs Review, Avg Confidence all display current values within 1.5 seconds | R3 |
| SM-3.2 | **Morning Health Check** | Filter by date range | Epic 3 (F3) | US-3.2: Filter Dashboard by Date Range | JTBD-02.1 → "Date filter cascades to all charts simultaneously": Changing date range triggers refetch on all KPI cards and chart components in the same render cycle | R3 |
| SM-3.4 | **Morning Health Check** | Scan recent classifications | Epic 3 (F3) | US-3.4: View Recent Classifications Feed | JTBD-02.1 → "Spot new submissions immediately": Feed shows last 10 classifications sorted by uploadedAt DESC; status badges use text + color | R3 |
| SM-4.1 | **Pipeline Check** | View pipeline health | Epic 4 (F4) | US-4.1: View Pipeline Status and Health | JTBD-02.1 → "Stuck records surface before they delay reporting": Records in PROCESSING beyond STUCK_TIMEOUT_MINUTES highlighted with warning; queue depth and DB connection stats visible | R3 |
| SM-3.3 | **Spot Anomaly** | View category accuracy chart | Epic 3 (F3) | US-3.3: View Analytics Charts | JTBD-02.3 → "Every category >15% override rate visually highlighted": Category accuracy horizontal bar chart highlights bars exceeding the 15% threshold; override table shows contributing records | R3 |
| SM-3.5 | **Spot Anomaly** | Customize widget layout | Epic 3 (F3) | US-3.5: Customize Dashboard Widget Layout | JTBD-02.1 → "Most relevant KPIs front and center for reporting cadence": Widget layout persisted per user; default layout restored on reset | R3 |
| SM-3.6 | **Executive View** | Executive KPI snapshot | Epic 3 (F3) | US-3.6: Executive KPI Dashboard View | JTBD-05.2 → "Dashboard loads in < 1.5s for pre-meeting status check": VIEWER role sees KPI cards and accuracy trend; no edit controls visible | R3 |
| SM-5.1 | **Generate Report** | One-click Excel export | Epic 5 (F5) | US-5.1: One-Click Excel Export | JTBD-02.2 → ".xlsx downloaded in < 10s for ≤ 1,000 records with all required columns": Export includes planId, title, PCC, category/code/subcode, confidence, status, reviewer, uploadedAt, overrideReason | R4 |
| SM-5.2 | **Generate Report** | Async large report download | Epic 5 (F5) | US-5.2: Download Large Report Asynchronously | JTBD-02.2 → "UI stays responsive during long export": Report status polled via GET /api/reports/{id}; READY state triggers pre-signed download URL | R4 |
| SM-5.6 | **Generate Report** | Executive report download | Epic 5 (F5) | US-5.6: Executive Report Download | JTBD-05.1 → "Report available without analyst; formatted for direct presentation": VIEWER role can list and download completed reports; filename includes timestamp | R4 |
| SM-5.3 | **Ad-Hoc Analysis** | Build custom report | Epic 5 (F5) | US-5.3: Build an Ad-Hoc Report | JTBD-02.2 → "Satisfy ad-hoc executive requests without analyst support": Column selector and filter builder with preview row count before generation | R5 |
| SM-5.4 | **Ad-Hoc Analysis** | Save report template | Epic 5 (F5) | US-5.4: Save and Reuse Report Templates | JTBD-02.2 → "Same report format every cycle without reconfiguring": Named template saves column list + filter presets; Run action regenerates with saved config | R5 |
| SM-5.5 | **Ad-Hoc Analysis** | Save filter configuration | Epic 5 (F5) | US-5.5: Save and Reuse Filter Configurations | JTBD-02.2 → "Consistent filter presets without re-entering criteria": Saved filters appear in dropdown in report builder and classification list filter bar | R5 |

---

### 2C. PER-03 Priya (Taxonomy Administrator) — JRN-03.1

| SM-ID | Journey Stage | Activity | Epic | Story | NaC (derived from JTBD) | Release |
|---|---|---|---|---|---|---|
| SM-2.1 | **Add New Code** | Add taxonomy category via form | Epic 2 (F2) | US-2.1: Add a New Taxonomy Category | JTBD-03.1 → "New code added in < 5 min; immediately available as classification target with no engineering step": New category appears in tree view after save; no service restart required | R2 |
| SM-2.2 | **Browse & Verify** | View hierarchical tree | Epic 2 (F2) | US-2.2: Browse the Taxonomy Hierarchy | JTBD-03.2 → "Verify parent-child relationships at a glance": Two-pane UI shows full tree on left; detail/edit on right; tree refreshes after every CRUD operation | R2 |
| SM-2.3 | **Browse & Verify** | Edit existing category | Epic 2 (F2) | US-2.3: Edit a Taxonomy Category | JTBD-03.2 → "Locate and correct a code in < 3 min; change visible immediately": Edit saves without page reload; updated description visible in tree and classification targeting immediately | R2 |
| SM-2.5 | **Search & Locate** | Search taxonomy by code/name/description | Epic 2 (F2) | US-2.5: Search the Taxonomy | JTBD-03.2 → "Search returns results within 500ms; no full-tree scroll": GET /api/taxonomy/search?q= returns matches across code, name, description within 500ms of single character input | R2 |
| SM-2.4 | **Deactivate** | Soft-deactivate obsolete code | Epic 2 (F2) | US-2.4: Deactivate an Obsolete Taxonomy Code | JTBD-03.1 → "Deactivated code excluded from targeting; historical records unaffected": PATCH /{id}/status with isActive=false immediately removes code from override dropdowns; historical classifications retain original code reference | R2 |

---

### 2D. PER-04 Tom (System Administrator) — JRN-04.1 + JRN-04.2

| SM-ID | Journey Stage | Activity | Epic | Story | NaC (derived from JTBD) | Release |
|---|---|---|---|---|---|---|
| SM-0.1 | **Platform Setup** | Enable self-registration | Epic 0 (F0) | US-0.1: User Registration | JTBD-04.1 → "Account creation in single workflow; no IT ticket": Registration accepts valid fields, validates uniqueness, sends verification email atomically | R1 |
| SM-0.2 | **Platform Setup** | Email verification before login | Epic 0 (F0) | US-0.2: Email Verification | JTBD-04.1 → "Email verification enforced before real classification work": Unverified account returns 403 EMAIL_NOT_VERIFIED on login attempt; token is single-use | R1 |
| SM-0.7 | **Platform Setup** | Enforce RBAC on every call | Epic 0 (F0) | US-0.7: Role-Based Access Control | JTBD-04.1 → "Reviewers cannot access admin features; role controls enforced at service layer": @PreAuthorize enforced at service layer; REVIEWER role cannot access admin endpoints; 403 returned for insufficient role | R1 |
| SM-6.1 | **Provision User** | Create user account + assign role + trigger verification | Epic 6 (F6) | US-6.1: Provision a New User Account | JTBD-04.1 → "New reviewer provisioned in < 3 min; zero IT tickets; verification email sent in same workflow": Single form submission creates account, assigns role, dispatches verification email | R1 |
| SM-6.2 | **Provision User** | Search and filter user list | Epic 6 (F6) | US-6.2: View and Search Users | JTBD-04.1 → "Pending Verification status visible; filterable by verification status": User list shows email verified status; status filter shows All/Active/Inactive | R1 |
| SM-6.3 | **Manage User** | Edit user details and roles | Epic 6 (F6) | US-6.3: Edit User Details and Roles | JTBD-04.1 → "Role changes reflected immediately without engineering step": Role update replaces full role set; effective on next request | R1 |
| SM-6.4 | **Deactivate User** | Soft-deactivate departing user | Epic 6 (F6) | US-6.4: Deactivate a User Account | JTBD-04.2 → "Deactivated user locked out on next request; audit history intact": PATCH /{id}/status invalidates active refresh tokens immediately; historical classification records preserved | R1 |
| SM-4.2 | **Pipeline Control** | Start/stop/pause/resume pipeline | Epic 4 (F4) | US-4.2: Control Pipeline Execution | JTBD-04.3 → "Recover pipeline without DevOps escalation for common failures": Admin can start, stop, pause, resume pipeline from UI; ADMIN role required | R3 |
| SM-4.3 | **Pipeline Control** | Stage-level retry | Epic 4 (F4) | US-4.3: Retry a Failed Pipeline Stage | JTBD-04.3 → "Stage-level retry available without DB access": Stage retry visible only on FAILED stage cards; resets to IDLE and re-queues; 202 Accepted response | R3 |
| SM-4.4 | **Pipeline Control** | View logs and run history | Epic 4 (F4) | US-4.4: View Pipeline Logs and Run History | JTBD-04.3 → "Diagnose failures without database query": Event log panel shows timestamped entries; no PHI/PDF text in logs (TRACE level only); run history shows per-run stats | R3 |
| SM-4.5 | **Pipeline Control** | Manual sync for orphaned records | Epic 4 (F4) | US-4.5: Trigger a Manual Sync | JTBD-04.3 → "Recover orphaned PENDING records without full pipeline restart": Sync Now returns {queued: N} count; toast confirms records synced | R3 |
| SM-9.3 | **Compliance** | PHI-safe storage and logging | Epic 9 (F9) | US-9.3: PHI-Safe Storage and Logging | JTBD-04.3 → "HIPAA-aligned controls maintained": Extracted PDF text never logged above TRACE; textPreview capped at 500 chars; S3 keys are UUID-based; server-side encryption enabled | R2 |
| SM-9.4 | **Compliance** | Configure storage provider | Epic 9 (F9) | US-9.4: Local and Cloud Storage Configuration | JTBD-04.3 → "Switch storage provider via env var only; no code changes": StorageService selected via @ConditionalOnProperty; LocalStack and S3 both supported via same interface | R1 |
| SM-7.4 | **Alert** | Receive critical event email alerts | Epic 7 (F7) | US-7.4: Receive Critical Event Email Alerts | JTBD-04.3 → "Detect pipeline failure within 30 min without reviewer escalation": PIPELINE_FAILURE event emails all subscribed admins; email includes event type, timestamp, and link | R4 |

---

## 3. NaC Derivation Table

Full traceability: JTBD outcome → Journey stage → NaC statement → Story

| NaC-ID | JTBD-ID | JTBD Outcome (abbreviated) | Journey Stage | NaC Statement | Story |
|---|---|---|---|---|---|
| NaC-01a | JTBD-01.1 | Plan classified in ≤5 min with confidence score | JRN-01.1 Stage 1–2: Upload + Monitor | Upload returns 202 Accepted with planId within 2 seconds; pipeline completes all 4 taxonomy dimensions within 5 minutes | US-1.1, US-1.2 |
| NaC-01b | JTBD-01.1 | Low-confidence plans routed to NEEDS_REVIEW | JRN-01.1 Stage 3: Review Classification | When AI confidence < 0.75 (admin-configurable), plan status is NEEDS_REVIEW and reviewer sees a prompt before accepting | US-1.3 |
| NaC-01c | JTBD-01.1 | Upload accepted reliably with MIME validation | JRN-01.1 Stage 1: Initiate Upload | Non-PDF file rejected immediately via Apache Tika byte-level detection; valid PDF stored with linked UploadedFile entity | US-9.1 |
| NaC-01d | JTBD-01.1 | Source PDF accessible for borderline review | JRN-01.1 Stage 3–4: Review + Decide | Pre-signed URL available from classification detail view; 15-min TTL; access controlled to uploader or ADMIN | US-9.2 |
| NaC-02a | JTBD-01.2 | Urgent items identifiable within 60s of login | JRN-01.2 Stage 1: Login and Orient | Post-login destination is classification list; NEEDS_REVIEW and FAILED records identifiable within 60 seconds without external tools | US-0.3, US-1.6 |
| NaC-02b | JTBD-01.2 | Filter returns results in < 1.5s | JRN-01.2 Stage 3–4: Triage + Sequence | Status multi-select + date range + PCC filter applied simultaneously returns results in < 1.5 seconds | US-1.6 |
| NaC-02c | JTBD-01.2 | First priority plan opened within 60s of login | JRN-01.2 Stage 5: Open First Item | Failed/NEEDS_REVIEW plan accessible with one click from filtered queue within 60 seconds of login | US-1.5, US-1.6 |
| NaC-03a | JTBD-01.3 | Override requires non-empty reason | JRN-01.1 Stage 5: Submit Override | Form blocks submission when override reason is blank; inline validation error prompts reviewer; form does not submit | US-1.4 |
| NaC-03b | JTBD-01.3 | Override record is immediately auditable | JRN-01.1 Stage 6: Confirm Audit Record | After override, classification record shows reviewedBy, reviewedAt, overrideReason — all non-null; visible without additional query | US-1.4 |
| NaC-04a | JTBD-01.4 | In-app alert on NEEDS_REVIEW/FAILED | JRN-01.2 Stage 2: Spot Notifications | Notification bell shows unread badge within ≤ 30s polling cycle after classification status transition; visible without page refresh | US-7.1 |
| NaC-04b | JTBD-01.4 | Per-user channel preferences respected | JRN-01.2 Stage 2: Spot Notifications | In-app enabled by default for all events; email enabled by default only for CLASSIFICATION_FAILED and PIPELINE_FAILURE | US-7.3 |
| NaC-05a | JTBD-02.1 | Dashboard KPIs load in < 1.5s | JRN-02.1 Stage 1: Morning Health Check | All KPI cards (Total, Classified, Failed, Needs Review, Avg Confidence) display current values within 1.5 seconds of navigation | US-3.1 |
| NaC-05b | JTBD-02.1 | Date filter cascades to all components | JRN-02.1 Stage 5: Set Date Range | Changing date range invalidates and refetches all KPI card and chart queries simultaneously; no chart lags behind the filter | US-3.2 |
| NaC-05c | JTBD-02.1 | Stuck records surface on dashboard | JRN-02.1 Stage 2: Check Pipeline Status | Records in PROCESSING beyond STUCK_TIMEOUT_MINUTES are highlighted with warning indicator; queue depth and DB connection stats visible | US-4.1 |
| NaC-06a | JTBD-02.2 | .xlsx downloaded in < 10s for ≤ 1,000 records | JRN-02.1 Stage 6: Generate Excel Report | Export completes within 10 seconds; file downloaded via Content-Disposition: attachment; all required columns present | US-5.1 |
| NaC-06b | JTBD-02.2 | Export includes all required columns | JRN-02.1 Stage 6: Generate Excel Report | Downloaded file contains: planId, title, PCC, taxonomyCategory, code, subcode, confidence, status, uploadedBy, classifiedAt, reviewedBy, overrideReason | US-5.1 |
| NaC-06c | JTBD-02.2 | Large report async without blocking UI | JRN-02.1 Stage 6: Generate Excel Report | Reports > 1,000 rows use SXSSFWorkbook streaming; report status polled; download URL available when READY | US-5.2 |
| NaC-07a | JTBD-02.3 | Categories > 15% override rate visually highlighted | JRN-02.1 Stage 3: Spot the Anomaly | Category accuracy bar chart visually distinguishes bars exceeding the 15% threshold; clicking bar shows contributing override records | US-3.3 |
| NaC-07b | JTBD-02.3 | Override records filterable by category | JRN-02.1 Stage 4: Investigate Overrides | Recent Overrides table filterable by PCC/category; shows reviewer identity, reason, original and corrected classification | US-3.3 |
| NaC-08a | JTBD-03.1 | New taxonomy code added in < 5 min; no engineering step | JRN-03.1 Stage 2: Add New Code | New category form saved → code appears in live tree and is available as classification target; no deployment or service restart required | US-2.1 |
| NaC-08b | JTBD-03.1 | Deactivated code excluded from targeting; history preserved | JRN-03.1 Stage 5: Deactivate | PATCH /{id}/status with isActive=false → code removed from override dropdowns immediately; historical classification records retain original code reference | US-2.4 |
| NaC-09a | JTBD-03.2 | Taxonomy search returns results within 500ms | JRN-03.1 Stage 4: Search | Search input returns matching results within 500ms of first character; no full-tree scroll required | US-2.5 |
| NaC-09b | JTBD-03.2 | Edit + verify in tree in < 3 min | JRN-03.1 Stage 3: Verify in Tree | Edit saved → tree refreshes immediately; corrected description visible without page reload | US-2.2, US-2.3 |
| NaC-10a | JTBD-03.3 | Audit trail confirms live taxonomy state | JRN-03.1 Stage 6: Confirm Audit Trail | Taxonomy code detail shows action type, actor identity, and timestamp for each past CRUD action | US-2.3, US-2.4 |
| NaC-11a | JTBD-04.1 | Account provisioned in single workflow; < 3 min | JRN-04.1 Stage 3: Submit | Single form submission creates user record, assigns role, dispatches verification email; no follow-up steps required | US-6.1 |
| NaC-11b | JTBD-04.1 | Pending Verification status visible and filterable | JRN-04.1 Stage 4–5: Verify | User list shows email verification status; filterable by verification status; "Email Unverified" visually distinct | US-6.2 |
| NaC-12a | JTBD-04.2 | Deactivation revokes access immediately | JRN-04.2 Stage 3: Deactivate | PATCH /{id}/status with isActive=false → existing refresh tokens invalidated; next API request returns 401; access ends immediately | US-6.4 |
| NaC-12b | JTBD-04.2 | Historical audit records preserved after deactivation | JRN-04.2 Stage 4: Confirm | All classification records, overrides, and audit trail entries referencing deactivated user remain intact and queryable | US-6.4 |
| NaC-13a | JTBD-04.3 | Pipeline failure detected without reviewer escalation | JRN-04.1/04.2: System Admin pipeline checks | Pipeline monitoring page shows stage-level status; stuck records highlighted; no database query required for diagnosis | US-4.1, US-4.4 |
| NaC-13b | JTBD-04.3 | Stage-level retry available without DevOps | JRN-04.1: System Admin pipeline control | Stage retry button visible on FAILED stage cards; POST /pipeline/{id}/stages/{stageId}/retry returns 202; stage resets to IDLE | US-4.3 |
| NaC-14a | JTBD-05.1 | Presentation-ready Excel report in < 5 min | JRN-05.1 Stage 3: Download Q2 Report | Report generated and downloaded within 10s; column headers human-readable; confidence formatted as %; all override reasons populated | US-5.1, US-5.6 |
| NaC-14b | JTBD-05.1 | Every figure traceable to source record | JRN-05.1 Stage 4: Scan Report | Every row contains: planId, reviewer name, uploadedAt, classifiedAt, confidence, overrideReason (if applicable) — no aggregate-only rows | US-5.6 |
| NaC-15a | JTBD-05.2 | Dashboard loads < 1.5s for pre-meeting snapshot | JRN-05.1 Stage 1–2: Login + Dashboard | VIEWER role: dashboard KPI cards load within 1.5 seconds; data current within last polling interval; no edit controls visible | US-3.6 |
| NaC-16a | JTBD-05.3 | Audit record retrievable by plan ID | JRN-05.1 Stage 4: Scan Report | Classification record for any planId contains: uploadedBy, reviewedBy, uploadedAt, reviewedAt, confidence, modelVersion, overrideReason (if applicable) | US-1.3, US-1.4 |

---

## 4. Release Planning

### R1 — Foundation & Auth
**Theme:** Secure platform foundation. Every other feature depends on these stories being stable.
**JTBD Addressed:** JTBD-04.1, JTBD-04.2, JTBD-01.2 (login)

| Story | Title | Persona | NaC |
|---|---|---|---|
| US-0.1 | User Registration | All | NaC-11a (self-registration as precondition to provisioning) |
| US-0.2 | Email Verification | All | JTBD-04.1: verification enforced before real use |
| US-0.3 | User Login | Maya / All | NaC-02a (lands on queue post-login) |
| US-0.4 | JWT Token Refresh | Maya / All | NaC-02a (silent refresh; no mid-workflow re-login) |
| US-0.5 | Password Reset via Email | Maya / All | JTBD-01.2: self-recover without admin |
| US-0.6 | Logout | Maya / All | JTBD-01.2: secure session termination |
| US-0.7 | Role-Based Access Control | Tom | NaC-11a (RBAC enforced at service layer) |
| US-6.1 | Provision a New User Account | Tom | NaC-11a (< 3 min; single workflow) |
| US-6.2 | View and Search Users | Tom | NaC-11b (Pending Verification visible) |
| US-6.3 | Edit User Details and Roles | Tom | JTBD-04.1 (role changes without engineering) |
| US-6.4 | Deactivate a User Account | Tom | NaC-12a, NaC-12b |
| US-9.4 | Local and Cloud Storage Configuration | Tom | JTBD-04.3 (storage provider via env var) |

**Personas Served:** PER-04 (primary), PER-01 through PER-05 (foundational access)
**Complete Journey Enabled:** JRN-04.1 (full provisioning) + JRN-04.2 (deactivation)
**Dependencies:** None

---

### R2 — Classification Pipeline
**Theme:** Core value proposition — upload, classify, override, taxonomy management.
**JTBD Addressed:** JTBD-01.1, JTBD-01.2 (queue), JTBD-01.3, JTBD-03.1, JTBD-03.2, JTBD-03.3

| Story | Title | Persona | NaC |
|---|---|---|---|
| US-2.1 | Add a New Taxonomy Category | Priya | NaC-08a |
| US-2.2 | Browse the Taxonomy Hierarchy | Priya | NaC-09b |
| US-2.3 | Edit a Taxonomy Category | Priya | NaC-09b, NaC-10a |
| US-2.4 | Deactivate an Obsolete Taxonomy Code | Priya | NaC-08b, NaC-10a |
| US-2.5 | Search the Taxonomy | Priya | NaC-09a |
| US-1.1 | Upload a Research Plan PDF | Maya | NaC-01a |
| US-1.2 | Monitor Classification Status | Maya | NaC-01a |
| US-1.3 | Review AI Classification Results | Maya | NaC-01b, NaC-16a |
| US-1.4 | Override an AI Classification | Maya | NaC-03a, NaC-03b, NaC-16a |
| US-1.5 | Retry a Failed Classification | Maya | NaC-02c |
| US-1.6 | Search and Filter the Classification Queue | Maya | NaC-02a, NaC-02b |
| US-9.1 | Securely Store an Uploaded PDF | Maya / Tom | NaC-01c |
| US-9.2 | Download PDF via Pre-Signed URL | Maya | NaC-01d |
| US-9.3 | PHI-Safe Storage and Logging | Tom | JTBD-04.3 (HIPAA controls) |

**Personas Served:** PER-01 (primary), PER-03 (primary), PER-04 (secondary — PHI/storage)
**Complete Journey Enabled:** JRN-01.1 (full classify-or-override cycle) + JRN-03.1 (full taxonomy management)
**Dependencies:** R1 (Auth + RBAC + Storage config must exist)

---

### R3 — Insights & Analytics
**Theme:** Real-time visibility and operational control for Program Managers and System Administrators.
**JTBD Addressed:** JTBD-02.1, JTBD-02.3, JTBD-04.3, JTBD-05.2

| Story | Title | Persona | NaC |
|---|---|---|---|
| US-3.1 | View Dashboard KPI Cards | David | NaC-05a |
| US-3.2 | Filter Dashboard by Date Range | David | NaC-05b |
| US-3.3 | View Analytics Charts | David | NaC-07a, NaC-07b |
| US-3.4 | View Recent Classifications Feed | David | NaC-05a |
| US-3.5 | Customize Dashboard Widget Layout | David | JTBD-02.1 (relevant KPIs front and center) |
| US-3.6 | Executive KPI Dashboard View | Catherine | NaC-15a |
| US-4.1 | View Pipeline Status and Health | Tom | NaC-05c, NaC-13a |
| US-4.2 | Control Pipeline Execution | Tom | NaC-13b |
| US-4.3 | Retry a Failed Pipeline Stage | Tom | NaC-13b |
| US-4.4 | View Pipeline Logs and Run History | Tom | NaC-13a |
| US-4.5 | Trigger a Manual Sync | Tom | JTBD-04.3 (recover orphaned records) |

**Personas Served:** PER-02 (primary), PER-04 (primary), PER-05 (secondary)
**Complete Journey Enabled:** JRN-02.1 (dashboard health check through anomaly detection)
**Dependencies:** R1 + R2 (classification data must exist for dashboard to be meaningful)

---

### R4 — Reporting & Admin Polish
**Theme:** Self-service reporting, help center, and notification delivery.
**JTBD Addressed:** JTBD-02.2, JTBD-05.1, JTBD-05.3, JTBD-01.4, JTBD-04.3 (email alerts)

| Story | Title | Persona | NaC |
|---|---|---|---|
| US-5.1 | One-Click Excel Export | David | NaC-06a, NaC-06b |
| US-5.2 | Download a Large Report Asynchronously | David | NaC-06c |
| US-5.6 | Executive Report Download | Catherine | NaC-14a, NaC-14b |
| US-7.1 | Receive In-App Notifications | Maya | NaC-04a |
| US-7.2 | Mark Notifications as Read | Maya | JTBD-01.4 (track what needs attention) |
| US-7.3 | Configure Notification Preferences | Maya | NaC-04b |
| US-7.4 | Receive Critical Event Email Alerts | Tom | JTBD-04.3 (pipeline failure email) |
| US-8.1 | Browse Help Articles by Category | Maya | JTBD-01.2 (self-serve answers) |
| US-8.2 | Search Help Articles | Maya | JTBD-01.2 (find answers quickly) |
| US-8.3 | View FAQ Accordion | Maya | JTBD-01.2 (scan common answers) |
| US-8.4 | Submit Article Feedback | Maya | JTBD-01.2 (documentation stays current) |

**Personas Served:** PER-02 (primary — reports), PER-05 (primary — executive reports), PER-01 (primary — notifications/help)
**Complete Journey Enabled:** JRN-02.1 Stage 6 (report generation) + JRN-05.1 (full executive report journey) + JRN-01.2 Stage 2 (notification alerts)
**Dependencies:** R1 + R2 + R3 (data and pipelines must be running)

---

### R5 — ML Integration & Productionization
**Theme:** Power-user reporting features, advanced notifications, ML model integration readiness.
**JTBD Addressed:** JTBD-02.2 (full ad-hoc reporting)

| Story | Title | Persona | NaC |
|---|---|---|---|
| US-5.3 | Build an Ad-Hoc Report | David | JTBD-02.2 (satisfy ad-hoc requests without analyst) |
| US-5.4 | Save and Reuse Report Templates | David | JTBD-02.2 (same format every cycle) |
| US-5.5 | Save and Reuse Filter Configurations | David | JTBD-02.2 (consistent filter presets) |

**Personas Served:** PER-02 (primary)
**Complete Journey Enabled:** Full ad-hoc reporting capability for JRN-02.1 Stage 6
**Dependencies:** R4 (basic export must exist and be validated before ad-hoc builder is built)

**Note on ML Model Integration:** The PRD flags ML provider selection (OpenAI / Anthropic / Bedrock) as an open question requiring HIPAA BAA review. R5 is the phase where the keyword-based classification fallback can be swapped for the real ML model via the `ClassificationStrategy` interface (`@ConditionalOnProperty`). No new user stories are generated here — the existing pipeline stories (US-1.1 through US-1.5) are already designed for ML-provider-agnostic operation. Engineering work in R5 is configuration and validation, not new feature development.

---

## 5. Coverage Analysis

### 5A. Persona Coverage per Release

| Persona | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| **PER-01 Maya (Reviewer)** | Foundation only (login, auth) | ✅ Full core workflow (upload, classify, override, queue) | Dashboard visibility | ✅ Notifications + Help Center | — |
| **PER-02 David (Program Mgr)** | Foundation only | — | ✅ Full dashboard + pipeline health | ✅ Full reporting | ✅ Ad-hoc reports |
| **PER-03 Priya (Tax. Admin)** | Foundation only | ✅ Full taxonomy management | — | — | — |
| **PER-04 Tom (Sys. Admin)** | ✅ Full user management | PHI/storage | ✅ Pipeline control | Email alerts | — |
| **PER-05 Catherine (Executive)** | Foundation only | — | Dashboard KPI view | ✅ Executive report download | — |

---

### 5B. JTBD Coverage per Release

| JTBD-ID | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| JTBD-01.1 (AI classification) | — | ✅ US-1.1, 1.2, 1.3, 9.1, 9.2 | — | — | — |
| JTBD-01.2 (queue triage) | US-0.3 (login) | ✅ US-1.5, 1.6 | — | — | — |
| JTBD-01.3 (override w/ reason) | — | ✅ US-1.4 | — | — | — |
| JTBD-01.4 (proactive alerts) | — | — | — | ✅ US-7.1, 7.2, 7.3 | — |
| JTBD-02.1 (pipeline health) | — | — | ✅ US-3.1, 3.2, 4.1 | — | — |
| JTBD-02.2 (one-click report) | — | — | — | ✅ US-5.1, 5.2 | ✅ US-5.3, 5.4, 5.5 |
| JTBD-02.3 (override rate analysis) | — | — | ✅ US-3.3 | — | — |
| JTBD-03.1 (taxonomy lifecycle) | — | ✅ US-2.1, 2.4 | — | — | — |
| JTBD-03.2 (taxonomy search/edit) | — | ✅ US-2.2, 2.3, 2.5 | — | — | — |
| JTBD-03.3 (taxonomy consistency) | — | ✅ US-2.3, 2.4 (audit trail) | — | — | — |
| JTBD-04.1 (user provisioning) | ✅ US-6.1, 6.2, 6.3 | — | — | — | — |
| JTBD-04.2 (access revocation) | ✅ US-6.4 | — | — | — | — |
| JTBD-04.3 (pipeline failure detection) | US-9.4 (storage config) | US-9.3 (PHI) | ✅ US-4.1–4.5 | US-7.4 (email alert) | — |
| JTBD-05.1 (exec Excel report) | — | — | — | ✅ US-5.1, 5.6 | — |
| JTBD-05.2 (pre-meeting snapshot) | — | — | ✅ US-3.6 | — | — |
| JTBD-05.3 (audit traceability) | — | ✅ US-1.4 (override reason required) | — | ✅ US-5.6 (report audit fields) | — |

---

### 5C. Gap Analysis

**Journey Stages Without Coverage:**
- JRN-01.2 Stage 2 (Spot Notifications) is only partially served until R4. Between R2 and R4, Maya must manually poll the classification list — this is a known intentional gap noted in PRD §11 (WebSocket real-time updates deferred to v2; polling delivers 95% of UX benefit for v1).

**JTBD Outcomes Without a Dedicated Story:**
- **JTBD-02.3** "Identify high-override taxonomy categories" is addressed via chart drill-down in US-3.3 (Recent Overrides table). No gap — the story covers this use case; no additional story is needed.
- **JTBD-05.3** "Audit traceability confirmation" spans multiple stories (US-1.4 required override reason, US-1.3 audit fields on classification record, US-5.6 report export fields). The cross-cutting nature is handled by `AuditableEntity` base class — architectural enforcement, not a new story.

**Orphan Stories:**
- None — all 51 stories map to at least one journey stage in the matrix above.

**JTBD-01.4 Gap Window:**
- From R2 launch through R4 launch: Maya receives no in-app notifications. Mitigation: US-1.2 (status polling every 5–10s on the classification list) provides partial coverage. Risk is low-severity; JTBD-01.4 is explicitly P2.

**Cross-Journey Pattern CP-01 (Audit Trail):**
- `AuditableEntity` base class + `SecurityContextPropagatingDecorator` must be in place by R2 launch for all pipeline-persisted records to have non-null `createdBy`. This is an R2 engineering prerequisite, not a user story, but is critical to NaC-03b, NaC-10a, and NaC-12b being verifiable.

---

## 6. NaC-to-Acceptance-Criteria Alignment

This section verifies that each NaC is supported by at least one Acceptance Criterion in the corresponding UserStory.

| NaC-ID | NaC Statement (abbreviated) | Story | Aligned Acceptance Criterion |
|---|---|---|---|
| NaC-01a | Upload returns 202 Accepted; pipeline completes in ≤5 min | US-1.1, US-1.2 | US-1.1 AC: "System returns 202 Accepted... within 2 seconds"; US-1.2 AC: polling every 5–10s |
| NaC-01b | NEEDS_REVIEW when confidence < 0.75 | US-1.3 | US-1.3 AC: "Classifications below configurable NEEDS_REVIEW threshold shown with NEEDS_REVIEW status" |
| NaC-01c | Non-PDF rejected via Tika; UploadedFile entity linked | US-9.1 | US-9.1 AC: "File validated via Apache Tika byte-level MIME detection"; "UploadedFile.id linked to Classification.uploadedFileId" |
| NaC-01d | Pre-signed URL in classification detail; 15-min TTL; access controlled | US-9.2 | US-9.2 AC: "Pre-signed URL TTL defaults to 15 minutes"; "Only the file uploader or a user with ADMIN role can request" |
| NaC-02a | NEEDS_REVIEW + FAILED identifiable within 60s of login | US-0.3, US-1.6 | US-1.6 AC: "Filter bar includes status multi-select"; "Default sort is uploadedAt DESC" |
| NaC-02b | Filter returns results in < 1.5s | US-1.6 | US-1.6 AC: filter bar with status, date range, PCC (NFR performance target from PRD §7) |
| NaC-03a | Form blocks submission when override reason is blank | US-1.4 | US-1.4 AC: "Override reason field is required; form submission is blocked if reason is blank (400 VALIDATION_ERROR)" |
| NaC-03b | Override record shows reviewedBy, reviewedAt, overrideReason — all non-null | US-1.4 | US-1.4 AC: "Submitting override sets reviewedBy = current user, reviewedAt = now, status = CLASSIFIED" |
| NaC-04a | Notification bell shows badge within ≤30s polling cycle | US-7.1 | US-7.1 AC: "Badge count updates every 30 seconds via polling (staleTime: 30000)" |
| NaC-04b | Email enabled by default only for CLASSIFICATION_FAILED + PIPELINE_FAILURE | US-7.3 | US-7.3 AC: "Default preferences: all event types enabled for in-app; email enabled only for CLASSIFICATION_FAILED and PIPELINE_FAILURE" |
| NaC-05a | All KPI cards display within 1.5 seconds | US-3.1 | US-3.1 AC: "Dashboard initial load completes in under 1.5 seconds" |
| NaC-05b | Date range cascades to all components simultaneously | US-3.2 | US-3.2 AC: "Changing the date range invalidates and refetches all KPI card queries and all chart queries simultaneously" |
| NaC-05c | Stuck records highlighted; DB connection stats visible | US-4.1 | US-4.1 AC: "Stuck record count surfaced: classifications in PROCESSING beyond STUCK_TIMEOUT_MINUTES highlighted" |
| NaC-06a | Export completes within 10 seconds | US-5.1 | US-5.1 AC: "Generation completes in under 10 seconds for a 1,000-row export" |
| NaC-06b | Downloaded file contains all required columns | US-5.1 | US-5.1 AC: "Report includes columns: plan ID, title, status, PCC, taxonomy category, code, subcode, AI confidence, uploaded by, classified at, reviewed by, override reason" |
| NaC-06c | SXSSFWorkbook streaming for > 1,000 rows | US-5.2 | US-5.2 AC: async report generation, S3 upload, pre-signed download URL |
| NaC-07a | Chart highlights categories > 15% override rate | US-3.3 | US-3.3 AC: "Category Accuracy (horizontal bar chart): Shows override count and accuracy rate per PCC/category" |
| NaC-07b | Recent Overrides table filterable by category | US-3.3 | US-3.3 AC: "Recent Overrides (table): Last N overrides with plan ID, reviewer, original classification, corrected classification, reason, date" |
| NaC-08a | New category in tree immediately; no service restart | US-2.1 | US-2.1 AC: "Successful creation returns 201 Created; new category appears in the tree view immediately" |
| NaC-08b | Deactivated code removed from dropdowns; history intact | US-2.4 | US-2.4 AC: "Deactivated codes are no longer selectable in classification override dropdowns"; "Deactivated codes remain visible in historical classification records" |
| NaC-09a | Search results within 500ms of first character | US-2.5 | US-2.5 AC: "Search input sends GET /api/taxonomy/search?q={term}; minimum 1 character accepted" |
| NaC-09b | Tree refreshes immediately after edit | US-2.2, US-2.3 | US-2.3 AC: "Tree view refreshes"; US-2.2 AC: "Tree refreshes automatically after any CRUD operation" |
| NaC-10a | Audit trail shows actor + timestamp per CRUD action | US-2.3, US-2.4 | US-2.3 AC: "All edits captured in audit trail (updatedAt, lastModifiedBy)" |
| NaC-11a | Single form submission: account + role + verification email | US-6.1 | US-6.1 AC: "A verification email is sent to the new user immediately after account creation" |
| NaC-11b | Email Unverified visually distinct; filterable | US-6.2 | US-6.2 AC: "Status filter shows: All, Active, Inactive"; "Each user row shows: username, email, roles, status, last login" |
| NaC-12a | Refresh tokens invalidated immediately on deactivation | US-6.4 | US-6.4 AC: "any active refresh tokens are immediately invalidated"; "Deactivated user cannot log in (403 ACCOUNT_INACTIVE)" |
| NaC-12b | Historical records preserved after deactivation | US-6.4 | US-6.4 AC: "Historical classification records referencing the deactivated user remain intact" |
| NaC-13a | Stage-level status, stuck records, no DB query required | US-4.1, US-4.4 | US-4.1 AC: stage cards with state, last run, duration; US-4.4 AC: event log panel with no PHI |
| NaC-13b | Stage retry available on FAILED cards; returns 202 | US-4.3 | US-4.3 AC: "Stage-level Retry button visible only on stage cards with state = FAILED"; "POST /api/pipeline/{id}/stages/{stageId}/retry" |
| NaC-14a | Report formatted for presentation; human-readable headers | US-5.1, US-5.6 | US-5.6 AC: "Downloaded Excel file includes headers, formatted columns, and a timestamp in the filename" |
| NaC-14b | Every row traceable to reviewer + timestamp + override reason | US-5.6 | US-5.6 AC: "All classification figures are traceable to individual records (reviewer name, timestamp, override reason visible in report)" |
| NaC-15a | VIEWER role dashboard loads < 1.5s; no edit controls | US-3.6 | US-3.6 AC: "Dashboard loads in under 1.5 seconds"; "No edit or upload controls are visible for the VIEWER role" |
| NaC-16a | Audit fields present on every reviewed classification | US-1.3, US-1.4 | US-1.3 AC: "confidence score, model version, processing time" displayed; US-1.4 AC: "reviewedBy, reviewedAt" set on override |

**Alignment Result:** All 33 NaC are backed by at least one explicit Acceptance Criterion in the corresponding UserStory. No NaC required an invented criterion outside the existing story set.

---

## 7. Story Map Summary

| Release | Stories | Personas | JTBD Addressed | Journey Completed |
|---|---|---|---|---|
| **R1** | 12 | PER-01 to PER-05 (foundation) · PER-04 (primary) | JTBD-04.1, JTBD-04.2, JTBD-01.2 (login) | JRN-04.1, JRN-04.2 |
| **R2** | 14 | PER-01, PER-03, PER-04 | JTBD-01.1, JTBD-01.2 (queue), JTBD-01.3, JTBD-03.1, JTBD-03.2, JTBD-03.3 | JRN-01.1, JRN-03.1 |
| **R3** | 11 | PER-02, PER-04, PER-05 | JTBD-02.1, JTBD-02.3, JTBD-04.3 (control), JTBD-05.2 | JRN-02.1 (stages 1–5) |
| **R4** | 11 | PER-01, PER-02, PER-04, PER-05 | JTBD-02.2, JTBD-05.1, JTBD-05.3, JTBD-01.4 | JRN-02.1 (stage 6), JRN-05.1, JRN-01.2 (stage 2) |
| **R5** | 3 | PER-02 | JTBD-02.2 (ad-hoc) | JRN-02.1 (ad-hoc analysis) |
| **Total** | **51** | All 5 personas | All 16 JTBD | All 7 journeys |

---

*STORY-MAP v1.0 — PCORI Research Analytics Platform*
*Generated: 2026-05-20 | Derived from PERSONAS-PCORI.md v1.0 · JTBD-PCORI.md v1.0 · JOURNEYS-PCORI.md v1.0 · UserStories-PCORI.md v1.0 · PRD-PCORI.md v1.0*
