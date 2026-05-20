# Jobs-to-be-Done Document
## PCORI Research Analytics Platform

| Field | Value |
|---|---|
| **Product Name** | PCORI Research Analytics Platform |
| **Project Acronym** | PCORI |
| **Document Version** | 1.0 |
| **Document Type** | Jobs-to-be-Done (JTBD) |
| **Date** | 2026-05-20 |
| **Related Personas** | `project_specs/PERSONAS-PCORI.md` v1.0 |
| **Related PRD** | `project_specs/PRD-PCORI.md` v1.0 |
| **Derived From** | PERSONAS-PCORI §PER-01 through PER-05; PRD §6 Feature Requirements; PRD §8 Success Metrics |

---

## JTBD Summary Table

| JTBD-ID | Persona | Job Statement (abbreviated) | Priority |
|---|---|---|---|
| JTBD-01.1 | PER-01 Research Reviewer | Get an AI-generated taxonomy classification for a new research plan with visible confidence | P0 |
| JTBD-01.2 | PER-01 Research Reviewer | Triage my daily classification queue and reach the highest-priority items first | P0 |
| JTBD-01.3 | PER-01 Research Reviewer | Correct an AI classification and leave a documented reason for audit purposes | P0 |
| JTBD-01.4 | PER-01 Research Reviewer | Get alerted when a classification needs my attention without polling the UI | P2 |
| JTBD-02.1 | PER-02 Program Manager | Assess classification pipeline health and spot problems before they delay reporting | P1 |
| JTBD-02.2 | PER-02 Program Manager | Generate a complete weekly status report in minutes without analyst support | P1 |
| JTBD-02.3 | PER-02 Program Manager | Identify which taxonomy categories are driving high override rates | P1 |
| JTBD-03.1 | PER-03 Taxonomy Administrator | Add or deprecate taxonomy codes without disrupting historical classification records | P0 |
| JTBD-03.2 | PER-03 Taxonomy Administrator | Locate and correct a specific taxonomy entry quickly within a large hierarchy | P0 |
| JTBD-03.3 | PER-03 Taxonomy Administrator | Trust that the taxonomy the platform uses is exactly what I last approved | P0 |
| JTBD-04.1 | PER-04 System Administrator | Provision a new reviewer account and grant appropriate access without an IT ticket | P0 |
| JTBD-04.2 | PER-04 System Administrator | Immediately revoke a departing user's access while preserving their audit history | P0 |
| JTBD-04.3 | PER-04 System Administrator | Detect and resolve classification pipeline failures before reviewers are impacted | P1 |
| JTBD-05.1 | PER-05 Executive / Stakeholder | Receive presentation-ready Excel reports that I can share with funders without manual reformatting | P1 |
| JTBD-05.2 | PER-05 Executive / Stakeholder | Get a real-time program status snapshot before a leadership meeting | P1 |
| JTBD-05.3 | PER-05 Executive / Stakeholder | Confirm that classification data is auditable and traceable to named reviewers | P1 |

---

## PER-01: Maya Okonkwo — Research Reviewer

---

### JTBD-01.1: AI-Assisted Classification Initiation

**Job Statement:**
When I receive a new research plan PDF that needs to be entered into the classification pipeline, I want to upload it and receive a completed taxonomy assignment with a visible confidence score within minutes, so I can focus my expert judgment on validating the result rather than performing the classification from scratch.

**Current Alternatives:**
- Opens the research plan PDF in one window, a cross-reference ICD-10 spreadsheet in another, and manually types taxonomy assignments into a shared tracking workbook
- Spends 45–60 minutes per plan on lookup, cross-reference, and data entry
- Relies on memory and personal notes for consistency across similar plans reviewed on different days

**Hiring Criteria:**
- Accepts a PDF-only upload with MIME validation and provides progress feedback during processing
- Returns a completed classification across all four taxonomy dimensions (PCC, category, code, subcode) within ≤5 minutes for a standard research plan
- Displays an AI confidence score alongside each classification so I can calibrate how much scrutiny to apply
- Flags low-confidence results (below the configurable threshold) as `NEEDS_REVIEW` rather than presenting them as authoritative
- Stores the classification with a timestamped record of who uploaded it and which model version produced it

