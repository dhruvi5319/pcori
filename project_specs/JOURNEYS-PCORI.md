# User Journey Maps
## PCORI Research Analytics Platform

| Field | Value |
|---|---|
| **Product Name** | PCORI Research Analytics Platform |
| **Project Acronym** | PCORI |
| **Document Version** | 1.0 |
| **Document Type** | User Journey Maps |
| **Date** | 2026-05-20 |
| **Related Personas** | `project_specs/PERSONAS-PCORI.md` v1.0 |
| **Related JTBD** | `project_specs/JTBD-PCORI.md` v1.0 |
| **Related PRD** | `project_specs/PRD-PCORI.md` v1.0 |

---

## Journey Index

| JRN-ID | Persona | Scenario | Key JTBD | Stages |
|---|---|---|---|---|
| JRN-01.1 | PER-01 Maya / Research Reviewer | Upload PDF → view AI classification → accept or override with reason | JTBD-01.1, JTBD-01.3 | 6 |
| JRN-01.2 | PER-01 Maya / Research Reviewer | Morning queue triage — filter, prioritize, and action daily plan list | JTBD-01.2, JTBD-01.4 | 5 |
| JRN-02.1 | PER-02 David / Program Manager | View dashboard KPIs → drill into accuracy trends → download Excel report | JTBD-02.1, JTBD-02.2, JTBD-02.3 | 6 |
| JRN-03.1 | PER-03 Priya / Taxonomy Admin | Add new taxonomy category → search and verify → deactivate an obsolete code | JTBD-03.1, JTBD-03.2, JTBD-03.3 | 6 |
| JRN-04.1 | PER-04 Tom / System Admin | Provision new user → assign role → send email verification | JTBD-04.1 | 5 |
| JRN-04.2 | PER-04 Tom / System Admin | Deactivate a departing user's account | JTBD-04.2 | 4 |
| JRN-05.1 | PER-05 Catherine / Executive | Request Excel report → review KPIs → share with stakeholders | JTBD-05.1, JTBD-05.2, JTBD-05.3 | 5 |

---

## PER-01: Maya Okonkwo — Research Reviewer

---

### JRN-01.1: Upload PDF → View AI Classification → Accept or Override

**Persona:** PER-01 (Maya Okonkwo, Senior Research Reviewer)

**Scenario:** Maya receives a new research plan PDF via email. It covers a telehealth intervention for Type 2 Diabetes patients — a category the AI sometimes misclassifies. She uploads it, reviews the AI-generated classification with its confidence score, decides the primary clinical condition is correct but the category code is wrong, and submits an override with documented reasoning. The whole workflow takes under 10 minutes instead of the previous 60.

**Related JTBD:** JTBD-01.1 (AI-Assisted Classification Initiation), JTBD-01.3 (Override with Documented Reasoning)

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **1. Initiate Upload** | Opens the classification queue page, clicks "Upload Plan" button, drags PDF into the upload dropzone | Upload dialog (F1, F9) | "Let me get this in the pipeline — I'll review it once it's processed." | Neutral, purposeful | Worried about file size or format rejection; no feedback until fully validated | Instant MIME validation feedback + progress bar so she knows upload is accepted before waiting |
| **2. Monitor Processing** | Watches the classification card appear with `PROCESSING` status; optionally navigates away | Classification list (F1, F7) | "How long does this usually take? Should I wait here or come back?" | Slightly impatient | No clear time estimate; has to remember to come back and check | In-app notification (F7) fires when classification completes — she doesn't need to watch the screen |
| **3. Review Classification** | Opens the completed classification record; reads AI-assigned PCC, category, code, subcode, and confidence score | Classification detail (F1) | "Confidence is 0.82 — that's above threshold but not high. Let me check the category code." | Focused, skeptical | Confidence score alone doesn't explain *why* the AI chose this code — needs context | Display the extracted rationale snippet alongside the confidence score to support quick validation |
| **4. Decide: Accept or Override** | Reads the AI's assigned category code; recognizes it maps to behavioral interventions, not digital telehealth tools | Classification detail (F1) | "The PCC is right — Type 2 Diabetes — but the category code is wrong. I need to override." | Determined, slightly frustrated | No inline explanation of which text drove the AI decision; harder to justify override without it | Highlight the source text passage that influenced the AI classification to anchor the reviewer's reasoning |
| **5. Submit Override** | Clicks "Override" button; edits the taxonomy category and code fields; types override reason; clicks "Submit Override" | Override form (F1, F0) | "I need to write a clear reason here — this is going in the audit trail. 'Telehealth delivery mechanism maps to DigitalTool, not BehavioralCoaching.'" | Deliberate, conscientious | Required reason field is the right design but feels like extra friction when she's confident in the decision | Auto-suggest common override reason phrases (not pre-fill — she must own the reason) to reduce typing time |
| **6. Confirm Audit Record** | Reviews the updated classification showing `CLASSIFIED` status with her `reviewedBy` name, timestamp, and override reason | Classification detail (F1) | "Good — the record shows my name, the timestamp, and my reason. This is audit-ready." | Relieved, satisfied | If she needs to find this record later for an audit, she has to remember the plan ID | Search and filter by reviewer name and date range; bookmarkable direct plan URL |

---

#### Key Moments

