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
