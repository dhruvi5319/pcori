## Responsive Considerations (PRD §8.7)

### Breakpoint Definitions

| Breakpoint | Width | Mode | Navigation |
|---|---|---|---|
| Desktop (primary) | ≥1280px | Full multi-column layout | Horizontal top nav bar |
| Tablet | 768–1279px | Reduced columns, tab nav | Top tabs replacing sidebar |
| Mobile | <768px | Single-column, stacked cards | Drawer navigation (hamburger) |

---

### Desktop (≥1280px) — Primary Target

All screens render at full capacity:
- **Dashboard:** 4-column KPI row; 3-column status row; full 4-column quick-actions; full table
- **Classifications:** Full filter bar + table with all columns visible
- **Taxonomy:** Two-pane layout (tree left, detail right) — both panes visible simultaneously
- **Analytics:** Two charts side-by-side per row
- **Pipeline:** Stage cards in a 3-column row
- **Users:** Full table with all columns
- **Navigation:** Full horizontal top nav; all links visible; no overflow menu

---

### Tablet (768–1279px)

| Element | Change |
|---|---|
| Header navigation | Collapses secondary links into overflow `...` menu or tabs |
| Dashboard KPI row | 4 → 2 columns (2 rows of 2 cards) |
| Dashboard quick actions | 4 → 2 columns |
| Taxonomy two-pane | Right pane slides over left (overlay or full-width detail on node select) |
| Analytics charts | Single chart per row (stacked vertically) |
| Pipeline stage cards | 3 → 1 or 2 columns |
| Classification table | Some columns hidden; "Actions" column always visible |

---

### Mobile (<768px)

| Element | Change |
|---|---|
| Navigation | Hamburger icon → drawer slides in from left |
| All tables | Transform to stacked card list (each row becomes a card) |
| All charts | Full viewport width; legend repositioned below chart |
| KPI cards | Single column stack |
| Taxonomy | Tree view becomes full-page list (no two-pane); selecting a node navigates to detail page |
| Dialog/modals | Full-screen overlay on mobile |
| Filter bar | Collapsed behind "Filters" button; expands as a bottom sheet |
| Upload dialog | Full-screen; drag-and-drop works on supported browsers; tap-to-browse primary |
| Override dialog | Full-screen; scrollable |
| Pipeline controls | Stacked button group |
| Date range picker | Full-width; vertical calendar layout |

---

### Classification Table — Column Priority by Breakpoint

| Column | Desktop | Tablet | Mobile |
|---|---|---|---|
| Plan ID | ✓ | ✓ | ✓ |
| Title | ✓ | ✓ | ✓ |
| Status | ✓ | ✓ | ✓ |
| PCC | ✓ | ✓ | ✗ (in card detail) |
| Taxonomy Code | ✓ | ✗ | ✗ |
| Confidence | ✓ | ✓ | ✗ |
| Uploaded At | ✓ | ✗ | ✗ |
| Reviewed By | ✓ | ✗ | ✗ |
| Actions | ✓ | ✓ | ✓ |

On mobile, hidden columns are visible inside the expanded card view.

---

### Toast Notifications (responsive)

| Breakpoint | Position | Width |
|---|---|---|
| Desktop | Top-right | 380px max |
| Tablet | Top-right | 320px max |
| Mobile | Top (full width) | 100% viewport - 16px padding |

---

### Chart Responsive Behavior

All Recharts charts use `ResponsiveContainer width="100%" height={chartHeight}`:
- Desktop: fixed heights (300px for line/bar/area; 250px for histogram)
- Tablet: heights reduced (220px)
- Mobile: heights reduced further (180px); X-axis labels rotated 45° if needed
- `isAnimationActive={false}` in production on ALL breakpoints

---
