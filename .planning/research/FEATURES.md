# Feature Research

**Domain:** Healthcare Research Analytics — AI-assisted PDF classification, audit trail, dashboards, Excel reporting (PCORI taxonomy)
**Researched:** 2026-05-20
**Confidence:** HIGH (PRD is authoritative source; supplemented by domain expertise on IDP platforms, healthcare analytics, and AI workflow systems)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or untrustworthy.

#### AI Classification Workflow Dimension

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Document upload with drag-and-drop | Every modern data ingestion tool has it; file picker alone feels archaic | LOW | PDF-only; enforce MIME validation server-side (Tika), not just client extension check |
| Upload progress indicator | Users uploading multi-page PDFs will abandon without feedback | LOW | Deterministic progress during multipart upload; indeterminate spinner during classification |
| Automated classification result display | The entire value proposition; no result = no product | HIGH | PCC + taxonomy category/code/subcode + confidence score; structured layout, not raw JSON |
| Confidence score visibility | Every IDP platform shows this; users need to know when to trust the AI | LOW | Display as percentage + visual indicator (color band or gauge); threshold-based highlighting |
| Manual override with reason capture | Without this, errors cannot be corrected; auditors require it | MEDIUM | Side-by-side view of AI result vs. human correction; free-text reason field required |
| Classification status lifecycle | Users need to know what stage a document is in (Pending → Processing → Classified / Failed) | LOW | Status badges with clear semantics; PROCESSING should pulse to indicate activity |
| Failed classification retry | Transient model errors are common; retry without re-upload is expected | LOW | Retry button on failed records; logs why it failed |
| Search, filter, and sort on classification list | Any data table in an enterprise tool must be filterable | MEDIUM | Filter by status, date range, PCC; free-text search on title/plan ID; sortable columns |
| Paginated results | Users know to expect pagination on large lists | LOW | Default page size 25; page size selector; total count shown |
| Unique document identifiers | Every document management system assigns IDs; enables reference and auditing | LOW | `RP-YYYY-###` format as specified in PRD; auto-generated, immutable |

#### Healthcare Analytics / Reporting Dimension

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Role-based access control | Every healthcare data tool gates features by role; admin-only areas expected | MEDIUM | Reviewer, Program Manager, Taxonomy Admin, System Admin, Executive roles; gated by permissions entity |
| JWT authentication with session expiry | Standard security expectation; 401 redirect to login is table stakes | LOW | 1-hour token default; auto-redirect on 401; "Session expired" toast |
| Account lockout after failed logins | Expected in any healthcare-adjacent system; HIPAA-aligned control | LOW | Configurable threshold; unlock via admin or TTL-based auto-unlock |
| Password reset via email | Users forget passwords; no reset = help desk calls | LOW | Reset token with configurable TTL; email via SMTP |
| KPI dashboard with status counts | Every ops/analytics tool shows "what's happening now" on first load | MEDIUM | Total plans, classified, processing, failed, needs-review; loading skeletons required |
| Recent activity feed | Operations teams monitor recent throughput; missing = "is anything working?" anxiety | LOW | Recent N classifications with Plan ID, title, status, confidence; sorted by date |
| Date-range filtering on analytics | Standard analytics UX; without it, charts are not actionable | MEDIUM | Applies to all trend charts; date picker component |
| Excel export | Healthcare program managers live in Excel; no export = reporting dead end | MEDIUM | `.xlsx` format (not `.xls`); full classification dataset; Content-Disposition header for download |
| Audit trail on every classification | Required in any research data system for reproducibility and compliance | MEDIUM | `uploadedBy`, `uploadedAt`, `reviewedBy`, `reviewedAt`, `overrideReason`, `modelVersion` — all persisted |
| User management (admin CRUD) | Admins expect to manage users without IT tickets | LOW | Add/edit/deactivate users; role assignment; search/filter |
| Email notifications for key events | Users expect to be notified when their upload completes or fails | MEDIUM | In-app notification bell + per-user preferences; email for critical events (classification failure, pipeline down) |

#### Taxonomy Management Dimension

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hierarchical taxonomy tree view | Medical coding tools always present hierarchies visually; flat list is unusable for ICD-10 depth | MEDIUM | Two-pane: collapsible tree left, edit form right; search to jump to node |
| Taxonomy CRUD with activate/deactivate | Codes change over time; hard deletion creates referential integrity problems | MEDIUM | Soft activate/deactivate; parent-child relationship; no orphan codes |
| Taxonomy search | Taxonomy administrators expect to find a code by name or code string quickly | LOW | Search by code, name, or description text |