- **Decision Point:** Stage 4 — Maya decides whether to accept or override. If confidence is ambiguous and she lacks source text context, she may accept an incorrect classification rather than spend time investigating. This is the highest-stakes moment in the journey.
- **Risk of Abandonment:** Stage 2 — If there is no notification and no time estimate, Maya may forget to return to the record for hours, defeating the speed benefit.
- **Delight Opportunity:** Stage 6 — Seeing her name, timestamp, and reason in a clean audit record gives Maya visible proof that the system has her back. Small positive reinforcement (e.g., a "Classification complete and audit-ready" confirmation banner) builds trust.

#### Success Outcome

Maya completes the full classify-or-override cycle in under 10 minutes total. The resulting record includes her `reviewedBy` identity, `reviewedAt` timestamp, corrected taxonomy fields, and override reason — immediately accessible for audit inquiry. *(JTBD-01.1 success measure: ≤5 min pipeline + JTBD-01.3 success measure: ≤3 min override)*

#### Feature Touchpoints

| Stage | Features |
|---|---|
| 1. Initiate Upload | F1 (Upload & Classification), F9 (File Management), F0 (Auth) |
| 2. Monitor Processing | F1 (Classification List), F7 (Notifications) |
| 3. Review Classification | F1 (Classification Detail) |
| 4. Decide: Accept or Override | F1 (Classification Detail) |
| 5. Submit Override | F1 (Override Form), F0 (Auth — reviewer identity) |
| 6. Confirm Audit Record | F1 (Classification Detail) |

---

### JRN-01.2: Morning Queue Triage — Filter, Prioritize, and Action Daily Plan List

**Persona:** PER-01 (Maya Okonkwo, Senior Research Reviewer)

**Scenario:** Maya arrives at her desk on Monday morning with 18 plans in her queue — a mix of `CLASSIFIED`, `NEEDS_REVIEW`, `PENDING`, and one `FAILED`. She needs to identify which plans require immediate action, sequence her morning's work, and get to the first high-priority item within 60 seconds of login. She also expects to see an in-app notification for a plan that completed processing overnight.

**Related JTBD:** JTBD-01.2 (Daily Queue Triage), JTBD-01.4 (Proactive Classification Alerts)

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **1. Login and Orient** | Opens the platform, logs in with email and password, lands on the classification queue | Login page (F0), Classification list (F1) | "Let me see what came in overnight and what needs attention first." | Neutral, slightly alert | Has to remember to navigate to the queue — no dashboard landing page that summarizes her work | Default post-login destination is the classification list, pre-filtered to her active plans |
| **2. Spot Notifications** | Notices the notification bell shows an unread badge; clicks it; sees "Plan RP-2026-017 classified — ready for review" | Notification panel (F7) | "Good — that plan I uploaded Friday is done. I'll get to that." | Relieved, slightly pleased | If she missed the notification or wasn't logged in, she would have to scroll the list to find it | Notification links directly to the classification detail; one click to the right plan |
| **3. Triage the Queue** | Applies status filter `NEEDS_REVIEW` and `FAILED` to surface urgent items; sorts by `uploadedAt` ascending (oldest first) | Classification list filters (F1) | "Two NEEDS_REVIEW and one FAILED — I need to handle those before anything else. What else is in here?" | Focused, slightly anxious | `NEEDS_REVIEW` and `FAILED` don't visually pop from the list without filtering; could miss them | Pinned alert strip above the list: "2 plans need your review, 1 failed" with direct filter-apply links |
| **4. Sequence Work** | Reviews the filtered list, notes the plan IDs and PCC types, mentally sequences: Failed → NEEDS_REVIEW → Classified oldest-first | Classification list (F1) | "The failed plan is from last Wednesday — that's the oldest, tackle it first. The two NEEDS_REVIEW plans are more recent." | Determined | No built-in priority sort that accounts for age + status simultaneously; she has to mentally combine these | Auto-sort option: "Urgent first" that weights `FAILED` > `NEEDS_REVIEW` > `CLASSIFIED` by age |
| **5. Open First Priority Item** | Clicks the failed plan; reads the failure reason; decides to retry | Classification detail (F1) | "Text extraction quality issue — I'll retry this one and move on. Probably a scanned PDF." | Pragmatic, slightly frustrated at the plan quality | Failure reasons are technical (`FAILED` with extraction warning) — not always actionable without context | Plain-language failure reason: "This plan may be a scanned image. Try uploading a text-based PDF version." |

---

#### Key Moments

- **Decision Point:** Stage 3 — Applying filters is the fork between an efficient morning and a chaotic one. If the filter UX is slow or confusing, Maya falls back to scrolling, missing urgent items.
- **Risk of Abandonment:** Stage 1 — Without a notification or a clear urgent-item count, Maya may work through plans in default order, leaving `NEEDS_REVIEW` plans unactioned until afternoon.
- **Delight Opportunity:** Stage 2 — The notification bell with a direct link to the ready plan is the moment the platform earns Maya's trust. It demonstrates the system is working *with* her, not waiting for her.

#### Success Outcome

Maya identifies all urgent items (`FAILED`, `NEEDS_REVIEW`) and opens the first priority plan within 60 seconds of logging in — without consulting a spreadsheet, email, or manager. *(JTBD-01.2 success measure: highest-priority items within 60 seconds of login)*

#### Feature Touchpoints

