## Accessibility Notes (PRD §8.6)

**Target:** WCAG 2.1 AA

---

### Color Contrast

| Context | Requirement | Implementation |
|---|---|---|
| Body text on background | 4.5:1 minimum ratio | Tailwind `text-foreground` on `background` |
| Large text / icons | 3:1 minimum ratio | Headings + icon labels |
| Status badge text on badge background | 4.5:1 | Each badge color pair validated |
| Chart lines on chart background | 3:1 | `chart-1..5` tokens designed for contrast |
| Error text (red) | 4.5:1 | `destructive` token |
| Disabled element text | Exempt from contrast requirement when clearly disabled | `muted` token + `aria-disabled` |

**Status badge contrast pairs (verified):**
- CLASSIFIED: white text on green-700 ✓
- FAILED: white text on red-700 ✓
- NEEDS_REVIEW: black text on amber-400 ✓
- PROCESSING: white text on blue-600 ✓
- PENDING: black text on gray-300 ✓

**Dark mode:** All tokens swap via next-themes; contrast maintained in both light and dark modes.

---

### Status Indicators

**Rule:** Color is NEVER the sole indicator. Every status communicates through color + text label.

Examples:
- Classification status: `● CLASSIFIED` (green dot + "Classified" text)
- Pipeline state: `● RUNNING` (green dot + "RUNNING" text)
- Log level: amber "WARN" text label + color; never just color
- User status: green "Active" / gray "Inactive" — both include text
- Error toasts: red background + explicit error message text

---

### Keyboard Navigation

All interactive elements are keyboard-accessible:

| Component | Keyboard Behavior |
|---|---|
| Navigation links | Tab to focus; Enter to activate |
| Dropdown menus | Tab to open trigger; Arrow keys to navigate; Enter to select; Esc to close |
| Table rows (clickable) | Tab to row; Enter to open detail |
| Dialogs / Modals | Focus trapped inside; Esc closes; Tab cycles through interactive elements |
| Radix UI Accordion (FAQ) | Arrow keys navigate items; Enter/Space toggles; Tab moves between accordions |
| Checkboxes (column selector) | Space toggles; Tab moves between checkboxes |
| Date range picker | Tab/Arrow to navigate calendar; Enter to select date |
| Taxonomy tree | Arrow keys to expand/collapse nodes; Enter to select node |
| Form fields | Standard browser keyboard behavior; explicit label association |

---

### ARIA Labels and Roles

| Element | ARIA Usage |
|---|---|
| Status badges | `role="status"` + `aria-label="[Status: Classified]"` |
| Notification bell | `aria-label="Notifications (3 unread)"` |
| Loading skeletons | `aria-busy="true"` on container; `aria-label="Loading..."` |
| Upload dropzone | `role="button"` + `aria-label="Upload PDF file"` + keyboard-activatable |
| Progress bar (upload) | `role="progressbar"` + `aria-valuenow` + `aria-valuemax` |
| Pipeline state indicator | `aria-live="polite"` for dynamic state changes |
| Charts (Recharts) | `role="img"` + `aria-label="[Chart description]"` on chart container |
| Icon-only buttons | `aria-label` always present (e.g., `aria-label="Close dialog"`) |
| Form fields | `htmlFor` matching `id` on every label; `aria-describedby` for helper text |
| Error messages | `aria-live="assertive"` for inline validation errors |
| Required fields | `aria-required="true"` + visible `*` indicator with legend |

---

### Dialog Behavior

All Radix UI Dialog primitives enforce:
- Focus moves to dialog on open (first focusable element or dialog heading)
- Focus trapped within dialog while open
- ESC closes without action
- Background content inert (`aria-modal="true"`)
- On close: focus returns to the element that triggered the dialog

---

### Screen Reader Considerations

| Feature | Screen Reader Behavior |
|---|---|
| Classification status polling | `aria-live="polite"` on status cell; announces changes without interrupting user |
| Toast notifications (sonner) | `role="alert"` with appropriate `aria-live` level (assertive for errors, polite for success) |
| Pipeline state changes | `aria-live="polite"` on status header; announces new state text |
| Async report generation | Status table row updates; `aria-live` region for "Report ready" announcement |
| Upload progress | `aria-valuenow` updated during upload; percentage announced periodically |
| Unread notification badge | `aria-label` on bell reflects count: "Notifications (3 unread)" |

---

### Form Accessibility

| Rule | Implementation |
|---|---|
| All inputs have explicit labels | `<label htmlFor="field-id">Label</label>` or `aria-label` on input |
| Required fields marked | `aria-required="true"` + visible `*` with `<span aria-hidden="true">*</span>` |
| Field descriptions | `aria-describedby` linking to helper text element |
| Validation errors | `aria-invalid="true"` on field; `aria-describedby` linking to error message |
| Submit disabled state | `disabled` attribute + `aria-disabled="true"` |
| Password complexity | Requirements listed as static text below field; announced when field gains focus |

---

### Focus Management Checklist

- [ ] All modals/dialogs trap focus
- [ ] Escape closes without action on all dialogs
- [ ] After dialog closes, focus returns to trigger element
- [ ] Notification bell panel: focus moves to first notification on open; Esc closes panel
- [ ] Taxonomy tree: arrow key navigation between nodes
- [ ] After successful form submit + page update: focus moves to confirmation area or toast

---