**Success Measure:** Reviewer can upload a plan and receive a complete taxonomy classification — ready for accept-or-override decision — in ≤5 minutes, reducing per-plan effort from ~60 minutes to under 10 minutes total (upload + review).

**Related Features:** F1, F9, F0
**Priority:** P0

---

### JTBD-01.2: Daily Queue Triage

**Job Statement:**
When I start my workday with a queue of 15–25 pending research plans, I want to filter and sort the queue by status, date, and Primary Clinical Condition, so I can identify which plans need immediate action and sequence my work without opening every record one by one.

**Current Alternatives:**
- Checks three separate spreadsheets to piece together which plans are assigned, in progress, or complete
- Uses color-coded highlighting in Excel to identify overdue or high-priority items — manual and error-prone
- Relies on email from the Program Manager to learn which plans are most urgent

**Hiring Criteria:**
- Provides a paginated classification list that I can filter by status (`PENDING`, `PROCESSING`, `CLASSIFIED`, `NEEDS_REVIEW`, `FAILED`), date range, and PCC in a single view
- Supports keyword search by plan ID and title so I can locate a specific plan without scrolling
- Highlights `NEEDS_REVIEW` and `FAILED` records visually so they stand out from the queue without requiring manual filtering
- Loads the filtered list in under 1.5 seconds so I can iterate through filter combinations quickly

**Success Measure:** Reviewer can identify which plans require immediate action within 60 seconds of opening the classification queue — without consulting an external spreadsheet or waiting for a manager's email.

**Related Features:** F1, F0
**Priority:** P0

---

### JTBD-01.3: Override with Documented Reasoning

**Job Statement:**
When I determine that the AI-generated taxonomy classification is incorrect for a research plan, I want to correct all four taxonomy dimensions and record my reasoning in a required free-text field, so I can produce an audit-ready record of why my expert judgment differed from the automated result.

**Current Alternatives:**
- Manually changes the taxonomy entry in the shared tracking workbook with no structured field for override reasoning
- Adds informal comments in a notes column that are inconsistently used across the team
- Has no mechanism to surface override patterns over time — each correction is isolated

**Hiring Criteria:**
- Allows editing of all four taxonomy dimensions (PCC, category, code, subcode) during an override action
- Requires a non-empty override reason before the override can be submitted — reason field cannot be skipped
- Records `reviewedBy` (reviewer identity), `reviewedAt` (timestamp), and the override reason alongside the corrected classification
- Makes the override reason visible to Program Managers and auditors without additional query steps

**Success Measure:** Reviewer can complete a full taxonomy override — including required reason — in under 3 minutes, and the resulting record is immediately available as an auditable override entry traceable to the reviewer's identity and timestamp.

**Related Features:** F1, F0
**Priority:** P0

---

### JTBD-01.4: Proactive Classification Alerts

**Job Statement:**
When a classification I submitted finishes processing or is flagged as `NEEDS_REVIEW`, I want to receive an in-app notification immediately, so I can act on the result without having to remember to manually check the queue at intervals.

**Current Alternatives:**
- Periodically refreshes the classification list page to check for status changes — no automatic alert
- Misses `NEEDS_REVIEW` flags until the end of the day or the following morning
- Relies on informal nudges from the Program Manager when a plan has been stuck for too long

**Hiring Criteria:**
- Delivers an in-app notification (bell icon with unread count badge) when a classification transitions to `CLASSIFIED`, `FAILED`, or `NEEDS_REVIEW`
- Notification is visible without refreshing the page and is accessible from any page in the application
- Allows per-user preference configuration to choose which event types trigger in-app vs. email notifications
- Critical events (`FAILED`, `NEEDS_REVIEW`) support optional email notification for out-of-app awareness

**Success Measure:** Zero missed `NEEDS_REVIEW` alerts per week — every plan flagged for human review is actioned within the same business day it was flagged, without requiring the reviewer to remember to check manually.