| Stage | Features |
|---|---|
| 1. Login and Orient | F0 (Auth), F1 (Classification List) |
| 2. Spot Notifications | F7 (Notifications) |
| 3. Triage the Queue | F1 (Classification List — filters) |
| 4. Sequence Work | F1 (Classification List — sort) |
| 5. Open First Priority Item | F1 (Classification Detail — retry) |

---

## PER-02: David Reyes — Program Manager

---

### JRN-02.1: View Dashboard KPIs → Drill Into Accuracy Trends → Download Excel Report

**Persona:** PER-02 (David Reyes, Research Portfolio Program Manager)

**Scenario:** It is Thursday morning, one day before the weekly executive status report is due. David opens the dashboard to assess pipeline health, spots an anomaly in the category accuracy chart — one PCC has a 22% override rate — investigates the contributing overrides, and then generates this week's Excel report for delivery to Catherine (PER-05). The entire workflow, which previously took 3–4 hours, now takes under 20 minutes.

**Related JTBD:** JTBD-02.1 (Real-Time Pipeline Health Assessment), JTBD-02.2 (One-Click Weekly Status Report), JTBD-02.3 (Override Rate Analysis by Taxonomy Category)

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **1. Morning Health Check** | Opens the dashboard; scans KPI cards: Total Plans (143), Classified (128), Failed (2), Needs Review (4), Avg Confidence (0.81) | Dashboard KPI cards (F3, F0) | "128 classified is good. But 4 NEEDS_REVIEW — are those handled? 2 failed. I need to check those." | Alert, slightly concerned | KPI cards are numbers without trend direction — can't tell if 4 NEEDS_REVIEW is better or worse than yesterday | Add delta indicators (↑ ↓ →) to KPI cards showing change since the previous day |
| **2. Check Pipeline Status** | Scrolls to pipeline status indicator; sees "Running" with last sync 4 minutes ago; checks stuck record count | Dashboard pipeline status widget (F3, F4) | "Pipeline is running, last sync was 4 min ago. No stuck records. Good — no escalation needed today." | Reassured | Pipeline status is a separate page (F4) — has to navigate away from the dashboard to get full detail | Embed a condensed pipeline health row in the dashboard: status indicator + stuck count + last sync timestamp |
| **3. Spot the Anomaly** | Scrolls to the Category Accuracy bar chart; notices "Telehealth Interventions" bar is highlighted red at 22% override rate | Category accuracy chart (F3) | "22% override rate on Telehealth — that's above the 15% threshold. Is this AI miscalibration or taxonomy ambiguity?" | Concerned, curious | No drill-down from the chart bar to the specific override records — must navigate separately | Click a highlighted chart bar to open a filtered override list for that category in-panel |
| **4. Investigate Overrides** | Navigates to Recent Overrides table; filters by PCC = "Telehealth Interventions"; reviews last 5 override reasons | Recent overrides table (F3) | "Three reviewers all corrected from BehavioralCoaching to DigitalTool. This is consistent — the AI is systematically misfiring on this code." | Analytical, building confidence in the diagnosis | Overrides table requires a separate filter step; no direct link from the accuracy chart | "View overrides for this category" action button on the chart bar tooltip |
| **5. Set Date Range and Confirm** | Sets date range filter to "This week (Mon–Thu)"; confirms KPI cards and charts all update simultaneously | Date range filter (F3) | "Let me make sure these numbers are week-to-date before I generate the report." | Methodical | If any chart fails to update with the filter, he may send a report with mixed date ranges — a credibility risk | Visual "Applying filter…" indicator on all chart components simultaneously; stale-state warning if any chart fails |
| **6. Generate Excel Report** | Navigates to Reports page; clicks "One-Click Export — This Week"; file downloads in 6 seconds | Reports page (F5) | "Done. 143 records, 6 seconds. I'll forward this to Catherine." | Satisfied, relieved | Report column headers use system names (`pcc_code`) not human-readable labels (`Primary Clinical Condition`) | Pre-formatted column headers; confidence scores as percentages; override reason visible per row |

---

#### Key Moments

- **Decision Point:** Stage 3 — David spots the 22% override rate. If the chart doesn't visually highlight threshold violations, he may miss this signal and deliver a report without flagging the anomaly to leadership.
- **Risk of Abandonment:** Stage 4 — If investigating overrides requires too many navigation steps, David may skip the investigation and just report the number without a root-cause diagnosis, reducing the report's value.
- **Delight Opportunity:** Stage 6 — Six-second Excel download after a formerly 3–4 hour manual process is a strong delight moment. A subtle "Report ready — 143 records" confirmation toast reinforces the time savings.

#### Success Outcome

David identifies the Telehealth override anomaly, diagnoses its cause from override records, generates a complete week-to-date Excel report, and delivers it — all in under 20 minutes. *(JTBD-02.1: pipeline health in ≤2 min; JTBD-02.2: report in <15 min; JTBD-02.3: categories >15% visible in single session)*

#### Feature Touchpoints

| Stage | Features |
|---|---|
| 1. Morning Health Check | F3 (Dashboard KPI Cards), F0 (Auth) |
| 2. Check Pipeline Status | F3 (Dashboard), F4 (Pipeline Monitoring) |
| 3. Spot the Anomaly | F3 (Category Accuracy Chart) |
| 4. Investigate Overrides | F3 (Recent Overrides Table) |
| 5. Set Date Range | F3 (Date Range Filter) |
| 6. Generate Excel Report | F5 (Reports), F3 (Data confirmation) |

