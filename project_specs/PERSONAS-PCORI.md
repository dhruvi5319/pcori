# Persona Profiles
## PCORI Research Analytics Platform

| Field | Value |
|---|---|
| **Product Name** | PCORI Research Analytics Platform |
| **Project Acronym** | PCORI |
| **Document Version** | 1.0 |
| **Document Type** | Persona Profiles |
| **Date** | 2026-05-20 |
| **Related PRD** | `project_specs/PRD-PCORI.md` v1.0 |
| **Derived From** | PRD §4 Target Users & Personas; PRD §2 Problem Statement; PRD §6 Feature Requirements; PRD §8 Success Metrics |

---

## Persona Summary

| ID | Name | Role Title | Primary Goal |
|---|---|---|---|
| **PER-01** | Maya Okonkwo | Research Reviewer | Upload research plans and confirm or correct AI taxonomy classifications with confidence |
| **PER-02** | David Reyes | Program Manager | Monitor portfolio health, track classification throughput and accuracy, and generate reports without analyst help |
| **PER-03** | Priya Nair | Taxonomy Administrator | Maintain the PCORI/ICD-10 taxonomy as a trusted, version-controlled source of truth |
| **PER-04** | Tom Schaefer | System Administrator | Provision and manage user accounts and roles without IT intervention |
| **PER-05** | Catherine Wu | Executive / Stakeholder | Access high-level KPIs and polished Excel reports to assess program status |

---

## PER-01: Maya Okonkwo

**Role Title:** Research Reviewer  
**Representative Name:** Maya Okonkwo, Senior Research Reviewer

---

**Role & Context:**

Maya is a senior research reviewer at PCORI, responsible for reading and classifying incoming research plan PDFs against the PCORI taxonomy. She manages a queue of 15–25 plans per week, each requiring assignment across four taxonomy dimensions: Primary Clinical Condition, category, code, and subcode. Before this platform, Maya spent 45–60 minutes per plan reading the PDF, cross-referencing ICD-10 codes in a separate spreadsheet, and manually entering taxonomy labels into a shared tracking workbook. Consistency was a persistent problem — her labels sometimes diverged from colleagues reviewing similar plans, and there was no record of why decisions were made.

Maya works primarily at a desktop workstation with dual monitors. She is comfortable with web applications and productivity software but does not use command-line tools. She is skeptical of AI tools that feel like black boxes — she wants to see the confidence level, understand why the system made a recommendation, and have full control to override it when her expert judgment differs. She reports to a Program Manager and coordinates informally with 2–3 other reviewers on the team.

**Goals:**

- Classify research plans in minutes, not hours, by letting the AI handle the initial taxonomy assignment (F1)
- Quickly understand AI confidence level and act decisively — accept the classification or override it with documented reasoning (F1)
- Search and filter her classification queue by status, date, and PCC so she can triage efficiently (F1)
- Download original PDF research plans for reference when reviewing borderline classifications (F9)
- Receive in-app notifications when a classification completes so she can review it without polling the UI (F7)

**Pain Points (from PRD §2):**

- Spends ~1 hour per plan on manual taxonomy lookup and entry — the primary speed bottleneck
- No consistency check between reviewers — similar plans get different labels, degrading aggregate analytics
- No record of why a classification decision was made, making audits difficult
- Has to check multiple spreadsheets to track which plans are assigned, in progress, or complete
- No alert when a classification fails or needs human attention — she must remember to check manually

**Technical Expertise:** Intermediate — fluent with web apps and Excel; comfortable with structured workflows; avoids command-line tools and unfamiliar interfaces; needs clear confidence indicators and actionable UI patterns (not raw model outputs).

**Top Tasks:**

1. Upload a PDF research plan and monitor classification status (daily, critical)
2. Review AI-generated taxonomy classification and decide to accept or override (daily, critical)
3. Submit an override with a required reason when AI classification is incorrect (weekly, high)
4. Search and filter the classification queue by status, date range, and PCC (daily, high)
5. Download the original PDF for reference during borderline classification review (as-needed, medium)