**Related Features:** F7, F1, F0
**Priority:** P2

---

## PER-02: David Reyes — Program Manager

---

### JTBD-02.1: Real-Time Pipeline Health Assessment

**Job Statement:**
When I start my workday or prepare for a stakeholder meeting, I want to see a live dashboard showing classification volume, pipeline status, and any stuck or failed records, so I can catch operational problems before they delay the reporting cycle or require emergency escalation.

**Current Alternatives:**
- Has no real-time view of pipeline health — problems surface only when a reviewer escalates or a reporting deadline is missed
- Checks in with reviewers individually via email or Slack to get a rough sense of queue depth
- Discovers failed or stuck records only when they appear as gaps in the weekly report — after the damage is done

**Hiring Criteria:**
- Displays KPI cards (Total Plans, Classified, Processing, Pending, Failed, Needs Review, Average Confidence) updated in real time without requiring a manual page refresh
- Highlights `FAILED` and `NEEDS_REVIEW` counts prominently so they demand attention before reviewing other metrics
- Shows pipeline operational status (running / paused / stopped) with a clear visual indicator
- Surfaces records stuck in `PROCESSING` beyond the configurable timeout threshold so I can escalate to System Admin before they affect the reporting cycle
- Dashboard initial load completes in under 1.5 seconds

**Success Measure:** Program Manager can assess complete pipeline health — including any stuck or failed records — within 2 minutes of opening the dashboard, with zero operational failures going undetected for more than one business day.

**Related Features:** F3, F4, F0
**Priority:** P1

---

### JTBD-02.2: One-Click Weekly Status Report

**Job Statement:**
When I need to deliver a weekly status report to executive leadership, I want to generate and download a formatted Excel file of all classified plans for the period in a single action, so I can eliminate the 3–4 hours of manual spreadsheet aggregation that currently consumes my reporting cycle.

**Current Alternatives:**
- Collects individual classification spreadsheets from each reviewer via email
- Manually consolidates, deduplicates, and reformats the data in Excel — a 3–4 hour process per cycle
- Sends the resulting file to leadership knowing it may contain reconciliation errors from manual data entry

**Hiring Criteria:**
- Provides a one-click Excel export (`.xlsx`) that includes all classified plan records for the selected date range without requiring column selection or filter configuration
- Exported file includes: plan ID, title, PCC, taxonomy category/code/subcode, confidence score, status, reviewer name, upload date, classification date, and override reason (if applicable)
- Export completes in under 10 seconds for up to 1,000 records
- Supports ad-hoc report builder with column selection and filter presets for custom executive requests
- Saved report templates allow me to run the same report configuration every cycle without reconfiguring

**Success Measure:** Program Manager can produce a complete, accurate weekly status report in under 15 minutes — down from 3–4 hours — with zero manual data aggregation steps.

**Related Features:** F5, F3, F0
**Priority:** P1

---

### JTBD-02.3: Override Rate Analysis by Taxonomy Category

**Job Statement:**
When reviewing accuracy trends across my portfolio, I want to identify which taxonomy categories and PCCs have disproportionately high override rates, so I can determine whether the AI model is miscalibrated for specific research domains or whether the taxonomy itself is ambiguous.

**Current Alternatives:**
- Manually cross-references override entries in the tracking spreadsheet against taxonomy category columns — a time-consuming pivot table exercise
- Cannot distinguish AI miscalibration from taxonomy ambiguity without reviewer-level context
- Has no trend view — can only see a snapshot of current overrides, not how override rates have changed over time

**Hiring Criteria:**
- Displays a per-category accuracy bar chart breaking down override rates by PCC and taxonomy category
- Provides a date-range filter that cascades to all charts simultaneously so I can compare time periods
- Shows an accuracy trend line chart over time (human-validated vs. AI output) using accumulated override history
- Lists recent overrides with reviewer identity, reason, and classification details so I can identify patterns
- Highlights categories exceeding 15% override rate with a visual threshold indicator

**Success Measure:** Program Manager can identify every taxonomy category with an override rate above 15% and review the contributing override records — within a single dashboard session, without exporting to Excel first.