---

## PER-03: Priya Nair — Taxonomy Administrator

---

### JRN-03.1: Add New Category → Search and Verify → Deactivate an Obsolete Code

**Persona:** PER-03 (Priya Nair, PCORI Taxonomy and Data Standards Administrator)

**Scenario:** PCORI's data standards team notifies Priya of two taxonomy changes this week: (1) a new code must be added for "Remote Patient Monitoring" under the Telehealth category, and (2) an older code "TelehealthGeneral" is now officially retired and should be deactivated. Priya opens the taxonomy management UI, adds the new code, verifies it appears correctly in the hierarchy, searches for the obsolete code, confirms it is not in active use on recent classifications, and deactivates it. Historical records referencing the old code are preserved. She completes both tasks in under 10 minutes with no engineering involvement.

**Related JTBD:** JTBD-03.1 (Safe Taxonomy Lifecycle Management), JTBD-03.2 (Targeted Search and Correction), JTBD-03.3 (Taxonomy Consistency Assurance)

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **1. Navigate to Taxonomy Management** | Logs in with Taxonomy Admin role; navigates to Taxonomy Management from the sidebar | Sidebar nav (F0, F2) | "I need to add the new Remote Patient Monitoring code first, then retire the old TelehealthGeneral one." | Purposeful, slightly cautious | No confirmation that she has the right permissions until she tries to save — late failure is frustrating | Role-aware UI: show "Taxonomy Admin" badge in nav so she's confident she has the right access context |
| **2. Add New Taxonomy Code** | In the two-pane tree UI, navigates to Telehealth → clicks "Add Child Category"; fills in code (`RPM-01`), name, description, level, parent assignment; saves | Taxonomy CRUD form (F2) | "Is this the right parent? I need to make sure it's under Telehealth, not under the top-level ICD-10 branch." | Focused, careful | Hierarchy is easy to misread in a flat form — she could assign the wrong parent without realizing it | Show the full hierarchy path ("Telehealth > Digital Interventions > [new code]") as a breadcrumb preview before save |
| **3. Verify New Code in Tree** | Tree pane updates in real time; locates `RPM-01` under Telehealth; clicks it to confirm all fields saved correctly | Taxonomy tree view (F2) | "Good — it's there, under the right parent. All fields look right. Confidence score will now target this code." | Relieved, satisfied | If the tree doesn't refresh immediately, she can't trust the change was saved | Instant tree refresh with the new node highlighted/animated briefly to draw the eye |
| **4. Search for Obsolete Code** | Types "TelehealthGeneral" in the taxonomy search bar; result appears immediately; clicks the matching entry | Taxonomy search (F2) | "Let me check this code before deactivating it — I want to see when it was last used and confirm no active plans are targeting it." | Methodical, risk-aware | No usage indicator on the taxonomy entry — she can't easily tell if any current open plans are still classified under this code | Show "Last used in N classifications; N active plans reference this code" on the code detail panel |
| **5. Deactivate Obsolete Code** | Reviews the audit trail showing last modification; confirms no active plans; clicks "Deactivate"; confirms in the dialog | Deactivate action (F2) | "Deactivating, not deleting. Historical records will keep their reference. Future classifications won't see this code. That's the right behavior." | Deliberate, confident | Deactivate dialog must clearly distinguish deactivate from delete — a misread could cause irreversible harm | Dialog copy: "This will hide the code from future classifications. Existing records that use it will not be affected." |
| **6. Confirm Deactivation and Audit Trail** | Returns to the code detail; sees status "Inactive"; checks audit trail showing her username and timestamp | Taxonomy detail + audit trail (F2) | "Audit trail shows my name, today's date, and the action. Done — this is verifiable if anyone asks." | Satisfied, at ease | Audit trail may be buried or require an extra click to expose | Surface recent audit action as a visible "Last modified by [Priya Nair] on [date]" label on the detail panel |

---

#### Key Moments

- **Decision Point:** Stage 2 — Selecting the parent node is the highest-risk moment. A misassignment creates a taxonomy structural error that propagates to every future classification until corrected.
- **Risk of Abandonment:** Stage 4 — If Priya can't quickly verify whether the obsolete code is still in use, she may defer the deactivation out of caution, leaving a retired code active in the pipeline.
- **Delight Opportunity:** Stage 3 — Real-time tree refresh showing the new code in place immediately is a powerful confirmation that the platform handles taxonomy state correctly — no "did it actually save?" anxiety.

#### Success Outcome

Priya adds the new `RPM-01` code and deactivates `TelehealthGeneral` — both in under 10 minutes total, with no engineering ticket, no page reload required, and a full audit trail entry for each action. *(JTBD-03.1: add or deactivate in <5 min each; JTBD-03.2: locate code in <3 min; JTBD-03.3: audit trail confirms live state)*

#### Feature Touchpoints

| Stage | Features |
|---|---|
| 1. Navigate | F0 (Auth + RBAC), F2 (Taxonomy Management sidebar) |
| 2. Add New Code | F2 (Taxonomy CRUD form) |
| 3. Verify in Tree | F2 (Taxonomy tree view) |
| 4. Search for Obsolete Code | F2 (Taxonomy search) |
| 5. Deactivate | F2 (Deactivate action + confirmation dialog) |
| 6. Confirm Audit Trail | F2 (Taxonomy detail + audit trail) |