**Success Criteria:**

- Can upload a plan and receive a completed classification in ≤ 5 minutes (PRD §8: avg. turnaround target)
- Override rate stays below 15% of classified plans, indicating AI accuracy meets expectations (PRD §8)
- Can generate an audit-ready record of any classification decision (who reviewed it, when, why it was overridden) in under 2 minutes
- Zero missed `NEEDS_REVIEW` alerts per week — all flagged plans are actioned before the next reporting cycle

---

## PER-02: David Reyes

**Role Title:** Program Manager  
**Representative Name:** David Reyes, Research Portfolio Program Manager

---

**Role & Context:**

David oversees a portfolio of PCORI-funded research plans and is accountable to executive leadership for reporting on classification volume, accuracy, and reviewer throughput. He manages 3–5 reviewers and is responsible for ensuring the classification pipeline is functioning and that weekly and quarterly reports are delivered on time. Before this platform, David produced status reports by aggregating reviewer spreadsheets manually — a 3–4 hour process each reporting cycle. He had no real-time visibility into pipeline health between reports.

David works from a laptop and attends frequent stakeholder meetings where he needs to pull up current KPIs quickly. He is proficient with Excel and data-heavy web dashboards. He does not perform individual plan classifications himself, but he needs to understand accuracy trends, identify underperforming reviewers or taxonomy categories, and escalate pipeline failures before they become reporting crises. He reports to executive leadership and is the primary consumer of dashboard analytics.

**Goals:**

- Access a live dashboard showing classification volume, accuracy trend, override rate, and pipeline status at a glance (F3)
- Generate Excel reports of classification data in one click, without waiting for analyst support (F5)
- Monitor the classification pipeline health — catch stuck or failed records before they delay reporting (F4)
- Identify high-override taxonomy categories that may indicate AI miscalibration or taxonomy ambiguity (F3)
- Configure dashboard widgets to surface the KPIs most relevant to his reporting cadence (F3)

**Pain Points (from PRD §2):**

- No real-time view of classification throughput, accuracy, or override rates — program health is invisible between reporting cycles
- Excel reports produced by hand each cycle require 3–4 hours of analyst time for what should be a one-click operation
- No visibility into pipeline failures until a reviewer escalates — problems compound silently
- Aggregate analytics are unreliable because different reviewers label similar plans differently
- Cannot easily identify which taxonomy categories have high override rates without manually cross-referencing spreadsheets

**Technical Expertise:** Intermediate-Advanced — power user of Excel and dashboard tools; comfortable with complex web UIs; does not need to understand system internals but expects data to be accurate, current, and explainable.

**Top Tasks:**

1. Review dashboard KPI cards (total plans, classified, pending, failed, avg. confidence) at the start of each workday (daily, critical)
2. Generate and download a one-click Excel export of this week's classified plans (weekly, critical)
3. Review accuracy trend and override rate charts to identify anomalies (weekly, high)
4. Check pipeline monitoring status for stuck or failed records (daily, high)
5. Build an ad-hoc report with custom column selection for a specific executive request (as-needed, medium)

**Success Criteria:**

- Can produce a complete weekly status report in under 15 minutes — down from 3–4 hours (PRD §8: Excel export target)
- Dashboard initial load under 1.5 seconds; date-range filter cascades to all KPI cards and charts simultaneously (PRD §7 NFR)
- Override rate visible in real time; can identify categories with > 15% override rate before the next reporting cycle
- Zero unreported pipeline failures per week — stuck records surface on dashboard before they delay downstream reporting

---

## PER-03: Priya Nair

**Role Title:** Taxonomy Administrator  
**Representative Name:** Priya Nair, PCORI Taxonomy and Data Standards Administrator

---

**Role & Context:**

Priya is the custodian of the PCORI/ICD-10 taxonomy — the classification target that the AI pipeline uses to label every research plan. She is responsible for keeping taxonomy codes current, adding new categories when PCORI's research portfolio evolves, deprecating obsolete codes without breaking historical classification records, and ensuring the taxonomy tree is structured correctly for hierarchical display and classification targeting. She coordinates with external PCORI data standards teams to incorporate taxonomy updates.