**Related Features:** F3, F5, F0
**Priority:** P1

---

## PER-03: Priya Nair — Taxonomy Administrator

---

### JTBD-03.1: Safe Taxonomy Lifecycle Management

**Job Statement:**
When PCORI adds a new research domain or officially retires an existing clinical category, I want to add or deactivate taxonomy codes through a UI form without touching the database directly, so I can keep the classification target current without creating data integrity problems in historical classification records.

**Current Alternatives:**
- Taxonomy codes are scattered across multiple documents and spreadsheets with no authoritative version control
- Deprecating a code risks orphaning historical classifications if the code is hard-deleted
- Any taxonomy update requires manual coordination with engineering — changes are not reflected in the classification pipeline until an engineer restarts the service

**Hiring Criteria:**
- Provides a form-based interface to add new taxonomy categories with code, name, description, level, and parent assignment — no database access required
- Implements activate/deactivate (soft lifecycle) instead of hard-delete so deprecated codes remain linked to historical classification records
- Deactivated codes are immediately excluded from classification targeting but remain readable in historical records
- All CRUD actions are reflected in the classification pipeline without requiring engineering intervention or service restart
- Full audit trail records who performed each taxonomy change and when

**Success Measure:** Taxonomy Administrator can add or deactivate a code in under 5 minutes through the UI, with the change immediately reflected in classification targeting — with zero engineering intervention and zero broken references in historical records.

**Related Features:** F2, F0
**Priority:** P0

---

### JTBD-03.2: Targeted Taxonomy Search and Correction

**Job Statement:**
When a reviewer reports that a taxonomy code is mislabeled or a description is out of date, I want to locate that specific code quickly across a large hierarchical tree and correct it in place, so I can resolve the issue before it affects the next batch of classifications.

**Current Alternatives:**
- Scrolls through large flat lists in spreadsheets to find a specific code — no search capability
- Cannot quickly verify parent-child relationships without manually tracing the hierarchy column-by-column
- Edits to descriptions must be coordinated with engineering since the taxonomy lives in source-controlled files

**Hiring Criteria:**
- Provides a search input that matches taxonomy codes, names, and description text — returning results in real time as I type
- Displays the full hierarchical tree in a two-pane UI (tree navigation on the left, detail/edit form on the right) so I can understand a code's position in the hierarchy while editing it
- Edits to name, description, and display order are saved immediately and reflected in the tree view without a page reload
- Hierarchical tree renders the updated structure correctly after any change — no stale state

**Success Measure:** Taxonomy Administrator can locate any code by search and complete an edit — including verifying its position in the hierarchy — in under 3 minutes, with the corrected description visible to the classification pipeline immediately.

**Related Features:** F2, F0
**Priority:** P0

---

### JTBD-03.3: Taxonomy Consistency Assurance

**Job Statement:**
When the classification pipeline is actively processing research plans, I want to trust that the taxonomy it is targeting is exactly the version I last approved and saved, so I can be confident that the AI classifications are anchored to current, authoritative codes rather than a stale or partially-updated snapshot.

**Current Alternatives:**
- No single authoritative source — taxonomy definitions diverge across spreadsheets, Word documents, and engineering seed files
- Taxonomy updates are not reflected in classification until engineering manually reloads the seed data
- Has no way to verify whether the platform is using the current taxonomy or a version from the last deployment

**Hiring Criteria:**
- Flyway repeatable seed migration (`R__seed_taxonomy.sql`) automatically applies taxonomy changes on deployment without manual reset
- UI changes to taxonomy are the authoritative source of truth — changes made through the admin interface propagate to classification targeting without engineering involvement
- Tree view reflects the current live taxonomy state, not a cached snapshot that could be stale
- Audit trail shows the timestamp and identity of the last change to each code so I can confirm the platform is current

**Success Measure:** Taxonomy Administrator can verify that the live classification pipeline is using the current approved taxonomy — by checking the audit trail and live tree view — in under 2 minutes, with 100% confidence that UI changes propagate without a manual engineering step.

**Related Features:** F2, F0
**Priority:** P0