---

## PER-04: Tom Schaefer — System Administrator

---

### JRN-04.1: Provision New User → Assign Role → Send Email Verification

**Persona:** PER-04 (Tom Schaefer, Platform System Administrator)

**Scenario:** A new research reviewer, Amara, is joining the team Monday and needs platform access by 9 AM. Tom receives a Slack message Friday afternoon. He opens the admin UI, creates Amara's account, assigns the Reviewer role, and submits — triggering an automatic email verification to Amara. The whole process takes under 3 minutes. Tom also verifies the account appears in the user list with "Pending Verification" status so he can follow up if Amara hasn't activated by Monday morning.

**Related JTBD:** JTBD-04.1 (Frictionless User Provisioning)

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **1. Navigate to User Management** | Opens the admin sidebar; navigates to User Management | Sidebar nav (F0, F6) | "Add User — let me get this done before EOD so Amara can activate over the weekend." | Purposeful, slightly rushed | No shortcut from the home screen to "Add User" — takes 2 clicks minimum | Contextual "Add User" quick-action on the admin dashboard landing widget |
| **2. Fill the Add User Form** | Clicks "Add User"; completes form: username, email, first name, last name, role = `REVIEWER`, initial status = Active | Add User dialog (F6) | "Reviewer role for a new reviewer — straightforward. Email is the critical field for verification." | Focused | Multi-select role field can be confusing if role names don't clearly map to what the person does (e.g., `ROLE_REVIEWER` vs. `Reviewer`) | Display role display names with a brief description: "Reviewer — can upload plans and submit classifications" |
| **3. Submit and Verify Email Trigger** | Clicks "Create User"; sees a success toast: "Account created. Verification email sent to amara@pcori.org" | Add User dialog + toast notification (F6, F7) | "One step — account created and email triggered simultaneously. No follow-up needed from me." | Relieved | If the email trigger silently fails, Tom has no indication — Amara won't receive the verification link | Explicit confirmation in the toast: "Verification email delivered" vs. "Email could not be sent — retry" |
| **4. Verify in User List** | Locates Amara's account in the user list; status shows "Active / Pending Email Verification" | User list (F6) | "Good — I can see she's created but not yet verified. I'll follow up Monday morning if she hasn't activated." | Satisfied, organized | "Pending Verification" status may not be visually distinct from "Active" without a badge or color code | Distinct visual badge: "Email Unverified" in amber; filterable by verification status so Tom can see all pending accounts |
| **5. Confirm Role Assignment** | Clicks into Amara's user record; confirms role = Reviewer is displayed correctly | User detail view (F6) | "Role is correct — she'll have the right access when she activates." | Confident | Role changes take effect immediately but Tom can't easily confirm what Amara will be able to see until she logs in | Show a "Permissions preview" on the user detail: a summary of what features this role grants access to |

---

#### Key Moments

- **Decision Point:** Stage 2 — Role assignment. Assigning the wrong role (e.g., Admin instead of Reviewer) would give Amara inappropriate access. Role names must be unambiguous.
- **Risk of Abandonment:** Stage 3 — If the email trigger fails silently, Amara won't receive her verification link and won't be able to log in Monday. Tom won't know until Amara escalates.
- **Delight Opportunity:** Stage 3 — A single-submit flow that creates the account, assigns the role, and sends the verification email atomically is the core value of this journey. A clear success confirmation (with "verification email sent" explicitly stated) closes the loop.

#### Success Outcome

Tom creates Amara's account, assigns the Reviewer role, and triggers email verification in a single form submission — under 3 minutes, no IT ticket, no follow-up steps required. The user list confirms her "Pending Verification" status so Tom can follow up if needed. *(JTBD-04.1 success measure: provisioned in <3 min; zero IT tickets)*

#### Feature Touchpoints

| Stage | Features |
|---|---|
| 1. Navigate | F0 (Auth + RBAC), F6 (User Management) |
| 2. Fill Add User Form | F6 (Add User dialog) |
| 3. Submit | F6 (Form submit), F7 (Email notification trigger) |
| 4. Verify in User List | F6 (User list — verification status filter) |
| 5. Confirm Role | F6 (User detail view) |

---

### JRN-04.2: Deactivate a Departing User's Account

**Persona:** PER-04 (Tom Schaefer, Platform System Administrator)

**Scenario:** Tom receives notification that a reviewer, Marcus, left the organization today. His manager emails Tom at 2 PM asking that Marcus's account be deactivated immediately. Tom opens the user management page, searches for Marcus by email, reviews his account, and deactivates it — without deleting it, so Marcus's historical classification records remain intact in the audit trail. The entire flow takes under 2 minutes.

