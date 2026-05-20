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
