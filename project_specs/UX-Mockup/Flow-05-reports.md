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