**Related JTBD:** JTBD-04.2 (Immediate Access Revocation for Departed Users)

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **1. Search for the User** | Navigates to User Management; types "marcus" in the search bar; finds Marcus's account in the filtered list | User list search (F6) | "There he is — email matches, role is Reviewer. Let me make sure I have the right account before doing anything irreversible." | Cautious, deliberate | If multiple accounts have similar names, Tom needs a clear identifier (email, role, last login date) to confirm the right record | Show email address, role, and last login prominently in search results to prevent mistaken deactivation |
| **2. Open Account and Review** | Clicks Marcus's account; reviews last login date, assigned role, and recent activity | User detail view (F6) | "Last login was this morning — he was active today. This is definitely the right account. No active sessions after deactivation." | Deliberate | No session revocation info shown — Tom wonders if Marcus's current JWT would still work after deactivation | Explain the behavior: "Existing sessions will be invalidated on next request. Access ends immediately." |
| **3. Deactivate with Confirmation** | Clicks "Deactivate Account"; reads the confirmation dialog ("This will prevent Marcus from logging in. His history will be preserved."); confirms | Deactivate dialog (F6) | "Soft deactivate — not delete. His classifications and overrides stay in the audit trail. Good." | Relieved, confident in the design | Confirmation dialog must make "preserve history" behavior explicit — if Tom fears data loss, he may hesitate | Dialog: "Marcus's account will be deactivated. He will no longer be able to log in, but all classification records associated with his account will remain intact." |
| **4. Confirm Deactivation** | Returns to the user list; searches for Marcus; sees status "Inactive" with a greyed-out row | User list (F6) | "Done. Inactive, greyed out, audit history preserved. I'll reply to the email now." | Satisfied, task complete | No time-stamped deactivation record in the user list row — Tom can't easily confirm exactly when it was deactivated | Show deactivation timestamp in the user row and in the user detail audit trail |

---

#### Key Moments

- **Decision Point:** Stage 3 — The confirmation dialog is the last gate before an action that ends someone's access. The dialog must clearly distinguish deactivate (reversible, history preserved) from delete (irreversible, history lost).
- **Risk of Abandonment:** Stage 2 — If Tom isn't sure the JWT invalidation is immediate, he may want to verify with DevOps first, adding delay and defeating the "immediate access revocation" requirement.
- **Delight Opportunity:** Stage 4 — A clean "Inactive" status with preserved audit history is the right outcome signal. A brief audit entry ("Deactivated by Tom Schaefer on [date/time]") on the user detail gives Tom an accountable record of his own action.

#### Success Outcome

Marcus's account is deactivated within 2 minutes of Tom receiving the notification — access revoked immediately, all historical classification and override records intact, deactivation logged with Tom's identity and a timestamp. *(JTBD-04.2 success measure: <2 min; access revoked immediately; audit history preserved)*

#### Feature Touchpoints

| Stage | Features |
|---|---|
| 1. Search | F6 (User list search) |
| 2. Review Account | F6 (User detail view) |
| 3. Deactivate | F6 (Deactivate dialog + confirmation), F0 (JWT invalidation) |
| 4. Confirm | F6 (User list — status view) |

---

## PER-05: Catherine Wu — Executive / Stakeholder

---

### JRN-05.1: Request Excel Report → Review KPIs → Share with Stakeholders

**Persona:** PER-05 (Catherine Wu, VP of Research Portfolio, PCORI)

**Scenario:** It is the Thursday before the quarterly board meeting. Catherine has 45 minutes before a prep call with her Chief of Staff. She opens the platform, checks the KPI dashboard to orient herself on program status, downloads the Q2 Excel classification report directly (without waiting for David to produce it), scans the key figures, and forwards the file to two board prep participants. The entire workflow takes under 10 minutes — compared to waiting 3–4 hours for a manually-produced report under the old process.

**Related JTBD:** JTBD-05.1 (Presentation-Ready Excel Reports on Demand), JTBD-05.2 (Pre-Meeting Program Status Snapshot), JTBD-05.3 (Audit Traceability Confirmation)

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **1. Login and Dashboard Load** | Opens the platform in her browser; logs in; lands on the dashboard; scans KPI cards | Dashboard KPI cards (F3, F0) | "What's the current state? Override rate, total classified, confidence average — I need these numbers for the prep call." | Slightly anxious (meeting approaching), focused | Dashboard may load with KPIs from a stale date range — she might unknowingly read outdated numbers | Default the dashboard to the current quarter on load; show "Data current as of [timestamp]" under KPI cards |
| **2. Assess Program Health** | Reviews KPI cards: Total Plans 398, Classified 371, Override Rate 11.2%, Avg Confidence 0.83 — all within targets | Dashboard KPI cards + accuracy trend chart (F3) | "11.2% override rate — under the 15% threshold. Confidence is above 0.80. I can state with confidence the program is on track." | Reassured, building confidence | Accuracy trend chart requires scrolling — she may miss it without a prompt | Sticky KPI summary row at the top with the most board-relevant metrics; highlight any figure above threshold in amber |
| **3. Download Q2 Excel Report** | Navigates to the Reports page; selects date range Q2 (Apr 1 – Jun 30); clicks "Generate Excel"; file downloads in 7 seconds | Reports page (F5) | "Let me pull this now instead of waiting for David. I can verify the numbers myself." | Independent, time-saving | If column headers are system names or the formatting is raw, Catherine would need to reformat before sharing — blocking the whole point | Pre-formatted Excel: human-readable headers, confidence as %, columns ordered for presentation (plan ID, PCC, status, reviewer, date) |
| **4. Scan Report for Anomalies** | Opens the downloaded file; reviews plan count, checks override rate column, scans reviewer names for completeness | Excel report (F5) | "Plan IDs, PCCs, reviewer names, timestamps — all there. Override reasons are filled in for all overridden records. This looks complete." | Reassured, increasingly confident | If any override reason cell is blank, Catherine would question the data quality and have to ask David — friction at exactly the wrong moment | Required override reason (enforced in F1) ensures no blank cells; report includes a summary row at the top with totals |
| **5. Share with Stakeholders** | Forwards the Excel file to Chief of Staff and Board Prep lead via email with a brief note | Email client (external) | "Done — I'm sending the report with a 3-line summary: classified volume, override rate, confidence average. No reformatting needed." | Satisfied, confident in the data | No built-in share or send-to-colleague feature in the platform — she has to switch to email | Optional: shareable report link (authenticated, time-limited) for internal stakeholders; not required for v1 |

