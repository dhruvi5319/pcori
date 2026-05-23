---
status: complete
phase: 02-classification-pipeline
source: 02-01-PLAN.md, 02-02-PLAN.md, 02-03-PLAN.md, 02-04-PLAN.md, 02-05-PLAN.md, 02-06-PLAN.md, 02-07-PLAN.md
started: 2026-05-23T22:40:53Z
updated: 2026-05-23T22:55:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. App Starts with MinIO and Services
expected: Run `docker compose up` — all services start (PostgreSQL, MinIO on port 9000/9001, Spring Boot backend). No startup errors. MinIO console reachable at http://localhost:9001.
result: pass

### 2. Database Schema Applied
expected: After startup, the classifications, uploaded_files, and taxonomy_categories tables exist in PostgreSQL. Flyway shows V3 and V4 migrations applied successfully in the migration history.
result: pass

### 3. Classifications Page Loads
expected: Navigating to /classifications shows a paginated table (or empty state with "No research plans yet" + Upload Plan button). The page loads without errors.
result: pass

### 4. Filter Bar and URL Persistence
expected: Using the filter bar (status, date range, PCC, keyword) updates the table results. Active filters appear as removable chips. Navigating away and using browser back restores the same filters (they're in the URL).
result: pass

### 5. Upload PDF Plan
expected: Clicking Upload Plan opens a dialog with a drag-and-drop dropzone. Dropping or selecting a PDF file enables the Upload button. Uploading returns a toast like "Plan [RP-2026-001] submitted — classification in progress" and the new record appears in the list with PROCESSING status (blue animated pulse ring).
result: pass

### 6. Async Classification Pipeline
expected: After upload, the PROCESSING record eventually transitions to CLASSIFIED or NEEDS_REVIEW (within a few minutes). The status badge updates automatically without a page refresh (table polls every 5s while PROCESSING rows exist).
result: pass

### 7. View Classification Dialog
expected: Clicking the View icon on a CLASSIFIED record opens a detail dialog showing all four taxonomy dimensions, a confidence score with a radial gauge (SVG arc in green/amber/red bands that animates on open), and all metadata (plan ID, uploaded by, dates).
result: pass

### 8. NEEDS_REVIEW Amber Banner
expected: Opening a NEEDS_REVIEW classification shows an amber "AI confidence below threshold — please review" banner in the view dialog.
result: pass

### 9. Manual Override
expected: Clicking Override on a classification opens a split-pane dialog: left pane shows AI-assigned values (read-only), right pane has editable dropdowns. Changing a field highlights that row with an amber left border and shows strikethrough on the left pane. Submitting without an override reason shows "Override reason is required" inline error. Submitting with a reason saves the override.
result: pass

### 10. Retry Failed Classification
expected: A FAILED classification has a Retry action icon. Clicking it shows a "Retry Classification" confirm dialog (not styled as destructive/red). Confirming re-queues the classification back to PROCESSING.
result: pass

### 11. Pre-signed PDF Download URL
expected: For a classified record with an uploaded PDF, clicking to get the download URL returns a working pre-signed URL with a 15-minute TTL. Attempting to access the S3/MinIO object directly (without the pre-signed URL) returns 403.
result: pass

### 12. Taxonomy Page — Two-Pane Layout
expected: Navigating to /taxonomy shows a two-pane layout: a 320px left tree pane with collapsible PCORI taxonomy categories, and a right detail pane. Root PCC nodes are expanded by default.
result: pass

### 13. Taxonomy Tree — Node Selection and Detail
expected: Clicking a taxonomy node highlights it (blue accent background + left border) and shows the node detail in the right pane with Edit, Add Child, and Deactivate buttons. Inactive nodes appear at 50% opacity with "(Inactive)" suffix.
result: pass

### 14. Taxonomy — Add Category
expected: Clicking Add Child opens a dialog with a form. As you type the code and select a parent, a live hierarchy breadcrumb preview updates to show where the new category will appear in the tree.
result: pass

### 15. Taxonomy — Edit Category
expected: Clicking Edit on a node replaces the right detail pane with an inline edit form (no dialog). The Save button stays disabled until at least one field is changed.
result: pass

### 16. Taxonomy — Deactivate with Cascade
expected: Clicking Deactivate on a node that has children shows a confirm dialog indicating how many child codes will be affected. The Deactivate button is red (#DC2626). Confirming deactivates the node and all descendants (they appear as opacity-50 with "(Inactive)" in the tree).
result: pass

### 17. Taxonomy — Search
expected: Typing in the taxonomy search bar debounces 300ms (spinner shows during search). Results are returned and clicking a result navigates to that node in the tree.
result: pass

## Summary

total: 17
passed: 17
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
