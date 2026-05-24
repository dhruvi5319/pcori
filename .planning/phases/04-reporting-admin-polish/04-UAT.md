---
status: complete
phase: 04-reporting-admin-polish
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md, 04-06-SUMMARY.md, 04-07-SUMMARY.md, 04-08-SUMMARY.md, 04-09-SUMMARY.md]
started: 2026-05-24T00:00:00Z
updated: 2026-05-24T05:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Reports Page - Three Tabs Render
expected: Navigate to /reports. Page loads with three tabs: "My Reports", "Ad-hoc Builder", and "Templates". The My Reports tab is active by default and shows a table (or empty state) with a gradient "Export All Classifications" button visible.
result: pass

### 2. One-Click Excel Export
expected: Click the gradient "Export All Classifications" button. A loading spinner appears on the button. A .xlsx file download begins (or a toast shows it is generating). The button returns to normal state after triggering.
result: pass

### 3. Ad-hoc Builder - Column Selector
expected: Click the "Ad-hoc Builder" tab. A column selector panel appears on the left with 13 column checkboxes. "Select all" and "Deselect all" links work. Checking and unchecking columns is reflected immediately.
result: pass

### 4. Ad-hoc Builder - Preview and Save Template
expected: In the Ad-hoc Builder, click "Preview Results". A preview panel shows a row count and a 3-row sample table. Clicking "Save as Template" opens a dialog with a name field. Submitting saves the template (or shows a 409 inline error if name is duplicate).
result: pass

### 5. Templates Tab - Run and Delete
expected: Click the "Templates" tab. If templates exist, each row shows "Run", "Edit", and "Delete" hover actions. Clicking "Delete" shows a confirm dialog with a secondary (non-red) button — not a destructive red button.
result: pass

### 6. Users Page - Table and Filter Bar
expected: Navigate to /users (as admin). The page loads a users table showing name, email, role chips (e.g. "Rev", "Mgr"), and status badge (Active/Inactive/Email Unverified). A search bar and role/status filter dropdowns appear above the table.
result: pass

### 7. Users Page - Add User Dialog
expected: Click "Add User". A dialog opens with 6 fields: first name, last name, email, username, password (with show/hide toggle), and a role checkbox group. Submitting creates the user and it appears in the table.
result: pass

### 8. Users Page - Deactivate User
expected: In a user row's action menu, click "Deactivate". A confirm dialog appears. The "Keep Active" button is auto-focused (safer default). The "Deactivate User" button is red (bg-[#DC2626]). Confirming deactivates the user and the row shows "Inactive" badge.
result: pass

### 9. Users Page - Self-Deactivation Guard
expected: As an admin, attempt to deactivate your own account. The action is blocked with an amber warning toast — the self-deactivation guard prevents this operation.
result: pass

### 10. Help Center - Two-Pane Layout
expected: Navigate to /help. A 240px sidebar appears on the left with articles grouped by category. Clicking an article in the sidebar loads its content (rendered as Markdown) in the right panel with a max-width prose container.
result: pass

### 11. Help Center - Search Bar
expected: In the search bar at the top of the help page, type 1 character — a "Type at least 2 characters" message appears. Type a 2+ character query — search results appear in an overlay after ~300ms. Pressing Escape or clicking outside dismisses the overlay.
result: pass

### 12. Help Center - FAQ Accordion
expected: In the help page, a FAQ section appears. Clicking a FAQ question expands it to reveal the answer. The chevron rotates 90°. Only one FAQ is open at a time. Clicking the open FAQ closes it.
result: pass

### 13. Help Center - Feedback Widget
expected: At the bottom of a help article, thumbs-up and thumbs-down buttons appear. Clicking one highlights the selection. Submitting shows a "Thank you for your feedback!" message with a checkmark. On reload, the widget remembers the submitted state (localStorage persistence).
result: pass

### 14. Sidebar Navigation - Phase 4 Routes
expected: In the app sidebar, "Reports" link appears for Manager/Viewer roles (FileSpreadsheet icon), "Users" link appears for Admin role only (Users icon), and "Help" link appears for all authenticated users (HelpCircle icon). Each routes to its respective page correctly.
result: pass

## Summary

total: 14
passed: 14
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