---

#### Key Moments

- **Decision Point:** Stage 3 — Catherine generates the report herself rather than waiting for David. If the report generation UX is confusing or the output is poorly formatted, she will revert to asking David, eliminating the self-service benefit.
- **Risk of Abandonment:** Stage 4 — If the Excel file has blank override reason cells or unrecognizable column headers, Catherine loses confidence in the data and escalates to David anyway, defeating the purpose.
- **Delight Opportunity:** Stage 3 — A 7-second download that produces a board-ready Excel file is the moment the platform fully earns Catherine's trust. No reformatting, no waiting, no manual reconciliation. This is the platform's executive promise fulfilled.

#### Success Outcome

Catherine downloads a complete, presentation-ready Q2 Excel report in under 10 minutes — with every figure traceable to named reviewers and timestamps, override reasons populated for all overridden records, and no manual reformatting required. *(JTBD-05.1: report in <5 min; JTBD-05.2: dashboard orientation in <90 sec; JTBD-05.3: audit fields present in every record)*

#### Feature Touchpoints

| Stage | Features |
|---|---|
| 1. Login and Dashboard | F0 (Auth), F3 (Dashboard KPI Cards) |
| 2. Assess Program Health | F3 (KPI Cards + Accuracy Trend Chart) |
| 3. Download Report | F5 (Reports — date range filter + Generate Excel) |
| 4. Scan Report | F5 (Excel output quality — F1 ensures override reasons are non-null) |
| 5. Share | External email client (out of platform scope for v1) |

---

## Cross-Journey Patterns

### CP-01: Audit Trail as the Shared Trust Anchor
Every journey — from Maya's override (JRN-01.1) to Priya's taxonomy deactivation (JRN-03.1) to Tom's user deactivation (JRN-04.2) to Catherine's report scan (JRN-05.1) — converges on the same requirement: **every significant action must be traceable to a named user with a timestamp.** The `AuditableEntity` base class (`createdBy`, `lastModifiedBy`, `createdAt`, `updatedAt`) and required override reason field are the architectural enforcement of this cross-cutting need. If audit fields are null (e.g., due to missing `SecurityContextPropagatingDecorator` on async threads), every downstream journey breaks.

**Opportunity:** Surface audit trail information at the point of action completion — not buried in a separate audit log screen. Each persona should see confirmation of *who did what and when* in the UI immediately after a significant action.

---

### CP-02: Soft-Delete Over Hard-Delete Across All Entity Types
Maya expects historical classifications to survive an override (JRN-01.1). Priya expects historical classification records to retain references to deactivated taxonomy codes (JRN-03.1). Tom expects Marcus's classification history to survive account deactivation (JRN-04.2). Catherine expects to be able to retrieve records from any past period (JRN-05.1).

**Pattern:** Soft-delete (`deleted_at`, `status = INACTIVE`) is the correct behavior for all mutable entities — users, taxonomy codes, classifications, and report artifacts. Hard-delete must be administratively blocked or require explicit override by a super-admin.

**Risk:** Analytics queries that omit `AND deleted_at IS NULL` will include soft-deleted records, inflating counts. All native SQL analytics queries must enforce this condition explicitly (PRD §7 NFR: auditability).

---

### CP-03: Date-Range Filter as a Cross-Feature Contract
David (JRN-02.1), Catherine (JRN-05.1), and indirectly Priya (JRN-03.1 — verifying when a code was last used) all depend on accurate date-range filtering. The dashboard filter must cascade to *all* KPI cards and charts simultaneously (F3 NFR). If any chart lags or ignores the filter, the user loses confidence in the data consistency — a critical trust failure for David's reporting and Catherine's executive presentation.

**Opportunity:** A visible "Filter applied: [date range]" persistent label below the date range picker, with a "Reset to default" link, gives all personas confidence that every number on screen reflects the same time window.

---

### CP-04: Status-Based Visual Prioritization
Maya (JRN-01.2) relies on visual prominence of `NEEDS_REVIEW` and `FAILED` to triage her queue. David (JRN-02.1) relies on highlighted threshold violations in the category accuracy chart. Tom (JRN-04.1) relies on "Email Unverified" badges on user accounts.

**Pattern:** `NEEDS_REVIEW`, `FAILED`, and threshold-violating states must be visually distinct from normal states using both color *and* text labels (never color alone — WCAG 2.1 AA requirement per PRD §7 NFR: accessibility). A consistent status badge component (e.g., amber for `NEEDS_REVIEW`, red for `FAILED`, green for `CLASSIFIED`) used across all list views reduces cognitive load across all persona journeys.