Priya works from a desktop and primarily interacts with the platform through the taxonomy management UI. She is technically proficient — comfortable with structured data, hierarchical trees, and data governance workflows — but she is not an engineer. She does not write SQL or manage migrations directly; she expects the platform UI to reflect changes immediately and reliably. Her work is foundational: classification cannot produce meaningful results without an accurate, current taxonomy, so errors in her domain propagate downstream to every reviewer, every report, and every executive dashboard.

**Goals:**

- Perform full CRUD on taxonomy categories (add new codes, edit descriptions, correct hierarchy structure) through a clear, hierarchical UI (F2)
- Deprecate obsolete codes without deleting them — activate/deactivate lifecycle preserves historical classification references (F2)
- Search taxonomy by code, name, or description text to quickly locate the correct category for editing (F2)
- View the full hierarchical tree in a two-pane UI that mirrors the PCORI/ICD-10 structure (F2)
- Trust that taxonomy seed data from `R__seed_taxonomy.sql` is loaded consistently and updates automatically when she makes approved changes (F2)

**Pain Points (from PRD §2):**

- No single authoritative source of PCORI taxonomy — codes currently live across multiple documents and spreadsheets with inconsistent versioning
- Deprecating an old code risks breaking historical classifications if hard-deletes are used — needs soft lifecycle management
- No search capability across the taxonomy — finding a specific code requires scrolling large flat lists
- Taxonomy updates are not reflected in the classification pipeline until manually coordinated with engineering
- No audit trail of when a code was added, edited, or deprecated and by whom

**Technical Expertise:** Intermediate — proficient with structured data and web UIs; comfortable with hierarchical data models; does not write code or manage database migrations; expects changes made in the UI to be immediately reflected in classification targeting.

**Top Tasks:**

1. Add a new taxonomy category with code, name, description, level, and parent assignment (as-needed, critical)
2. Deactivate an obsolete taxonomy code (not delete) when PCORI deprecates a category (as-needed, critical)
3. Search taxonomy by code or name to locate a specific category for editing (weekly, high)
4. Browse the full hierarchical taxonomy tree to verify structure and parent-child relationships (weekly, high)
5. Edit an existing category's description or display order to align with updated PCORI data standards (monthly, medium)

**Success Criteria:**

- Can add or deactivate a taxonomy code in under 5 minutes with no engineering intervention
- Hierarchical tree view renders correctly after any taxonomy change — no stale state
- Deactivated codes are excluded from classification targeting but preserved in historical classification records
- Full audit trail available: every taxonomy CRUD action shows who made it and when

---

## PER-04: Tom Schaefer

**Role Title:** System Administrator  
**Representative Name:** Tom Schaefer, Platform System Administrator

---

**Role & Context:**

Tom is the internal system administrator responsible for provisioning user accounts, assigning roles, and managing access control for the PCORI Research Analytics Platform. He is the primary point of contact when a new reviewer needs to be onboarded, an existing user changes roles, or a departing employee's account needs to be deactivated. He also monitors system health via the actuator endpoint and coordinates with DevOps on deployment and infrastructure issues.

Tom has a technical background — comfortable with administrative web UIs, configuration files, and system health dashboards — but he does not write application code. He works from a laptop and expects the user management interface to be efficient: minimal clicks to provision a new user, clear role assignment, and immediate account status changes. He is security-conscious and understands that user accounts must be deactivated (not deleted) to preserve audit trail integrity. He also monitors the classification pipeline indirectly via the pipeline monitoring feature when reviewers escalate operational issues.

**Goals:**

- Provision new user accounts, assign roles, and activate accounts through the admin UI without IT ticketing (F6)
- Deactivate departing users' accounts immediately, without hard-deleting records that may be referenced in audit trails (F6)
- Search and filter the user list by role, status, or email to quickly locate and manage specific accounts (F6)
- Enforce email verification before any new reviewer account is activated for real use (F0)
- Monitor pipeline operational health and surface issues to DevOps before they impact reviewers (F4)