---

## PER-04: Tom Schaefer — System Administrator

---

### JTBD-04.1: Frictionless User Provisioning

**Job Statement:**
When a new reviewer joins the team and needs immediate platform access to meet an onboarding deadline, I want to create their account, assign the correct role, and trigger email verification through the admin UI in a single workflow, so I can complete onboarding in under 3 minutes without opening an IT ticketing system.

**Current Alternatives:**
- Submits an IT ticket for each new user account — delays onboarding by 1–3 business days
- Role assignment is handled as a separate follow-up after the account is created — another round of tickets
- Has no visibility into which new accounts are awaiting email verification vs. which are fully active

**Hiring Criteria:**
- Provides an Add User dialog with fields for username, email, first/last name, role assignment (multi-select), and initial status
- Triggers an email verification message to the new account automatically upon creation — no separate step required
- Email verification is enforced before the account can be used for real classification work
- Admin UI allows viewing a list of accounts filtered by verification status so I can follow up on pending verifications
- Account creation and role assignment complete in a single form submission — no multi-step coordination

**Success Measure:** System Administrator can provision a new reviewer account — including role assignment and email verification trigger — in under 3 minutes, with zero IT tickets and zero follow-up steps required.

**Related Features:** F6, F0, F7
**Priority:** P0

---

### JTBD-04.2: Immediate Access Revocation for Departed Users

**Job Statement:**
When a reviewer or other platform user leaves the organization, I want to deactivate their account immediately through the admin UI, so I can eliminate their access within minutes of notification without creating gaps in the audit trail that references their past classification actions.

**Current Alternatives:**
- Account deactivation requires an IT ticket — access may remain active for days after departure
- Hard-deleting a user record would orphan their historical classification entries, creating audit trail gaps
- No queue of locked or inactive accounts — Tom has to remember which departing users still have active accounts

**Hiring Criteria:**
- Provides a Deactivate User action (toggle inactive — not delete) that takes effect immediately without requiring a service restart
- Deactivated accounts lose access on the next request — existing JWT is rejected
- User record and all associated audit history (classifications reviewed, overrides submitted) are preserved after deactivation
- User list is filterable by status (active / inactive) so I can audit which accounts are currently active at any time
- Deactivation action is confirmed with a dialog before execution to prevent accidental deactivation

**Success Measure:** System Administrator can deactivate a departing user's account in under 2 minutes of receiving notification — with access revoked immediately and all historical audit records intact — without submitting an IT ticket.

**Related Features:** F6, F0
**Priority:** P0

---

### JTBD-04.3: Proactive Pipeline Failure Detection

**Job Statement:**
When the classification pipeline encounters a stuck or failed record, I want to detect the problem through the pipeline monitoring dashboard before reviewers escalate it, so I can resolve it or coordinate with DevOps during business hours rather than responding to an after-hours crisis.

**Current Alternatives:**
- Has no visibility into pipeline operational issues without direct database access or log file review
- Learns about pipeline failures only when a reviewer escalates — by then the problem may have delayed multiple plans
- Cannot distinguish a transient failure from a systemic one without querying the database directly

**Hiring Criteria:**
- Pipeline monitoring page shows stage-level status (running / paused / failed), last run timestamp, and duration for each pipeline stage
- Surfaces records stuck in `PROCESSING` beyond the configurable timeout threshold — highlighted distinctly from records in normal processing
- Provides control actions (Start, Stop, Pause, Resume, stage-level Retry) so I can attempt recovery without DevOps escalation for common failures
- Pipeline event logs are accessible in a collapsible, monospaced panel so I can review what happened without database access
- Health panel shows DB connection count and queue depth so I can assess whether failures are resource-related

**Success Measure:** System Administrator detects and begins resolving a pipeline failure within 30 minutes of it occurring — with zero reliance on reviewer escalation — and can attempt a stage-level retry without requiring a database query or DevOps involvement.

**Related Features:** F4, F3, F0
**Priority:** P1

---

## PER-05: Catherine Wu — Executive / Stakeholder

---

