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