---

### CP-05: Single-Action Completion as the UX Standard
Every task in these journeys is most valuable when it completes in a single workflow:
- Upload → classify (single pipeline trigger, no follow-up action from Maya)
- Create user → assign role → send verification (single form submit, no multi-step coordination for Tom)
- Generate report → download (single click, no analyst intermediary for David and Catherine)
- Add taxonomy code → live in pipeline (single save, no engineering restart for Priya)

**Risk:** Any multi-step coordination requirement (e.g., role assignment as a separate step after account creation, or taxonomy changes requiring a service restart) breaks the single-action promise and creates the operational friction these journeys are designed to eliminate.

---

## Journey-to-JTBD Traceability

| Journey | Stage | JTBD-ID | Expected Outcome |
|---|---|---|---|
| JRN-01.1 | 1–2: Upload + Monitor | JTBD-01.1 | Plan enters pipeline; 202 Accepted in <2s; classification completes in ≤5 min |
| JRN-01.1 | 3–4: Review + Decide | JTBD-01.1 | AI confidence score displayed; NEEDS_REVIEW status if confidence < 0.75 |
| JRN-01.1 | 5: Submit Override | JTBD-01.3 | Override with required non-empty reason; `reviewedBy`, `reviewedAt` recorded |
| JRN-01.1 | 6: Confirm Audit | JTBD-01.3 | Auditable record immediately available with reviewer identity + timestamp + override reason |
| JRN-01.2 | 1: Login and Orient | JTBD-01.2 | Default post-login landing on classification list; no external tool needed |
| JRN-01.2 | 2: Spot Notifications | JTBD-01.4 | In-app notification bell shows unread badge within ≤10s of classification status change |
| JRN-01.2 | 3–4: Triage + Sequence | JTBD-01.2 | NEEDS_REVIEW + FAILED items identifiable within 60s; filter returns results in <1.5s |
| JRN-01.2 | 5: Open First Item | JTBD-01.2 | First priority plan opened within 60s of login |
| JRN-02.1 | 1: Health Check | JTBD-02.1 | All KPI cards display current values; dashboard loads in <1.5s |
| JRN-02.1 | 2: Pipeline Status | JTBD-02.1 | Stuck records surface; pipeline health visible without leaving dashboard |
| JRN-02.1 | 3–4: Anomaly + Investigate | JTBD-02.3 | Categories >15% override rate visually highlighted; override records filterable by category |
| JRN-02.1 | 5: Date Range | JTBD-02.1 | Date filter cascades simultaneously to all KPI cards and chart components |
| JRN-02.1 | 6: Generate Report | JTBD-02.2 | .xlsx downloaded in <10s for ≤1,000 records; all required columns present |
| JRN-03.1 | 1: Navigate | JTBD-03.3 | Role-based access confirmed; Taxonomy Admin UI available without engineering step |
| JRN-03.1 | 2: Add New Code | JTBD-03.1 | New taxonomy category added via UI form; no database access; parent hierarchy visible |
| JRN-03.1 | 3: Verify in Tree | JTBD-03.1 | Tree refreshes immediately; new code visible and selectable as classification target |
| JRN-03.1 | 4: Search | JTBD-03.2 | Search returns matching codes within 500ms of typing; no full-tree scroll required |
| JRN-03.1 | 5: Deactivate | JTBD-03.1 | Soft deactivate; code excluded from targeting; historical records unaffected |
| JRN-03.1 | 6: Audit Trail | JTBD-03.3 | Audit trail shows actor identity + timestamp for every taxonomy CRUD action |
| JRN-04.1 | 1–2: Navigate + Form | JTBD-04.1 | Admin UI accessible; Add User form presents all required fields in one dialog |
| JRN-04.1 | 3: Submit | JTBD-04.1 | Account created + role assigned + verification email triggered in single submission |
| JRN-04.1 | 4–5: Verify | JTBD-04.1 | "Pending Verification" status visible in user list; filterable by verification status |
| JRN-04.2 | 1: Search | JTBD-04.2 | User found by email search; sufficient identifiers to confirm correct account |
| JRN-04.2 | 2–3: Review + Deactivate | JTBD-04.2 | Deactivate (not delete) with explicit confirmation; JWT invalidated on next request |
| JRN-04.2 | 4: Confirm | JTBD-04.2 | "Inactive" status visible; audit history intact; deactivation timestamped by actor |
| JRN-05.1 | 1–2: Login + Dashboard | JTBD-05.2 | Dashboard KPIs load in <1.5s; data current within last polling interval |
| JRN-05.1 | 3: Download Report | JTBD-05.1 | Report generated in <10s; pre-formatted for presentation; no reformatting required |
| JRN-05.1 | 4: Scan Report | JTBD-05.3 | Every classification row has: plan ID, reviewer name, timestamps, confidence, override reason (if applicable) |
| JRN-05.1 | 5: Share | JTBD-05.1 | Report is shareable as-is; all figures traceable to source records |

---

*JOURNEYS v1.0 — PCORI Research Analytics Platform*
*Generated: 2026-05-20 | Derived from PERSONAS-PCORI.md v1.0 + JTBD-PCORI.md v1.0 + PRD-PCORI.md v1.0*