### JTBD-05.1: Presentation-Ready Excel Reports on Demand

**Job Statement:**
When I need to present classification program results to the PCORI board or external funders, I want to receive a fully formatted Excel report that I can insert into a presentation or share directly, so I can deliver accurate, professional reporting without spending time on reformatting or reconciliation.

**Current Alternatives:**
- Receives manually assembled Excel files from the Program Manager each reporting cycle — production takes 3–4 hours
- Reports sometimes arrive with reconciliation errors from manual data aggregation across reviewer spreadsheets
- Cannot request an ad-hoc report mid-cycle if a funder asks a specific question — must wait for the next scheduled cycle

**Hiring Criteria:**
- Excel reports are available on demand — downloadable at any time without waiting for an analyst to produce them
- Exported file is formatted for direct use in presentations: column headers are human-readable, data is sorted consistently, and confidence scores are formatted as percentages
- Report includes classification volume, accuracy rate, override rate, reviewer names, and timestamps — the complete data set a funder would expect for an audit inquiry
- All figures in the report can be traced back to individual classification records — no aggregate-only rows

**Success Measure:** Executive can access a complete, presentation-ready Excel classification report — covering any date range she specifies — within 5 minutes of requesting it, with zero manual reformatting required and every figure traceable to a source record.

**Related Features:** F5, F3, F0
**Priority:** P1

---

### JTBD-05.2: Pre-Meeting Program Status Snapshot

**Job Statement:**
When I have a leadership or board meeting beginning in under an hour, I want to load a high-level dashboard showing current classification volume, accuracy trend, and override rate in a single view, so I can quickly orient myself on program status without asking the Program Manager for a briefing.

**Current Alternatives:**
- Calls or messages the Program Manager for a verbal status update before leadership meetings
- Has no real-time view — program health data is only available in the periodic Excel reports she receives
- Learns about problems at the meeting itself, with no time to prepare a response

**Hiring Criteria:**
- Dashboard KPI cards (Total Plans, Classified, Pending, Failed, Average Confidence, Override Rate) load in under 1.5 seconds
- Data is current within the last polling interval — no stale figures that misrepresent program status
- Accuracy trend and override rate charts are visible at a glance without requiring drill-down interaction
- Dashboard is accessible from a browser without requiring any admin-level permissions or configuration steps

**Success Measure:** Executive can load the dashboard and confidently characterize program status — including current override rate and whether any operational anomalies exist — within 90 seconds of opening the application.

**Related Features:** F3, F0
**Priority:** P1

---

### JTBD-05.3: Audit Traceability Confirmation

**Job Statement:**
When a funder or compliance body requests documentation of how a specific research plan was classified, I want to confirm that every classification decision is traceable to a named reviewer with a timestamp and an override reason where applicable, so I can respond to audit inquiries with confidence rather than uncertainty.

**Current Alternatives:**
- Has no central audit record — classification decisions are scattered across reviewer spreadsheets with no enforced documentation of who made each decision
- Override reasons are not systematically recorded — some reviewers add notes, others do not
- Cannot produce a complete audit package for a specific plan without manually contacting the reviewer who handled it

**Hiring Criteria:**
- Every classification record stores: plan ID, reviewer identity (`uploadedBy`, `reviewedBy`), upload timestamp, classification timestamp, AI confidence score, model version, and override reason (if overridden)
- Override reason is required — cannot be submitted as blank — ensuring complete documentation for every human correction
- Classification records are retained indefinitely (soft-delete only) so historical audit packages remain available years after the fact
- Any individual classification record can be retrieved by plan ID and exported as part of an audit package without requiring database access

**Success Measure:** Executive (or a designated auditor) can produce a complete, verifiable audit record for any classified research plan — including reviewer identity, timestamps, and override reasoning — within 5 minutes of receiving an audit inquiry, with zero dependence on individual reviewer recall.

**Related Features:** F1, F5, F0
**Priority:** P1

---

## Outcome-to-Feature Traceability