---

### Differentiators (Competitive Advantage)

Features that set the PCORI platform apart. Not required in generic IDP tools, but highly valued in this specific context.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| PCORI-specific multi-dimensional classification | Generic document classifiers output a single label; this platform classifies across PCC + taxonomy category + code + subcode simultaneously | HIGH | Requires structured JSON output from LLM; maps to `TaxonomyCategory` hierarchy; the core IP of the platform |
| Structured extraction of research plan fields | Beyond taxonomy codes, extracting population, intervention, comparator, primary/secondary outcomes (PICO framework) from PDF text | HIGH | This mirrors systematic review methodologies; transforms raw PDFs into structured research summaries without human transcription |
| Confidence-threshold-based NEEDS_REVIEW routing | Rather than always requiring human review or never requiring it, the system auto-escalates low-confidence classifications | MEDIUM | Configurable threshold; "NEEDS_REVIEW" status with amber badge; ties directly into reviewer workload management |
| Per-user dashboard widget configuration | Operations leaders want customized views; generic dashboards get ignored | HIGH | Persisted widget layout per user (`DashboardConfiguration` entity); allows each persona to see what matters to them |
| Model version tracking on every classification | Research data requires reproducibility; knowing *which model* produced a classification is critical for audits and drift detection | LOW | `modelVersion` stored on every `Classification` record; enables before/after comparison when model changes |
| Override rate analytics | Knowing *why* humans override AI is the feedback loop that improves the system | MEDIUM | Override table with reasons on Analytics page; trend over time; categorizable by taxonomy code; input for model improvement |
| Accuracy trend over time | Shows whether the model is improving or degrading; standard MLOps visibility that generic IDP platforms don't expose to users | MEDIUM | Line chart of accuracy % over date range; requires ground truth (human-confirmed) vs. AI prediction |
| Pipeline monitoring with stage-level control | Gives ops teams visibility and control over the automated workflow; not typical in end-user analytics tools | HIGH | Start/stop/pause/resume; stage-level retry; logs; DB health — this is an ops console embedded in a user tool |
| Category-level accuracy breakdown | Shows *which* PCORI categories the model handles well vs. poorly; enables targeted reviewer attention | MEDIUM | Bar chart per PCC/taxonomy category; requires classification + review outcome data |
| Confidence distribution histogram | Shows the spread of AI confidence; a bimodal distribution (lots of high + lots of low confidence) suggests model weakness in middle categories | LOW | Histogram chart; pairs with threshold configuration decisions |
| Reusable report templates with saved filter configs | Program managers run the same reports each cycle; templates eliminate repeated manual configuration | MEDIUM | Named templates; column selection; filter presets; one-click re-run |
| Ad-hoc report builder | Stakeholders occasionally need custom cuts of data; builder without IT involvement | HIGH | Column selector, filter builder, preview, generate Excel; flexible but bounded by available classification fields |
| Help center with article search | Internal tools rarely have inline help; a searchable knowledge base reduces support burden in a tool with complex taxonomy workflows | MEDIUM | Markdown articles, FAQ accordion, feedback widget; browse + search; this is a product differentiator vs. "email IT" |
| Keyword-based classification fallback | Allows the platform to function before ML model integration is complete; graceful degradation is not common in IDP tools | MEDIUM | Implemented as `ClassificationStrategy` interface; activated when ML unavailable or confidence below threshold |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like good ideas but create disproportionate complexity, cost, or risk for this platform at this stage.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time WebSocket classification updates | "I want to see progress live" | WebSocket infrastructure (connection management, reconnect logic, state sync) is substantial; polling every 5-10 seconds gives 95% of the UX benefit for 10% of the complexity; PRD explicitly defers to v2+ | HTTP polling with TanStack Query's `refetchInterval`; status badge updates on poll; good enough for classification latency of <2 min |
| Bulk SFTP batch upload | "We have hundreds of PDFs to process" | SFTP adds an entirely separate attack surface and infrastructure component; file watching, error handling, and state management are complex; scope is massively larger than web upload | Batch upload via web UI (multi-file select already in PRD as "Batch Upload" CTA); can process N files sequentially through existing pipeline |
| SSO / SAML / OIDC for v1 | "Our org uses Okta" | SAML/OIDC integration requires coordination with identity provider admins, metadata exchange, assertion mapping, and session lifecycle management; adds 2-4 weeks of complexity to auth; v1 user base is small and controlled | Email/password JWT for v1; PRD explicitly defers SSO to v2+; plan schema to not conflict with future SSO (don't embed auth decisions in domain data) |
| Custom ML model training UI | "We want to retrain the model on our data" | Model training UI (data labeling, training run management, evaluation, deployment) is a separate product; implementing it would double project scope; the classification quality problem is better solved by override feedback loops | Store override data in structured format; export for offline retraining; plug improved model back in via `ClassificationStrategy` interface; no in-app training UI needed |
| Multi-tenant / multi-organization | "Can we share this with other PCORI partners?" | Multi-tenancy requires data isolation at every layer (DB row security or schema separation, file storage namespacing, user scoping), multiplies security review surface, and fundamentally changes the auth model | Single-tenant v1; multi-tenant is a v2+ architectural decision that should be designed in from scratch if needed, not retrofitted |
| Real-time collaborative annotation | "Two reviewers should be able to edit the same plan at once" | Operational transformation or CRDT-based collaboration is extremely complex; conflict resolution logic for taxonomy field overrides is non-trivial; PCORI workflow is sequential (AI classifies → reviewer approves/overrides) by design | Sequential workflow: one reviewer owns an override at a time; status lock (PROCESSING, IN_REVIEW states) prevents concurrent edits |
| PDF in-browser preview / annotation | "Show the PDF next to the classification so I don't have to open another tab" | PDF rendering in browser (via pdf.js or iframe) adds significant bundle weight and complexity; annotation layers (highlights, comments) are even more complex; majority of users can open PDFs in their PDF reader | Show extracted text snippets from relevant PDF sections next to classification fields; link to stored PDF for full review; avoids pdf.js dependency entirely |
| Advanced model drift detection / A/B testing | "Alert me when the model performance drops" | Drift detection requires baseline establishment, statistical significance testing, and alert infrastructure; A/B testing requires traffic splitting, experiment tracking, and result analysis; these are MLOps capabilities, not analytics features | Track accuracy trend on Analytics page; model performance KPI cards (precision/recall/F1); ops team monitors manually; automated drift detection is v2+ |
| Blockchain-based immutable audit trail | "For regulatory compliance, we need tamper-proof records" | Blockchain adds immense operational complexity for marginal trust gain over database-level audit controls; no healthcare regulator requires blockchain for research classification audit trails | PostgreSQL with soft-delete + `createdAt`/`updatedAt` timestamps + `uploadedBy`/`reviewedBy` fields + application-level append-only audit events; functionally equivalent for compliance purposes with zero blockchain complexity |
| Push email notifications for every classification | "Email me when every plan is classified" | Classification volume at scale creates email fatigue and deliverability risk (rate limiting, spam filters); users stop reading → notifications become noise | In-app notification bell (implemented); email only for critical events (pipeline failure, account-level alerts); per-user preference to opt into email for personal uploads; aggregate digest rather than per-event emails |

---

## Feature Dependencies

```
Authentication (FR-1)
    └──requires──> All Protected Routes (everything else)
                       └──requires──> JWT middleware on every /api/** endpoint

PDF Upload (FR-2.1)
    └──requires──> File Storage / S3 (FR-10)
                       └──requires──> Object storage config (env-driven)

Text Extraction (FR-2.2)
    └──requires──> PDF Upload (FR-2.1)
                       └──unlocks──> Classification Engine (FR-2.3+)

Classification Engine (FR-2.3)
    └──requires──> Text Extraction (FR-2.2)
    └──requires──> Taxonomy (FR-3) — must have categories to classify into
    └──produces──> Classification Record (for all downstream features)

Manual Override (FR-2.6)
    └──requires──> Classification Record exists (FR-2.3+)
    └──requires──> Override reason captured (audit requirement)

Taxonomy CRUD (FR-3)
    └──required by──> Classification Engine (FR-2.3) — taxonomy is the target label set
    └──required by──> Analytics (FR-4) — category-level breakdowns require taxonomy data

Dashboard KPIs (FR-4.1–4.3)
    └──requires──> Classification Records (FR-2)
    └──requires──> DashboardMetric time-series records

Analytics Charts (FR-4.4)
    └──requires──> Classification Records with reviewedBy/override data (FR-2.6)
    └──requires──> Sufficient data volume (accuracy trends meaningless with <50 records)

Pipeline Monitoring (FR-5)
    └──requires──> Classification pipeline to exist (FR-2.3)
    └──independent of──> User-facing classification review UI

Excel Reports (FR-6)
    └──requires──> Classification Records (FR-2)
    └──requires──> ReportConfiguration entity (FR-6.3)

Ad-hoc Report Builder (FR-6.4)
    └──requires──> Basic Excel export working (FR-6.1)
    └──enhances──> Report Templates (FR-6.3)

User Management (FR-7)
    └──requires──> Auth + RBAC (FR-1)
    └──requires by──> All user-scoped features (dashboards, notifications, preferences)

Notifications (FR-8)
    └──requires──> User entity (FR-7)
    └──requires──> Classification events (FR-2)
    └──requires──> Pipeline events (FR-5)

Help Center (FR-9)
    └──independent of──> All other features (pure content delivery)
    └──can be stubbed──> with placeholder articles until content is authored

File Management (FR-10)
    └──requires──> Object storage configured (S3/compatible)
    └──required by──> PDF Upload (FR-2.1)

Keyword Fallback (classification strategy)
    └──independent of──> ML model API
    └──blocks nothing──> can ship Phase 2 without ML model
    └──replaced by──> ML ClassificationStrategy in Phase 5

Model Performance Metrics (FR-4.4 model-performance)
    └──requires──> ML model producing precision/recall/F1
    └──requires──> Ground truth comparison data
    └──deferred if──> keyword fallback is active (no meaningful model metrics)
```

### Dependency Notes

- **Taxonomy must ship before Classification Engine:** The engine classifies *into* taxonomy codes; without seed data the classifier has no target space. Taxonomy CRUD (FR-3) must be in Phase 2 alongside FR-2.
- **Classification Records unlock everything downstream:** Dashboards, analytics, reports, notifications, and override workflows all consume classification data. Phase 2 must produce a working classification record before Phase 3 (insights) is meaningful.
- **Override data is required for accuracy analytics:** The accuracy trend chart needs ground truth (human-confirmed correct classifications) vs. AI output. Accuracy analytics in Phase 3 only have real data once overrides accumulate; Phase 3 analytics UI can ship with placeholder/stub data in early iteration.
- **ML model is a Phase 5 concern, not Phase 2:** The keyword fallback strategy allows Phase 2 to ship a working classification pipeline. Swapping to real ML in Phase 5 requires only changing the `ClassificationStrategy` bean — no UI or API changes.
- **Help Center (FR-9) is fully independent** and can be built in any phase; deferred to Phase 4 (admin/polish) is correct.
- **Pipeline Monitoring (FR-5) requires the pipeline to exist:** Pipeline UI in Phase 3 needs the Phase 2 classification pipeline as its subject. The FR-5 UI should ship in Phase 3 alongside analytics, not Phase 2.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what reviewers and program managers need to replace the manual process.

- [x] **Authentication + RBAC (FR-1)** — No access without it; JWT + BCrypt + account lockout are non-negotiable for a healthcare-adjacent system
- [x] **PDF Upload + Text Extraction (FR-2.1–2.2)** — The core input mechanism; without it nothing else functions
- [x] **Automated Classification (FR-2.3–2.5) with keyword fallback** — The primary value proposition; keyword fallback allows shipping before ML model is selected
- [x] **Manual Override with audit trail (FR-2.6)** — Without override, the system is unusable when AI is wrong (which it will be ~15% of the time per PRD targets); override reason + `reviewedBy`/`reviewedAt` are required for auditability
- [x] **Classification list with search/filter/paginate (FR-2.8)** — Users need to find and manage their uploaded plans; this is the primary day-to-day UI for reviewers
- [x] **Taxonomy CRUD + tree view (FR-3)** — Classification target space; must exist before classification can work; admin-managed
- [x] **Dashboard KPIs + recent feed (FR-4.1–4.3)** — Program managers need "what's happening" visibility; even a simple count dashboard delivers leadership value
- [x] **Basic Excel export (FR-6.1–6.2)** — Program managers currently produce Excel by hand; one-click export is the most immediate reporting win
- [x] **User Management admin UI (FR-7)** — System admins need to provision reviewers without developer intervention
- [x] **File Management + S3 storage (FR-10)** — Required by upload; without persistent storage, files are lost on server restart

### Add After Validation (v1.x)

Features to add once core classification workflow is validated.

- [ ] **Full Analytics suite (FR-4.4)** — Accuracy trends, confidence distribution, category accuracy, model performance; meaningful once ~100+ classified plans exist; add in Phase 3
- [ ] **Pipeline Monitoring UI (FR-5)** — Ops visibility is important but doesn't block reviewer workflow; add in Phase 3
- [ ] **Notifications (FR-8)** — In-app notification bell; adds polish but reviewers can check status manually in early days
- [ ] **Ad-hoc Report Builder + saved templates (FR-6.3–6.4)** — Basic Excel export covers v1 needs; builder adds power-user value once usage patterns are known
- [ ] **Help Center (FR-9)** — Content cannot be written until the system is built; add in Phase 4 with real help content

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **SSO / SAML / OIDC** — PRD explicitly defers; JWT sufficient for v1 user population
- [ ] **WebSocket real-time pipeline updates** — PRD explicitly defers; polling sufficient
- [ ] **Advanced drift detection + model A/B testing** — MLOps capabilities that require ML model in production first; meaningful only after months of production data
- [ ] **Bulk SFTP batch upload** — Separate infrastructure; web batch upload covers v1 volume
- [ ] **Multi-tenancy** — Fundamental architectural decision; wrong to retrofit
- [ ] **External grant management system integrations** — Requires stakeholder alignment on API contracts; v2+ per PRD

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| PDF Upload + Classification | HIGH | HIGH | P1 |
| Manual Override + Audit Trail | HIGH | MEDIUM | P1 |
| Classification List (search/filter/paginate) | HIGH | MEDIUM | P1 |
| Authentication + RBAC | HIGH | MEDIUM | P1 |
| Taxonomy CRUD + Tree View | HIGH | MEDIUM | P1 |
| Dashboard KPIs | HIGH | MEDIUM | P1 |
| Basic Excel Export | HIGH | LOW | P1 |
| User Management (Admin) | MEDIUM | LOW | P1 |
| S3 File Storage | HIGH | MEDIUM | P1 |
| Analytics Charts (accuracy, confidence) | HIGH | MEDIUM | P2 |
| Pipeline Monitoring | MEDIUM | HIGH | P2 |
| In-App Notifications | MEDIUM | MEDIUM | P2 |
| Ad-hoc Report Builder | MEDIUM | HIGH | P2 |
| Saved Report Templates | MEDIUM | MEDIUM | P2 |
| Per-user Dashboard Config | MEDIUM | MEDIUM | P2 |
| Help Center | LOW | MEDIUM | P2 |
| Model Performance KPIs | MEDIUM | LOW | P2 (requires ML model) |
| Dark/Light Theme | LOW | LOW | P2 (PRD-specified) |
| SSO / SAML | MEDIUM | HIGH | P3 |
| WebSocket Real-time Updates | LOW | HIGH | P3 |
| SFTP Batch Upload | LOW | HIGH | P3 |
| Drift Detection / A/B Testing | MEDIUM | HIGH | P3 |
| Multi-tenancy | LOW | VERY HIGH | P3 |

**Priority key:**
- P1: Must have for launch — core workflow broken without it
- P2: Should have — adds significant value after core works
- P3: Nice to have — future consideration, deferred to v2+

---

## Competitor Feature Analysis

No direct commercial competitors exist that exactly match the PCORI taxonomy classification workflow (this is an internal tool for a specific research taxonomy). The closest reference categories are:

| Feature | Intelligent Document Processing (IDP) tools (e.g., AWS Textract, Azure Form Recognizer) | Healthcare Research Analytics (e.g., REDCap, Covidence) | PCORI Platform Our Approach |
|---------|------|------|------|
| Automated classification | Generic field extraction, no taxonomy mapping | No AI classification; manual data entry | Taxonomy-aware LLM classification with structured output to PCC + code + subcode |
| Manual override | None (batch output, no review workflow) | Human-only annotation | Side-by-side AI vs. human with required reason capture and full audit trail |
| Confidence score | Low-level confidence per field | Not applicable | Classification-level confidence with threshold-based auto-routing to NEEDS_REVIEW |
| Analytics dashboard | None (developer-facing APIs) | Study-level progress, not classification analytics | Accuracy trends, override rates, confidence distribution, model performance — classification-specific metrics |
| Taxonomy management | None | None | Full CRUD on PCORI/ICD-10 hierarchy with tree view; single source of truth |
| Excel reporting | None (API only) | Basic exports | Ad-hoc builder + saved templates; one-click download for leadership reporting |
| Audit trail | API logs only | Basic data history | Full audit: uploadedBy, reviewedBy, timestamps, override reason, model version on every record |
| Pipeline monitoring | CloudWatch / Azure Monitor (ops-facing) | None | Embedded ops console: stage status, health, start/stop/pause/resume, logs |

**Key insight:** No existing tool combines the AI classification workflow + healthcare taxonomy management + analytics + audit trail + reporting in one application for the PCORI research domain. This platform is greenfield by necessity, not by choice.

---

## Domain-Specific Feature Notes

### PCORI Taxonomy Dimension

The classification targets four dimensions simultaneously:
1. **Primary Clinical Condition (PCC)** — e.g., "Type 2 Diabetes", "Heart Failure" — high-level disease area
2. **Taxonomy Category** — e.g., "Shared Decision Making", "Telehealth", "Care Delivery" — PCORI research type
3. **Taxonomy Code** — Short code under category, e.g., "SDM", "DigitalTool"
4. **Taxonomy Subcode** — More specific code, e.g., "NurseLed", "PatientApp"

This multi-label, hierarchical classification is harder than single-label classification and is a primary source of AI error. The confidence score should reflect aggregate certainty across all four dimensions, not just one.

**Implication for features:** The override UI must show all four dimensions with editable fields. The analytics must show accuracy per dimension (PCC accuracy may be high while subcode accuracy is lower). The LLM prompt must explicitly request structured output for all four fields.

### Audit Trail Granularity

In healthcare-adjacent research systems, audit trails must capture:
- **Who** performed each action (uploadedBy, reviewedBy — linked to User entity)
- **When** each action occurred (timestamps, not just "last updated")
- **What** changed (original AI classification preserved even after override; override reason stored)
- **How** the classification was produced (modelVersion stored; allows reproducibility)

Missing any of these creates compliance gaps. The PRD correctly specifies all four.

### Confidence Score Calibration Risk

AI models (especially LLMs) can be confidently wrong. A 0.95 confidence score from an LLM does not mean 95% accuracy in the frequentist sense — LLMs are often miscalibrated. This has a downstream implication:

- **Don't hide classifications with high confidence** from reviewers; program managers should still be able to browse all records
- **The confidence threshold for NEEDS_REVIEW** should be empirically set after observing real override rates, not pre-configured at an arbitrary value
- **The accuracy trend chart** is ground truth (requires human validation) — it should not be inferred from confidence scores

This is a **feature design implication, not just a technical one**: the NEEDS_REVIEW threshold should be admin-configurable in the settings, not hardcoded.

### Override Rate as a First-Class Metric

The PRD targets <15% override rate. This metric is only meaningful if:
1. Override data is consistently captured (reason is required, not optional)
2. Override rate is surfaced prominently on the analytics page
3. Override reasons are categorizable (free text → eventual tagging/categorization for v2)

For v1, free-text override reasons stored in the DB are sufficient. For v2, adding a reason category dropdown would enable systematic pattern analysis.

---

## Sources

- **Primary:** PCORI Research Analytics Platform PRD v1.0 (project_specs/ref_docs/PRD.md) — authoritative requirements source; HIGH confidence
- **Domain context:** Wikipedia on Document Classification (verified 2026-01-10) — classification technique landscape; MEDIUM confidence
- **Healthcare compliance context:** HHS HIPAA Security Rule (hhs.gov, reviewed March 2026) — regulatory backdrop; HIGH confidence
- **IDP platform patterns:** Domain expertise on AWS Textract, Azure Form Recognizer, Rossum, ABBYY — no direct source; MEDIUM confidence (training data, consistent with industry knowledge)
- **Healthcare research tools:** Domain expertise on REDCap, Covidence, DistillerSR — no direct source; MEDIUM confidence (training data, consistent with research tool landscape)

---

*Feature research for: PCORI Research Analytics Platform — healthcare research AI classification and analytics*
*Researched: 2026-05-20*