**Pain Points (from PRD §2):**

- User provisioning currently requires IT ticket-based workflows that delay onboarding by days
- No self-service account management — every role change or deactivation goes through a separate process
- No audit trail of who created or modified user accounts — accountability gaps in access control
- Account lockout after failed login attempts requires manual admin unlock — no visible queue of locked accounts
- No visibility into pipeline operational issues without direct database access

**Technical Expertise:** Advanced — comfortable with web-based admin UIs, system configuration, and health monitoring dashboards; understands RBAC concepts and access control patterns; does not write application code but reads system logs and health metrics fluently.

**Top Tasks:**

1. Create a new user account with username, email, role assignment, and send email verification (as-needed, critical)
2. Deactivate a departing user's account (toggle inactive — not delete) (as-needed, critical)
3. Search the user list by role or email to locate and edit a specific account (weekly, high)
4. Assign or reassign roles to an existing user when their responsibilities change (as-needed, high)
5. Check pipeline health status and review stuck or failed records when escalated by a reviewer (as-needed, medium)

**Success Criteria:**

- Can provision a new reviewer account and trigger email verification in under 3 minutes
- Can deactivate a departing user's account immediately — no IT ticket, no data loss
- Full audit trail available: every user account change shows who performed it and when
- Zero orphaned active accounts for departed users — deactivation process is the standard, not the exception

---

## PER-05: Catherine Wu

**Role Title:** Executive / Stakeholder  
**Representative Name:** Catherine Wu, VP of Research Portfolio, PCORI

---

**Role & Context:**

Catherine is a senior executive at PCORI who oversees the research portfolio at a strategic level. She consumes classification program status as an input to funding, resourcing, and compliance decisions — she does not perform classifications or manage the platform herself. Her primary interaction with the platform is through polished Excel reports that program managers share with her, and occasionally through a high-level dashboard view when she needs a quick status check in a leadership meeting.

Catherine's time is limited and she operates on a monthly and quarterly cadence rather than daily. She has low tolerance for data that is inconsistent, unexplained, or requires manual reconciliation. She needs confidence that the numbers she presents to PCORI leadership and external funders are accurate, auditable, and reproducible. She is comfortable with Excel as a presentation and analysis tool; she does not interact with the platform UI in depth beyond the executive summary dashboard.

**Goals:**

- Receive polished, well-formatted Excel reports showing classification volume, accuracy, and override rates — ready to present without manual reformatting (F5)
- Access a high-level dashboard KPI view showing program status at a glance when needed for a leadership meeting (F3)
- Trust that all classification data is auditable — every decision traceable to a named reviewer with a timestamp (F0, F1)
- Understand AI confidence and override rate trends to assess whether the classification program is operating within acceptable parameters (F3)

**Pain Points (from PRD §2):**

- Excel reports are produced manually each cycle, arriving late and sometimes containing reconciliation errors
- No real-time visibility into program health — she learns about problems only when they appear in periodic reports
- Aggregate analytics are inconsistent because different reviewers label similar plans differently — she cannot rely on cross-period comparisons
- No audit trail to satisfy external funder or compliance inquiries about who classified what and when

**Technical Expertise:** Basic-Intermediate — highly proficient with Excel as a presentation and analysis tool; comfortable viewing web dashboards; does not use or need access to platform configuration or admin features; expects data to be self-explanatory and visually polished.

**Top Tasks:**

1. Review a downloaded Excel classification report for quarterly board presentation (monthly, critical)
2. Access the executive KPI dashboard for a real-time program status snapshot before a leadership meeting (as-needed, high)
3. Verify that classification volume, accuracy, and override rate figures are consistent and auditable (quarterly, high)
4. Identify accuracy or volume trends that warrant program-level intervention or resource reallocation (quarterly, medium)

**Success Criteria:**

- Excel reports are available on demand, formatted for direct use in presentations — no manual reformatting required
- Dashboard KPI cards load in under 1.5 seconds; data is current within the last polling interval
- All figures in reports can be traced to individual classification records with reviewer names and timestamps
- Quarterly override rate stays below 15%, confirming AI classification quality is meeting program targets (PRD §8)