| JTBD-ID | Persona | Related Feature(s) | Expected Outcome |
|---|---|---|---|
| JTBD-01.1 | PER-01 | F1, F9, F0 | Plan classified across all 4 taxonomy dimensions in ≤5 min with confidence score displayed |
| JTBD-01.2 | PER-01 | F1, F0 | Reviewer reaches highest-priority queue items within 60 seconds of login |
| JTBD-01.3 | PER-01 | F1, F0 | Override with required reason produces an auditable record traceable to reviewer + timestamp |
| JTBD-01.4 | PER-01 | F7, F1, F0 | Zero missed NEEDS_REVIEW alerts per week; all flagged plans actioned same business day |
| JTBD-02.1 | PER-02 | F3, F4, F0 | Pipeline health visible in ≤2 min; zero operational failures undetected for >1 business day |
| JTBD-02.2 | PER-02 | F5, F3, F0 | Weekly status report generated in <15 min; zero manual aggregation steps |
| JTBD-02.3 | PER-02 | F3, F5, F0 | Every taxonomy category exceeding 15% override rate identified within a single dashboard session |
| JTBD-03.1 | PER-03 | F2, F0 | Taxonomy code added or deactivated in <5 min with immediate pipeline propagation; zero broken historical references |
| JTBD-03.2 | PER-03 | F2, F0 | Any taxonomy code located and corrected in <3 min; change reflected immediately in classification targeting |
| JTBD-03.3 | PER-03 | F2, F0 | Live classification pipeline confirmed to use current approved taxonomy in <2 min via audit trail |
| JTBD-04.1 | PER-04 | F6, F0, F7 | New reviewer account provisioned in <3 min; email verification triggered in same workflow; zero IT tickets |
| JTBD-04.2 | PER-04 | F6, F0 | Departing user deactivated in <2 min; access revoked immediately; audit history fully preserved |
| JTBD-04.3 | PER-04 | F4, F3, F0 | Pipeline failure detected within 30 min without reviewer escalation; stage-level retry available without DB access |
| JTBD-05.1 | PER-05 | F5, F3, F0 | Complete, presentation-ready Excel report available within 5 min; zero manual reformatting |
| JTBD-05.2 | PER-05 | F3, F0 | Dashboard KPIs load in <1.5 s; executive oriented on program status in <90 seconds |
| JTBD-05.3 | PER-05 | F1, F5, F0 | Complete audit record for any classified plan retrieved in <5 min; zero dependence on reviewer recall |

---

## NaC Preview

> **Note:** These are candidate Natural Acceptance Criteria. They will be refined into formal NaC and linked to user stories in STORY-MAP downstream.