---

## Persona Relationships

| Persona | Interacts With | Nature of Interaction |
|---|---|---|
| **PER-01 Reviewer** | PER-02 Program Manager | Reviewers' classification output feeds PM dashboards; PMs escalate high override rates back to reviewers |
| **PER-01 Reviewer** | PER-03 Taxonomy Admin | Reviewers surface ambiguous or missing taxonomy codes; Taxonomy Admin updates the taxonomy accordingly |
| **PER-01 Reviewer** | PER-04 System Admin | System Admin provisions reviewer accounts and resolves account lockout issues |
| **PER-02 Program Manager** | PER-05 Executive | Program Manager generates reports and dashboard summaries consumed by the Executive |
| **PER-02 Program Manager** | PER-04 System Admin | Program Manager escalates pipeline operational issues to System Admin for resolution |
| **PER-03 Taxonomy Admin** | PER-04 System Admin | Taxonomy Admin may need System Admin for account issues; both operate in admin-access areas of the platform |
| **PER-04 System Admin** | All Personas | System Admin provisions, deactivates, and role-assigns accounts for all other personas |
| **PER-05 Executive** | PER-02 Program Manager | Executive receives reports from Program Manager; may request ad-hoc reports for funding decisions |

---

## Feature-Persona Matrix

| Feature | Description | PER-01 Reviewer | PER-02 Prog. Mgr. | PER-03 Tax. Admin | PER-04 Sys. Admin | PER-05 Executive |
|---|---|---|---|---|---|---|
| **F0** | Authentication & Authorization | Primary | Primary | Primary | Primary | Primary |
| **F1** | Research Plan Upload & Classification | **Primary** | Secondary | None | None | None |
| **F2** | Taxonomy Management | Secondary | None | **Primary** | None | None |
| **F3** | Dashboards & Analytics | Secondary | **Primary** | None | Secondary | Secondary |
| **F4** | Pipeline Monitoring | None | Secondary | None | **Primary** | None |
| **F5** | Reports | None | **Primary** | None | None | Secondary |
| **F6** | User Management (Admin) | None | None | None | **Primary** | None |
| **F7** | Notifications | **Primary** | Secondary | Secondary | **Primary** | None |
| **F8** | Help Center | **Primary** | Secondary | Secondary | Secondary | None |
| **F9** | File Management (S3 Storage) | Secondary | None | None | Secondary | None |

**Matrix Key:**
- **Primary** — this persona is the primary user and driver of this feature's requirements
- Secondary — this persona uses or benefits from this feature but is not the primary driver
- None — this feature is not relevant to this persona's workflow

---

## Notes on Persona Prioritization

**PER-01 (Research Reviewer)** and **PER-02 (Program Manager)** are the two personas that drive the platform's core value proposition. F1 (Upload & Classification) is designed entirely around PER-01's daily workflow; F3 (Dashboards & Analytics) and F5 (Reports) are designed entirely around PER-02's reporting cadence. All other features are either foundational (F0 Auth, F9 Storage) or support functions (F2 Taxonomy, F6 User Mgmt, F4 Pipeline Monitoring).

**PER-05 (Executive)** is a downstream consumer of value created by PER-01 and PER-02. Her primary touchpoint is the Excel report (F5) — she does not interact with the platform's operational features. Design decisions for F5 should treat Catherine's requirements (presentation-ready formatting, audit traceability) as the final quality bar.

**PER-03 (Taxonomy Admin)** and **PER-04 (System Admin)** are enablers. Their work is foundational but infrequent — classification cannot target meaningful codes without PER-03's taxonomy, and reviewers cannot access the platform without PER-04's provisioning. These personas have lower interaction frequency but high impact when their tasks fail.

---

*PERSONAS v1.0 — PCORI Research Analytics Platform*
*Generated: 2026-05-20 | Derived from PRD-PCORI.md v1.0 + Research SUMMARY.md*