| JTBD-ID | Outcome | Candidate Natural Acceptance Criterion |
|---|---|---|
| JTBD-01.1 | Plan classified in ≤5 min with confidence score | **Given** a valid PDF research plan is uploaded, **when** the async pipeline completes, **then** all four taxonomy dimensions (PCC, category, code, subcode) are populated and a confidence score between 0 and 1 is visible — within 5 minutes of upload on a standard research plan |
| JTBD-01.1 | Low-confidence plans routed to NEEDS_REVIEW | **Given** the AI confidence falls below the admin-configured threshold (default 0.75), **when** the pipeline completes, **then** the plan status is `NEEDS_REVIEW` and the reviewer is not presented with an auto-accepted classification |
| JTBD-01.2 | Queue filterable by status, date, PCC | **Given** the reviewer opens the classification list, **when** they apply a status filter and a PCC filter simultaneously, **then** only records matching both criteria are shown and the result renders in under 1.5 seconds |
| JTBD-01.3 | Override requires non-empty reason | **Given** a reviewer selects override on a classification, **when** they attempt to submit with an empty reason field, **then** the form does not submit and an inline validation error prompts them to provide a reason |
| JTBD-01.3 | Override record is auditable | **Given** a successful override is submitted, **when** an auditor retrieves the classification record, **then** `reviewedBy`, `reviewedAt`, and `overrideReason` are all populated with non-null values |
| JTBD-01.4 | In-app alert on NEEDS_REVIEW | **Given** a classification transitions to `NEEDS_REVIEW`, **when** the reviewer is logged into the application, **then** the notification bell shows an unread badge within the next polling cycle (≤30 seconds; `staleTime: 30000`) |
| JTBD-02.1 | Dashboard KPIs load in <1.5 s | **Given** the Program Manager opens the dashboard, **when** the page fully renders, **then** all KPI cards display current values within 1.5 seconds of navigation |
| JTBD-02.1 | Stuck records surface on dashboard | **Given** a record has been in `PROCESSING` status beyond the configured timeout, **when** the dashboard is loaded or refreshed, **then** the stuck record count is non-zero and the affected records are visually highlighted |
| JTBD-02.2 | One-click Excel export completes | **Given** the Program Manager clicks the export button with a selected date range, **when** the export is generated, **then** an `.xlsx` file is downloaded to the browser within 10 seconds for up to 1,000 records |
| JTBD-02.2 | Export includes required columns | **Given** a downloaded Excel report, **when** the file is opened, **then** it contains columns for plan ID, title, PCC, taxonomy category/code/subcode, confidence score, status, reviewer name, upload date, and override reason |
| JTBD-02.3 | Category override rate visible on dashboard | **Given** the Program Manager views the category accuracy chart, **when** a taxonomy category has an override rate exceeding 15%, **then** that category is visually highlighted to distinguish it from categories within acceptable bounds |
| JTBD-03.1 | New taxonomy code added without engineering step | **Given** the Taxonomy Admin submits a new category with code, name, description, level, and parent assignment, **when** the form is saved, **then** the new code appears in the live taxonomy tree and is available as a classification target — with no deployment or service restart required |
| JTBD-03.1 | Deactivated code excluded from targeting | **Given** a taxonomy code is deactivated by the admin, **when** the classification pipeline assigns categories to the next uploaded plan, **then** the deactivated code is not assigned, but historical records referencing that code retain their original classification value |
| JTBD-03.2 | Taxonomy search returns results in real time | **Given** the admin types a code or keyword in the taxonomy search field, **when** at least one character is entered, **then** matching results appear within 500 milliseconds without requiring a form submission |
| JTBD-03.3 | Audit trail available for taxonomy changes | **Given** the admin views a taxonomy code's detail, **when** they check the audit history, **then** each past change shows the action type, the actor's identity, and a timestamp |
| JTBD-04.1 | Account provisioned in single workflow | **Given** the admin completes the Add User form with all required fields and submits, **when** the account is created, **then** the user record is saved, the selected role is assigned, and a verification email is dispatched — all in one step with no follow-up action required from the admin |
| JTBD-04.2 | Deactivation revokes access immediately | **Given** the admin deactivates a user account, **when** that user's next API request is received (including with a previously valid JWT), **then** the server returns a `401 Unauthorized` response and the user cannot perform any authenticated action |
| JTBD-04.3 | Stuck records visible on pipeline monitor | **Given** the System Admin opens the pipeline monitoring page, **when** records are stuck in `PROCESSING` beyond the configured timeout, **then** those records are listed with a visual highlight and a stage-level retry button is available for each |
| JTBD-05.1 | Report available without analyst | **Given** the Executive (or Program Manager) navigates to the reports page, **when** they specify a date range and click Generate, **then** a formatted `.xlsx` file downloads within 10 seconds containing all classification records for that period |
| JTBD-05.2 | Dashboard loads under 1.5 s | **Given** the Executive opens the dashboard in a supported browser, **when** the page fully renders, **then** all visible KPI cards show data values within 1.5 seconds (measured from navigation start) |
| JTBD-05.3 | Audit package retrievable by plan ID | **Given** an auditor specifies a plan ID, **when** they retrieve that classification record, **then** `uploadedBy`, `reviewedBy`, `uploadedAt`, `reviewedAt`, `confidence`, `modelVersion`, and `overrideReason` (if applicable) are all present and non-null for records that have completed review |

---

*JTBD v1.0 — PCORI Research Analytics Platform*
*Generated: 2026-05-20 | Derived from PERSONAS-PCORI.md v1.0 + PRD-PCORI.md v1.0*
